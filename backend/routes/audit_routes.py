from flask import Blueprint, request, jsonify
from routes.auth import require_admin
from extensions import db
from models import AuditLog

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('/audit-log', methods=['GET'])
@require_admin
def audit_log():
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    action   = request.args.get('action', '')

    query = db.select(AuditLog).order_by(AuditLog.performed_at.desc())
    if action:
        query = query.where(AuditLog.action == action)

    logs = db.paginate(query, page=page, per_page=per_page, error_out=False)
    return jsonify({
        'entries': [{
            'id':          l.id,
            'action':      l.action,
            'actor':       l.performed_by or '—',
            'targetTable': l.entity_type,
            'detail':      str(l.details) if l.details else '—',
            'occurredAt':  l.performed_at.isoformat() if l.performed_at else '',
        } for l in logs.items],
        'total': logs.total,
        'page':  logs.page,
        'pages': logs.pages,
    })
