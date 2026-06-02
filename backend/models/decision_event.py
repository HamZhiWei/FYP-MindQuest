import uuid
from datetime import datetime, timezone
from extensions import db


def _now():
    return datetime.now(timezone.utc)


class DecisionEvent(db.Model):
    __tablename__ = 'decision_events'

    id                  = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id          = db.Column(db.String(36), db.ForeignKey('game_sessions.id'), nullable=False)
    node_id             = db.Column(db.String(10), nullable=False)
    choice_key          = db.Column(db.String(50), nullable=False)
    reaction_time_ms    = db.Column(db.Integer, nullable=False)
    risk_level          = db.Column(db.String(10))
    anxiety_proxy_score = db.Column(db.Float)
    occurred_at         = db.Column(db.DateTime(timezone=True), default=_now)

    def to_dict(self):
        return {
            'id': self.id,
            'nodeId': self.node_id,
            'choiceKey': self.choice_key,
            'reactionTimeMs': self.reaction_time_ms,
            'riskLevel': self.risk_level,
            'anxietyProxyScore': self.anxiety_proxy_score,
            'occurredAt': self.occurred_at.isoformat() if self.occurred_at else None,
        }
