import uuid
from datetime import datetime, timezone
from extensions import db


def _now():
    return datetime.now(timezone.utc)


class PSS10Response(db.Model):
    __tablename__ = 'pss10_responses'

    id                 = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id         = db.Column(db.String(36), db.ForeignKey('game_sessions.id'), unique=True)
    anon_session_token = db.Column(db.String(64), nullable=False)
    q1  = db.Column(db.SmallInteger, nullable=False)
    q2  = db.Column(db.SmallInteger, nullable=False)
    q3  = db.Column(db.SmallInteger, nullable=False)
    q4  = db.Column(db.SmallInteger, nullable=False)
    q5  = db.Column(db.SmallInteger, nullable=False)
    q6  = db.Column(db.SmallInteger, nullable=False)  # reverse scored
    q7  = db.Column(db.SmallInteger, nullable=False)  # reverse scored
    q8  = db.Column(db.SmallInteger, nullable=False)  # reverse scored
    q9  = db.Column(db.SmallInteger, nullable=False)  # reverse scored
    q10 = db.Column(db.SmallInteger, nullable=False)
    total_score       = db.Column(db.SmallInteger)
    stress_band       = db.Column(db.String(10))
    collection_method = db.Column(db.String(20), default='POST_GAME')
    semester_week     = db.Column(db.SmallInteger)
    responded_at      = db.Column(db.DateTime(timezone=True), default=_now)

    def compute_total(self):
        forward  = self.q1 + self.q2 + self.q3 + self.q4 + self.q5 + self.q10
        reversed_= (4 - self.q6) + (4 - self.q7) + (4 - self.q8) + (4 - self.q9)
        self.total_score = forward + reversed_
        if self.total_score <= 13:
            self.stress_band = 'LOW'
        elif self.total_score <= 26:
            self.stress_band = 'MODERATE'
        else:
            self.stress_band = 'HIGH'

    def to_dict(self):
        return {
            'totalScore': self.total_score,
            'stressBand': self.stress_band,
            'responses': {
                f'q{i}': getattr(self, f'q{i}') for i in range(1, 11)
            },
        }
