from datetime import date
from flask import Blueprint, request, jsonify, g
from routes.auth import require_admin
from extensions import db
from models.study_config import StudyConfig
from models.game_session import GameSession
from utils.audit import write_audit
from utils.semester import semester_week_of

config_bp = Blueprint('config', __name__)


def _validate_weeks(raw: list) -> tuple[list[str], str | None]:
    """Validate and normalise a list of ISO date strings. Returns (cleaned, error)."""
    if not isinstance(raw, list):
        return [], 'semesterWeeks must be an array'
    if len(raw) > 14:
        return [], 'semesterWeeks must have at most 14 entries'
    cleaned = []
    for i, item in enumerate(raw):
        if item is None or item == '':
            cleaned.append(None)
            continue
        try:
            cleaned.append(date.fromisoformat(item).isoformat())
        except (ValueError, TypeError):
            return [], f'semesterWeeks[{i}] is not a valid ISO date (YYYY-MM-DD)'
    return cleaned, None


@config_bp.route('/config', methods=['GET'])
@require_admin
def get_config():
    cfg = StudyConfig.get()
    return jsonify({
        'semesterWeeks': cfg.semester_weeks or [],
        'updatedAt':     cfg.updated_at.isoformat() if cfg.updated_at else None,
    })


@config_bp.route('/config', methods=['PATCH'])
@require_admin
def update_config():
    data = request.get_json(silent=True) or {}

    cleaned, error = _validate_weeks(data.get('semesterWeeks', []))
    if error:
        return jsonify({'error': error}), 400

    cfg = StudyConfig.get()
    cfg.semester_weeks = cleaned or None
    write_audit(
        'CONFIG_UPDATED',
        entity_type='study_config',
        entity_id='1',
        performed_by=g.current_user,
        details={'semesterWeeks': cleaned},
    )
    db.session.commit()
    return jsonify({'semesterWeeks': cfg.semester_weeks or []})


@config_bp.route('/config/backfill', methods=['POST'])
@require_admin
def backfill_semester_weeks():
    """Retroactively tag all sessions that have semester_week = NULL."""
    cfg = StudyConfig.get()
    if not cfg.semester_weeks:
        return jsonify({'error': 'No semester weeks configured'}), 400

    sessions = db.session.execute(
        db.select(GameSession).where(GameSession.semester_week.is_(None))
    ).scalars().all()

    updated = 0
    for session in sessions:
        if not session.started_at:
            continue
        week = semester_week_of(session.started_at, cfg.semester_weeks)
        if week:
            session.semester_week = week
            updated += 1

    db.session.commit()
    return jsonify({'updated': updated})
