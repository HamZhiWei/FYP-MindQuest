import uuid
from datetime import datetime, timezone
from extensions import db


def _now():
    return datetime.now(timezone.utc)


class GameSession(db.Model):
    __tablename__ = 'game_sessions'

    id                   = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id          = db.Column(db.String(50), nullable=False)
    anon_session_token   = db.Column(db.String(64), nullable=False)
    started_at           = db.Column(db.DateTime(timezone=True), default=_now)
    ended_at             = db.Column(db.DateTime(timezone=True))
    completed            = db.Column(db.Boolean, default=False)
    dropout_at_node_id   = db.Column(db.String(10))
    total_decisions_made = db.Column(db.SmallInteger, default=0)
    semester_week        = db.Column(db.SmallInteger)
    time_of_day_bucket   = db.Column(db.String(10))
    flagged_as_invalid   = db.Column(db.Boolean, default=False)
    flag_reason          = db.Column(db.String(200))
    gender               = db.Column(db.String(20))
    faculty              = db.Column(db.String(100))
    year_of_study        = db.Column(db.SmallInteger)
    age_group            = db.Column(db.String(10))
    created_at           = db.Column(db.DateTime(timezone=True), default=_now)

    decision_events = db.relationship('DecisionEvent', backref='session', lazy=True,
                                      cascade='all, delete-orphan')
    wellbeing_score = db.relationship('WellbeingScore', backref='session', uselist=False,
                                      cascade='all, delete-orphan')
    pss10_response  = db.relationship('PSS10Response', backref='session', uselist=False,
                                      cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'scenarioId': self.scenario_id,
            'anonSessionToken': self.anon_session_token,
            'startedAt': self.started_at.isoformat() if self.started_at else None,
            'endedAt': self.ended_at.isoformat() if self.ended_at else None,
            'completed': self.completed,
            'totalDecisionsMade': self.total_decisions_made,
            'flaggedAsInvalid': self.flagged_as_invalid,
            'profile': {
                'gender': self.gender,
                'faculty': self.faculty,
                'yearOfStudy': self.year_of_study,
                'ageGroup': self.age_group,
            },
        }
