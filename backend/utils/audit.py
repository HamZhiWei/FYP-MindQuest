from extensions import db
from models.audit_log import AuditLog


def write_audit(action: str, entity_type: str = None, entity_id: str = None,
                performed_by: str = 'admin', details: dict = None):
    db.session.add(AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        performed_by=performed_by,
        details=details,
    ))
