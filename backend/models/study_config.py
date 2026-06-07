from datetime import datetime, timezone
from extensions import db


def _now():
    return datetime.now(timezone.utc)


class StudyConfig(db.Model):
    __tablename__ = 'study_config'

    # Single-row singleton — always id = 1
    id              = db.Column(db.Integer, primary_key=True)
    # List of up to 14 ISO date strings, one per teaching week.
    # Index 0 = Week 1, index 13 = Week 14.
    # Break weeks are simply omitted — the dates jump over them.
    semester_weeks  = db.Column(db.JSON, nullable=True)
    updated_at      = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now)

    @staticmethod
    def get() -> 'StudyConfig':
        cfg = db.session.get(StudyConfig, 1)
        if cfg is None:
            cfg = StudyConfig(id=1, semester_weeks=None)
            db.session.add(cfg)
            db.session.commit()
        return cfg
