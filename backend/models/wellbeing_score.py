import uuid
from datetime import datetime, timezone
from extensions import db


def _now():
    return datetime.now(timezone.utc)


class WellbeingScore(db.Model):
    __tablename__ = 'wellbeing_scores'

    id                       = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id               = db.Column(db.String(36), db.ForeignKey('game_sessions.id'), unique=True)
    avoidance_score          = db.Column(db.Float, nullable=False)
    sleep_sacrifice_score    = db.Column(db.Float, nullable=False)
    anxiety_proxy_score      = db.Column(db.Float, nullable=False)
    social_withdrawal_score  = db.Column(db.Float, nullable=False)
    irritability_score       = db.Column(db.Float, nullable=False)
    catastrophising_score    = db.Column(db.Float, nullable=False)
    resilience_failure_score = db.Column(db.Float, nullable=False)
    dropout_penalty          = db.Column(db.Float, nullable=False, default=0.0)
    composite_index          = db.Column(db.Float, nullable=False)
    risk_band                = db.Column(db.String(10), nullable=False)
    weight_version           = db.Column(db.String(20), default='pre-pilot-v1')
    scored_at                = db.Column(db.DateTime(timezone=True), default=_now)

    def to_dict(self):
        return {
            'compositeIndex': self.composite_index,
            'riskBand': self.risk_band,
            'weightVersion': self.weight_version,
            'scoredAt': self.scored_at.isoformat() if self.scored_at else None,
            'breakdown': {
                'avoidance': self.avoidance_score,
                'sleepSacrifice': self.sleep_sacrifice_score,
                'anxietyProxy': self.anxiety_proxy_score,
                'socialWithdrawal': self.social_withdrawal_score,
                'irritability': self.irritability_score,
                'catastrophising': self.catastrophising_score,
                'resilienceFailure': self.resilience_failure_score,
                'dropoutPenalty': self.dropout_penalty,
            },
        }
