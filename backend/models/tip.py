import uuid
from datetime import datetime, timezone
from extensions import db


class Tip(db.Model):
    __tablename__ = 'tips'

    id          = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = db.Column(db.String(50), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    position    = db.Column(db.SmallInteger, default=0)
    updated_at  = db.Column(db.DateTime(timezone=True),
                            default=lambda: datetime.now(timezone.utc))
