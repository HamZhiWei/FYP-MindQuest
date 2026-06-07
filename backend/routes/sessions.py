import traceback
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from extensions import db
from models import GameSession, DecisionEvent
from services.wellbeing_scorer import WellbeingScorer
from services.gaming_detector import GamingDetector
from utils.semester import semester_week_of, time_of_day_bucket

sessions_bp = Blueprint('sessions', __name__)


def _get_semester_weeks():
    from models.study_config import StudyConfig
    cfg = db.session.get(StudyConfig, 1)
    return cfg.semester_weeks if cfg else None

_YEAR_MAP = {'Year 1': 1, 'Year 2': 2, 'Year 3': 3, 'Year 4': 4, 'Postgraduate': 5}


def _now():
    return datetime.now(timezone.utc)


def _parse_year(value) -> int | None:
    """Accept 'Year 1'/'Year 2'/… strings or plain integers."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    return _YEAR_MAP.get(str(value))


@sessions_bp.route('/sessions/init', methods=['POST'])
def init_session():
    try:
        data = request.get_json(silent=True) or {}
        profile = data.get('profileData', {})
        anon_token = data.get('anonSessionToken') or str(uuid.uuid4())

        session = GameSession(
            scenario_id=data.get('scenarioId') or 'unknown',
            anon_session_token=anon_token,
            started_at=_now(),
            gender=profile.get('gender'),
            age_group=profile.get('ageGroup'),
            faculty=profile.get('faculty'),
            year_of_study=_parse_year(profile.get('yearOfStudy')),
        )
        db.session.add(session)
        db.session.commit()
        return jsonify({'sessionId': session.id, 'anonSessionToken': anon_token}), 201

    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@sessions_bp.route('/sessions', methods=['POST'])
def submit_session():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        for field in ('scenarioId', 'choices', 'startedAt', 'completedAt'):
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        if not isinstance(data['choices'], list):
            return jsonify({'error': 'choices must be an array'}), 400

        try:
            started_at = datetime.fromisoformat(data['startedAt'].replace('Z', '+00:00'))
            ended_at   = datetime.fromisoformat(data['completedAt'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'startedAt and completedAt must be ISO 8601 strings'}), 400

        choices = data['choices']
        anon_token = (
            data.get('anonSessionToken')
            or request.headers.get('X-Session-ID')
            or str(uuid.uuid4())
        )

        # Look up the init session (profile holder) to copy demographics
        init_id = data.get('sessionId')
        init_session = db.session.get(GameSession, init_id) if init_id else None

        # Always create a fresh row per scenario run so multiple plays don't collide
        session = GameSession(
            scenario_id=data['scenarioId'],
            anon_session_token=anon_token,
            started_at=started_at,
            ended_at=ended_at,
            completed=data.get('completed', True),
            total_decisions_made=len(choices),
            semester_week=semester_week_of(started_at, _get_semester_weeks()),
            time_of_day_bucket=time_of_day_bucket(started_at),
            # Copy profile from init session if available
            gender=init_session.gender if init_session else None,
            age_group=init_session.age_group if init_session else None,
            faculty=init_session.faculty if init_session else None,
            year_of_study=init_session.year_of_study if init_session else None,
        )
        db.session.add(session)
        db.session.flush()  # ensures session.id is set before child rows reference it

        for choice in choices:
            if not choice.get('nodeId'):
                return jsonify({'error': 'Each choice requires nodeId'}), 400
            if not choice.get('choiceKey'):
                return jsonify({'error': 'Each choice requires choiceKey'}), 400
            event = DecisionEvent(
                session_id=session.id,
                node_id=choice['nodeId'],
                choice_key=choice['choiceKey'],
                reaction_time_ms=int(choice.get('reactionTimeMs', 0)),
                risk_level=choice.get('riskLevel', 'low'),
            )
            db.session.add(event)

        wellbeing = WellbeingScorer.score(session, choices)
        db.session.add(wellbeing)

        flagged, reason = GamingDetector.check(choices)
        if flagged:
            session.flagged_as_invalid = True
            session.flag_reason = reason

        db.session.commit()
        return jsonify({
            'sessionId': session.id,
            'compositeIndex': wellbeing.composite_index,
            'riskBand': wellbeing.risk_band,
        }), 201

    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@sessions_bp.route('/profile', methods=['POST'])
def submit_profile():
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get('sessionId') or request.headers.get('X-Session-ID')

        year = _parse_year(data.get('yearOfStudy'))

        if session_id:
            session = db.session.get(GameSession, session_id)
            if not session:
                return jsonify({'error': 'Session not found'}), 404
            session.gender       = data.get('gender',    session.gender)
            session.age_group    = data.get('ageGroup',  session.age_group)
            session.faculty      = data.get('faculty',   session.faculty)
            if year is not None:
                session.year_of_study = year
            db.session.commit()
            return jsonify({'ok': True, 'sessionId': session.id}), 200

        anon_token = data.get('anonSessionToken') or str(uuid.uuid4())
        session = GameSession(
            scenario_id='pending',
            anon_session_token=anon_token,
            started_at=_now(),
            gender=data.get('gender'),
            age_group=data.get('ageGroup'),
            faculty=data.get('faculty'),
            year_of_study=year,
        )
        db.session.add(session)
        db.session.commit()
        return jsonify({'ok': True, 'sessionId': session.id}), 201

    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@sessions_bp.route('/sessions/<session_id>/flag-review', methods=['PATCH'])
def flag_review(session_id):
    try:
        from routes.auth import require_admin
        from utils.audit import write_audit
        from flask import g

        @require_admin
        def _inner():
            data     = request.get_json(silent=True) or {}
            decision = data.get('decision')
            if decision not in ('keep', 'exclude'):
                return jsonify({'error': 'decision must be "keep" or "exclude"'}), 400
            session = db.get_or_404(GameSession, session_id)
            if decision == 'exclude':
                session.flagged_as_invalid = True
                session.flag_reason = (session.flag_reason or '') + ' [excluded by admin]'
            else:
                session.flagged_as_invalid = False
                session.flag_reason        = None
            write_audit('FLAG_REVIEWED', entity_type='game_sessions',
                        entity_id=session_id, performed_by=g.current_user,
                        details={'decision': decision})
            db.session.commit()
            return jsonify({'ok': True, 'decision': decision})

        return _inner()
    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500
