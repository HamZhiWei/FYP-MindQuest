import uuid
from datetime import datetime, timezone
from extensions import db


def _now():
    return datetime.now(timezone.utc)


class ScoringWeight(db.Model):
    __tablename__ = 'scoring_weight_versions'

    id               = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version_label    = db.Column(db.String(30), unique=True, nullable=False)
    w_game_deadline  = db.Column(db.Float, nullable=False, default=0.40)
    w_game_sleep     = db.Column(db.Float, nullable=False, default=0.35)
    w_game_social    = db.Column(db.Float, nullable=False, default=0.25)
    indicator_weights      = db.Column(db.JSON, nullable=False)
    rt_threshold_low_ms    = db.Column(db.Integer, default=2000)
    rt_threshold_mid_ms    = db.Column(db.Integer, default=4000)
    rt_threshold_high_ms   = db.Column(db.Integer, default=7000)
    risk_band_low_max      = db.Column(db.Float, default=3.5)
    risk_band_mod_max      = db.Column(db.Float, default=6.5)
    is_active              = db.Column(db.Boolean, default=False)
    pilot_pearson_r        = db.Column(db.Float)
    calibration_note       = db.Column(db.Text)
    applied_at             = db.Column(db.DateTime(timezone=True), default=_now)
