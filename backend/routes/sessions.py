import traceback
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from extensions import db
from models import GameSession, DecisionEvent
from services.wellbeing_scorer import WellbeingScorer
from services.gaming_detector import GamingDetector

sessions_bp = Blueprint('sessions', __name__)


def _now():
    return datetime.now(timezone.utc)


@sessions_bp.route('/sessions/init', methods=['POST'])
def init_session():
    try:
        data = request.get_json(silent=True) or {}
        profile = data.get('profileData', {})
        anon_token = data.get('anonSessionToken') or str(uuid.uuid4())

        year = profile.get('yearOfStudy')
        if year is not None:
            try:
                year = int(year)
            except (ValueError, TypeError):
                return jsonify({'error': 'yearOfStudy must be an integer'}), 400

        session = GameSession(
            scenario_id=data.get('scenarioId') or 'unknown',
            anon_session_token=anon_token,
            started_at=_now(),
            gender=profile.get('gender'),
            age_group=profile.get('ageGroup'),
            faculty=profile.get('faculty'),
            year_of_study=year,
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

        session = GameSession(
            scenario_id=data['scenarioId'],
            anon_session_token=anon_token,
            started_at=started_at,
            ended_at=ended_at,
            completed=data.get('completed', True),
            total_decisions_made=len(choices),
        )
        db.session.add(session)

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

        year = data.get('yearOfStudy')
        if year is not None:
            try:
                year = int(year)
            except (ValueError, TypeError):
                return jsonify({'error': 'yearOfStudy must be an integer'}), 400

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
