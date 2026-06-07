import uuid
from datetime import datetime, timezone
from extensions import db


class WellbeingTip(db.Model):
    __tablename__ = 'wellbeing_tips'

    id          = db.Column(db.String(36), primary_key=True,
                    default=lambda: str(uuid.uuid4()))
    scenario_id = db.Column(db.String(50), nullable=False)
    tip_order   = db.Column(db.SmallInteger, nullable=False)
    tip_text    = db.Column(db.Text, nullable=False)
    pss_items   = db.Column(db.String(50))   # e.g. "Q2,Q6,Q10"
    indicator   = db.Column(db.String(50))   # e.g. "avoidance"
    is_active   = db.Column(db.Boolean, default=True, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow,
                    onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('scenario_id', 'tip_order',
                            name='uq_scenario_tip_order'),
    )

    def to_dict(self):
        return {
            'id':         self.id,
            'scenarioId': self.scenario_id,
            'tipOrder':   self.tip_order,
            'tipText':    self.tip_text,
            'pssItems':   self.pss_items,
            'indicator':  self.indicator,
            'isActive':   self.is_active,
            'createdAt':  self.created_at.isoformat(),
            'updatedAt':  self.updated_at.isoformat(),
        }
