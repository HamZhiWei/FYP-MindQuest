import csv
import io
from flask import Blueprint, Response, g
from routes.auth import require_admin
from extensions import db
from models import GameSession, WellbeingScore, PSS10Response, AuditLog
from utils.audit import write_audit

export_bp = Blueprint('export', __name__)

_SKIP = ['unknown', 'pending', 'pss10-only']


def _csv_response(headers, rows, filename):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    return Response(
        buf.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'},
    )


@export_bp.route('/export/pilot', methods=['GET'])
@require_admin
def export_pilot():
    rows = db.session.execute(
        db.select(GameSession, WellbeingScore, PSS10Response)
        .join(WellbeingScore, WellbeingScore.session_id == GameSession.id)
        .join(PSS10Response, PSS10Response.session_id == GameSession.id)
        .where(GameSession.completed.is_(True))
        .where(GameSession.flagged_as_invalid.is_(False))
        .where(GameSession.scenario_id.notin_(_SKIP))
    ).all()

    headers = [
        'session_id', 'scenario_id', 'gender', 'age_group', 'faculty',
        'year_of_study', 'semester_week', 'composite_index', 'risk_band',
        'avoidance', 'sleep_sacrifice', 'anxiety_rt', 'social_withdrawal',
        'irritability', 'catastrophising', 'resilience_failure',
        'pss10_total', 'pss10_band',
    ]

    data = [[
        gs.id[:8], gs.scenario_id, gs.gender or '', gs.age_group or '',
        gs.faculty or '', gs.year_of_study or '', gs.semester_week or '',
        ws.composite_index, ws.risk_band,
        ws.avoidance_score, ws.sleep_sacrifice_score, ws.anxiety_proxy_score,
        ws.social_withdrawal_score, ws.irritability_score,
        ws.catastrophising_score, ws.resilience_failure_score,
        pr.total_score, pr.stress_band,
    ] for gs, ws, pr in rows]

    write_audit('EXPORT', entity_type='game_sessions', performed_by=g.current_user,
                details={'type': 'pilot', 'rows': len(data)})
    db.session.commit()
    return _csv_response(headers, data, 'mindquest_pilot.csv')


@export_bp.route('/export/sessions', methods=['GET'])
@require_admin
def export_sessions():
    rows = db.session.execute(
        db.select(WellbeingScore, GameSession)
        .join(GameSession, GameSession.id == WellbeingScore.session_id)
        .where(GameSession.scenario_id.notin_(_SKIP))
        .order_by(WellbeingScore.scored_at.desc())
    ).all()

    headers = [
        'session_id', 'scenario_id', 'composite_index', 'risk_band',
        'avoidance', 'sleep_sacrifice', 'anxiety_rt', 'social_withdrawal',
        'irritability', 'catastrophising', 'resilience_failure',
        'dropout_penalty', 'weight_version', 'scored_at',
    ]

    data = [[
        ws.session_id[:8], gs.scenario_id,
        ws.composite_index, ws.risk_band,
        ws.avoidance_score, ws.sleep_sacrifice_score, ws.anxiety_proxy_score,
        ws.social_withdrawal_score, ws.irritability_score,
        ws.catastrophising_score, ws.resilience_failure_score,
        ws.dropout_penalty, ws.weight_version,
        ws.scored_at.isoformat() if ws.scored_at else '',
    ] for ws, gs in rows]

    write_audit('EXPORT', entity_type='wellbeing_scores', performed_by=g.current_user,
                details={'type': 'sessions', 'rows': len(data)})
    db.session.commit()
    return _csv_response(headers, data, 'mindquest_scores.csv')


@export_bp.route('/export/audit', methods=['GET'])
@require_admin
def export_audit():
    logs = db.session.execute(
        db.select(AuditLog).order_by(AuditLog.performed_at.desc())
    ).scalars().all()

    headers = ['id', 'action', 'entity_type', 'entity_id', 'performed_by', 'performed_at']
    data = [[
        l.id[:8], l.action, l.entity_type or '', l.entity_id or '',
        l.performed_by or '',
        l.performed_at.isoformat() if l.performed_at else '',
    ] for l in logs]

    write_audit('EXPORT', entity_type='audit_logs', performed_by=g.current_user,
                details={'type': 'audit', 'rows': len(data)})
    db.session.commit()
    return _csv_response(headers, data, 'mindquest_audit.csv')
