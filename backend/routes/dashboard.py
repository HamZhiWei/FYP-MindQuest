from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import GameSession, WellbeingScore

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    flagged_only = request.args.get('flagged', 'false').lower() == 'true'

    query = db.select(GameSession).order_by(GameSession.submitted_at.desc())
    if flagged_only:
        query = query.filter_by(is_flagged=True)

    sessions = db.paginate(query, page=page, per_page=per_page, error_out=False)

    return jsonify({
        'sessions': [s.to_dict() for s in sessions.items],
        'total': sessions.total,
        'page': sessions.page,
        'pages': sessions.pages,
    })


@dashboard_bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    session = db.get_or_404(GameSession, session_id)
    data = session.to_dict()
    data['decisions'] = [d.to_dict() for d in session.decisions]
    data['pss10'] = [r.to_dict() for r in session.pss10_responses]
    data['wellbeingScore'] = session.wellbeing_score.to_dict() if session.wellbeing_score else None
    return jsonify(data)


@dashboard_bp.route('/scores', methods=['GET'])
@jwt_required()
def list_scores():
    scores = db.session.execute(
        db.select(WellbeingScore).order_by(WellbeingScore.computed_at.desc())
    ).scalars().all()

    return jsonify([{
        **s.to_dict(),
        'sessionId': s.session_id,
    } for s in scores])


@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    total = db.session.execute(db.select(db.func.count(GameSession.id))).scalar()
    flagged = db.session.execute(
        db.select(db.func.count(GameSession.id)).filter_by(is_flagged=True)
    ).scalar()

    band_rows = db.session.execute(
        db.select(WellbeingScore.risk_band, db.func.count(WellbeingScore.id))
        .group_by(WellbeingScore.risk_band)
    ).all()

    return jsonify({
        'totalSessions': total,
        'flaggedSessions': flagged,
        'riskBands': {band: count for band, count in band_rows},
    })
