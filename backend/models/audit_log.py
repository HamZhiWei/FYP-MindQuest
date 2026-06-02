import uuid
from datetime import datetime
from extensions import db


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50), nullable=True)
    entity_id = db.Column(db.String(36), nullable=True)
    performed_by = db.Column(db.String(100), nullable=True)
    performed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    details = db.Column(db.JSON, nullable=True)
