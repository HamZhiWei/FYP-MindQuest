from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, jwt
from routes.sessions import sessions_bp
from routes.pss10 import pss10_bp
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp


_PILOT_V1_WEIGHTS = {
    'deadline': {
        'avoidance': 0.35,
        'sleep_sacrifice': 0.30,
        'anxiety_rt': 0.20,
        'social_withdrawal': 0.10,
        'dropout': 0.05,
    },
    'sleep': {
        'routine': 0.35,
        'sleep_quality': 0.30,
        'recovery': 0.25,
        'irritability': 0.10,
    },
    'social': {
        'withdrawal': 0.35,
        'support_rejection': 0.30,
        'catastrophising': 0.25,
        'resilience': 0.10,
    },
}


def _seed_weights():
    from models.scoring_weight import ScoringWeight
    if db.session.execute(db.select(ScoringWeight)).first():
        return
    seed = ScoringWeight(
        version_label='pre-pilot-v1',
        w_game_deadline=0.40,
        w_game_sleep=0.35,
        w_game_social=0.25,
        indicator_weights=_PILOT_V1_WEIGHTS,
        rt_threshold_low_ms=2000,
        rt_threshold_mid_ms=4000,
        rt_threshold_high_ms=7000,
        risk_band_low_max=3.5,
        risk_band_mod_max=6.5,
        is_active=True,
        calibration_note='Pre-pilot defaults — update after calibration study.',
    )
    db.session.add(seed)
    db.session.commit()
    print('[seed] Inserted pre-pilot-v1 scoring weights.')


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)

    CORS(
        app,
        origins=app.config['CORS_ORIGINS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Session-ID'],
    )

    app.register_blueprint(sessions_bp,  url_prefix='/api')
    app.register_blueprint(pss10_bp,     url_prefix='/api')
    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    with app.app_context():
        import models  # noqa: F401 — ensures all models are registered before create_all
        db.create_all()
        _seed_weights()

    return app
