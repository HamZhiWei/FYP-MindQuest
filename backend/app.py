from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db
from routes.sessions import sessions_bp
from routes.pss10 import pss10_bp
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.analytics import analytics_bp
from routes.audit_routes import audit_bp
from routes.weights_routes import weights_bp
from routes.tips_routes import tips_bp
from routes.export_routes import export_bp
from routes.config_routes import config_bp


_PILOT_V1_WEIGHTS = {
    'deadline': {
        'avoidance': 0.35, 'sleep_sacrifice': 0.30,
        'anxiety_rt': 0.20, 'social_withdrawal': 0.10, 'dropout': 0.05,
    },
    'sleep': {
        'routine': 0.35, 'sleep_quality': 0.30,
        'recovery': 0.25, 'irritability': 0.10,
    },
    'social': {
        'withdrawal': 0.35, 'support_rejection': 0.30,
        'catastrophising': 0.25, 'resilience': 0.10,
    },
}

_TIPS_SEED = [
    # Assignment deadline
    ('assignment-deadline', 1, 'Break your work into 25-minute focused blocks. Set a timer and commit to starting — not finishing — the task.', 'Q2,Q10', 'avoidance'),
    ('assignment-deadline', 2, 'Put your phone face-down or in another room before starting. Social media checks during study increase total completion time by up to 40%.', 'Q2,Q6', 'avoidance'),
    ('assignment-deadline', 3, 'Sleeping fewer than 6 hours reduces cognitive performance more than being mildly drunk. A 20-minute nap before 3 PM beats an extra coffee.', 'Q3,Q9', 'sleep_sacrifice'),
    ('assignment-deadline', 4, 'Studying with a friend — even silently on a video call — reduces avoidance. Peer presence reduces anxiety and keeps you accountable.', 'Q6,Q8', 'social_withdrawal'),
    ('assignment-deadline', 5, 'Submitting something imperfect on time is almost always better than submitting something polished late. Done is better than perfect at 7:52 AM.', 'Q1,Q4', 'anxiety_rt'),
    # Sleep decisions
    ('sleep-decisions', 1, 'The blue light from your phone suppresses melatonin for up to 3 hours. Putting the phone in a drawer is the single most effective sleep hygiene action tonight.', 'Q6,Q10', 'routine'),
    ('sleep-decisions', 2, 'If your mind races when you lie down, try box breathing: in for 4 counts, hold for 4, out for 4, hold for 4. Repeat 4 times. It activates your parasympathetic system within 90 seconds.', 'Q3,Q7', 'sleep_quality'),
    ('sleep-decisions', 3, 'Write down the one thing worrying you most — and one small action for tomorrow — before you sleep. Getting it out of your head onto paper reduces nocturnal rumination.', 'Q4,Q9', 'sleep_quality'),
    ('sleep-decisions', 4, 'Set one alarm only and put your phone across the room. Snoozing fragments sleep and makes you feel worse than simply getting up.', 'Q8,Q9', 'recovery'),
    ('sleep-decisions', 5, 'If you feel irritable after poor sleep, name the emotion before reacting. Saying "I am irritable because I am sleep-deprived" creates a pause between trigger and response.', 'Q5,Q7', 'irritability'),
    # Social interaction
    ('social-interaction', 1, 'When overwhelmed, a brief honest reply is far better than leaving it on read. "I am really stretched right now, can we talk tomorrow?" preserves the relationship.', 'Q4,Q6', 'social_withdrawal'),
    ('social-interaction', 2, 'Social support is the single most replicated stress buffer in psychology research. Accepting a friend reaching out reduces cortisol more effectively than being alone with the same workload.', 'Q4,Q8', 'support_rejection'),
    ('social-interaction', 3, 'When you receive an ambiguous message from a lecturer, assume a neutral interpretation first and reply promptly. Unanswered vague messages grow much larger in your mind than they are in reality.', 'Q1,Q2,Q3', 'catastrophising'),
    ('social-interaction', 4, 'Public criticism is feedback about your work, not a verdict on you as a person. "My discussion section needs restructuring" is a solvable task. "I am a disaster" is not useful.', 'Q5,Q9', 'resilience_failure'),
    ('social-interaction', 5, 'If group work feels unbalanced, name it early and calmly. A short message now is much easier than a resentful confrontation later.', 'Q2,Q6', 'social_withdrawal'),
]


def _seed_weights():
    from models.scoring_weight import ScoringWeight
    if db.session.execute(db.select(ScoringWeight)).first():
        return
    db.session.add(ScoringWeight(
        version_label='pre-pilot-v1',
        w_game_deadline=0.40, w_game_sleep=0.35, w_game_social=0.25,
        indicator_weights=_PILOT_V1_WEIGHTS,
        rt_threshold_low_ms=2000, rt_threshold_mid_ms=4000, rt_threshold_high_ms=7000,
        risk_band_low_max=3.5, risk_band_mod_max=6.5,
        is_active=True,
        calibration_note='Pre-pilot defaults — update after calibration study.',
    ))
    db.session.commit()
    print('[seed] Inserted pre-pilot-v1 scoring weights.')


def _seed_tips():
    from models.wellbeing_tip import WellbeingTip
    if db.session.execute(db.select(WellbeingTip)).first():
        return
    for scenario_id, tip_order, tip_text, pss_items, indicator in _TIPS_SEED:
        db.session.add(WellbeingTip(
            scenario_id=scenario_id,
            tip_order=tip_order,
            tip_text=tip_text,
            pss_items=pss_items,
            indicator=indicator,
        ))
    db.session.commit()
    print('[seed] Inserted default wellbeing tips.')


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)

    CORS(
        app,
        origins=app.config['CORS_ORIGINS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Session-ID'],
    )

    app.register_blueprint(sessions_bp,  url_prefix='/api')
    app.register_blueprint(pss10_bp,     url_prefix='/api')
    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(analytics_bp, url_prefix='/api/dashboard')
    app.register_blueprint(audit_bp,     url_prefix='/api')
    app.register_blueprint(weights_bp,   url_prefix='/api')
    app.register_blueprint(tips_bp,      url_prefix='/api')
    app.register_blueprint(export_bp,    url_prefix='/api')
    app.register_blueprint(config_bp,   url_prefix='/api')

    with app.app_context():
        import models  # noqa: F401
        db.create_all()
        _seed_weights()
        _seed_tips()

    return app
