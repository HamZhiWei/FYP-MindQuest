from flask import Blueprint, request, jsonify, g
from sqlalchemy import case, func

from routes.auth import require_admin
from extensions import db
from models import GameSession, WellbeingScore, DecisionEvent, AuditLog
from utils.audit import write_audit

dashboard_bp = Blueprint('dashboard', __name__)

_SKIP = ['unknown', 'pending', 'pss10-only']
_HESITANT_MS = 4000


def _week_range(period: str) -> tuple[int, int]:
    if period == 'midterm':
        return 6, 9
    if period == 'finals':
        return 11, 14
    return 1, 14


def _game_filter(game: str):
    base = GameSession.scenario_id.notin_(_SKIP)
    if game and game != 'all':
        return db.and_(base, GameSession.scenario_id == game)
    return base


def _period_filter(period: str):
    if period == 'full':
        return True
    w_min, w_max = _week_range(period)
    return db.and_(
        GameSession.semester_week.isnot(None),
        GameSession.semester_week >= w_min,
        GameSession.semester_week <= w_max,
    )


def _parse_filters():
    game   = request.args.get('game', 'all')
    period = request.args.get('period', 'full')
    return game, period


def _reviewed_session_ids():
    rows = db.session.execute(
        db.select(AuditLog.entity_id).where(AuditLog.action == 'FLAG_REVIEWED')
    ).scalars().all()
    return {r for r in rows if r}


# Analytics

@dashboard_bp.route('/trend', methods=['GET'])
@require_admin
def trend():
    game, period = _parse_filters()
    w_min, w_max = _week_range(period)

    rows = db.session.execute(
        db.select(
            GameSession.semester_week.label('week'),
            func.avg(WellbeingScore.composite_index).label('avg_composite'),
            func.avg(WellbeingScore.sleep_sacrifice_score).label('avg_sleep'),
            func.count(GameSession.id).label('total'),
            func.sum(case((WellbeingScore.risk_band == 'HIGH', 1), else_=0)).label('high_risk'),
            func.sum(case((GameSession.completed.is_(False), 1), else_=0)).label('dropouts'),
        )
        .join(WellbeingScore, WellbeingScore.session_id == GameSession.id)
        .where(_game_filter(game))
        .where(_period_filter(period))
        .where(GameSession.semester_week.isnot(None))
        .group_by(GameSession.semester_week)
        .order_by(GameSession.semester_week)
    ).all()

    by_week = {r.week: r for r in rows}
    result = []
    for week in range(w_min, w_max + 1):
        row = by_week.get(week)
        if row and row.total:
            result.append({
                'week':               week,
                'avgComposite':       round(float(row.avg_composite or 0), 2),
                'sleepSacrificeRate': round(float(row.avg_sleep or 0), 2),
                'totalSessions':      int(row.total),
                'highRiskCount':      int(row.high_risk or 0),
                'dropoutRate':        round(int(row.dropouts or 0) / int(row.total) * 100, 1),
            })
        else:
            result.append({
                'week': week, 'avgComposite': None, 'sleepSacrificeRate': None,
                'totalSessions': 0, 'highRiskCount': 0, 'dropoutRate': None,
            })

    return jsonify(result)

# Run a database query that averages all 7 indicator columns. 
# The result comes back as one row of 7 numbers. 
# Clean each number (convert type, handle empty case), 
# then package all 7 into a JSON object and send it to React.
@dashboard_bp.route('/indicators', methods=['GET'])
@require_admin
def indicators():
    game, period = _parse_filters()

    rows = db.session.execute(
        db.select(
            func.avg(WellbeingScore.avoidance_score),
            func.avg(WellbeingScore.sleep_sacrifice_score),
            func.avg(WellbeingScore.anxiety_proxy_score),
            func.avg(WellbeingScore.social_withdrawal_score),
            func.avg(WellbeingScore.irritability_score),
            func.avg(WellbeingScore.catastrophising_score),
            func.avg(WellbeingScore.resilience_failure_score),
        )
        .join(GameSession, GameSession.id == WellbeingScore.session_id)
        .where(_game_filter(game))
        .where(_period_filter(period))
    ).one()

    def _avg(val):
        return round(float(val), 2) if val is not None else 0

    return jsonify({
        'avoidance':         _avg(rows[0]),
        'sleepSacrifice':    _avg(rows[1]),
        'anxietyRt':         _avg(rows[2]),
        'socialWithdrawal':  _avg(rows[3]),
        'irritability':      _avg(rows[4]),
        'catastrophising':   _avg(rows[5]),
        'resilienceFailure': _avg(rows[6]),
    })


@dashboard_bp.route('/choices', methods=['GET'])
@require_admin
def choices():
    game, period = _parse_filters()

    rows = db.session.execute(
        db.select(DecisionEvent.choice_key, func.count(DecisionEvent.id))
        .join(GameSession, GameSession.id == DecisionEvent.session_id)
        .where(DecisionEvent.node_id == 'D1')
        .where(_game_filter(game))
        .where(_period_filter(period))
        .group_by(DecisionEvent.choice_key)
        .order_by(func.count(DecisionEvent.id).desc())
    ).all()

    total = sum(r[1] for r in rows) or 1
    return jsonify([
        {
            'choiceKey':  key,
            'count':      count,
            'percentage': round(count / total * 100, 1),
        }
        for key, count in rows
    ])


@dashboard_bp.route('/rt-analysis', methods=['GET'])
@require_admin
def rt_analysis():
    game, period = _parse_filters()

    rows = db.session.execute(
        db.select(
            DecisionEvent.node_id,
            func.avg(DecisionEvent.reaction_time_ms),
            func.count(DecisionEvent.id),
            func.sum(case((DecisionEvent.reaction_time_ms > _HESITANT_MS, 1), else_=0)),
        )
        .join(GameSession, GameSession.id == DecisionEvent.session_id)
        .where(_game_filter(game))
        .where(_period_filter(period))
        .group_by(DecisionEvent.node_id)
        .order_by(DecisionEvent.node_id)
    ).all()

    return jsonify([
        {
            'nodeId':      node_id,
            'avgRtMs':     round(float(avg_rt)),
            'pctHesitant': round(int(hesitant) / int(total) * 100, 1) if total else 0,
        }
        for node_id, avg_rt, total, hesitant in rows
    ])

# not used
@dashboard_bp.route('/metrics', methods=['GET'])
@require_admin
def metrics():
    game, period = _parse_filters()

    row = db.session.execute(
        db.select(
            func.count(GameSession.id),
            func.avg(WellbeingScore.composite_index),
            func.sum(case((WellbeingScore.risk_band == 'HIGH', 1), else_=0)),
            func.avg(WellbeingScore.sleep_sacrifice_score),
        )
        .join(WellbeingScore, WellbeingScore.session_id == GameSession.id, isouter=True)
        .where(_game_filter(game))
        .where(_period_filter(period))
    ).one()

    total = int(row[0] or 0)
    high  = int(row[2] or 0)
    return jsonify({
        'totalSessions':      total,
        'avgComposite':       round(float(row[1]), 2) if row[1] is not None else None,
        'highRiskPct':        round(high / total * 100, 1) if total else 0,
        'sleepSacrificePct':  round(float(row[3]), 2) if row[3] is not None else 0,
    })


# Flagged sessions

@dashboard_bp.route('/flagged', methods=['GET'])
@require_admin
def list_flagged():
    reviewed = _reviewed_session_ids()

    sessions = db.session.execute(
        db.select(GameSession)
        .where(GameSession.flagged_as_invalid.is_(True))
        .where(_game_filter('all'))
        .order_by(GameSession.created_at.desc())
    ).scalars().all()

    result = []
    for gs in sessions:
        events = gs.decision_events
        avg_rt = round(sum(e.reaction_time_ms for e in events) / len(events)) if events else None
        risk_levels = [e.risk_level for e in events if e.risk_level]
        all_low = (
            gs.wellbeing_score is not None
            and gs.wellbeing_score.risk_band == 'LOW'
            and all(r.upper() == 'LOW' for r in risk_levels)
        )

        result.append({
            'sessionId':  gs.id,
            'scenarioId': gs.scenario_id,
            'flagReason': gs.flag_reason,
            'avgRtMs':    avg_rt,
            'allLowRisk': all_low,
            'flaggedAt':  gs.created_at.isoformat() if gs.created_at else None,
            'reviewed':   gs.id in reviewed,
        })

    return jsonify(result)


@dashboard_bp.route('/flagged/<session_id>', methods=['PATCH'])
@require_admin
def review_flagged(session_id):
    data     = request.get_json(silent=True) or {}
    decision = data.get('decision')
    if decision not in ('keep', 'exclude'):
        return jsonify({'error': 'decision must be "keep" or "exclude"'}), 400

    session = db.get_or_404(GameSession, session_id)
    if decision == 'exclude':
        session.flagged_as_invalid = True
        session.flag_reason = (session.flag_reason or '') + ' [excluded by admin]'
    else:
        session.flagged_as_invalid = False
        session.flag_reason = None

    write_audit(
        'FLAG_REVIEWED',
        entity_type='game_sessions',
        entity_id=session_id,
        performed_by=g.current_user,
        details={'decision': decision},
    )
    db.session.commit()
    return jsonify({'success': True})


# Legacy / supporting routes (used by dashboard UI)

@dashboard_bp.route('/sessions', methods=['GET'])
@require_admin
def list_sessions():
    page         = request.args.get('page', 1, type=int)
    per_page     = request.args.get('per_page', 20, type=int)
    flagged_only = request.args.get('flagged', 'false').lower() == 'true'

    query = db.select(GameSession).where(_game_filter('all')).order_by(GameSession.created_at.desc())
    if flagged_only:
        query = query.where(GameSession.flagged_as_invalid.is_(True))

    sessions = db.paginate(query, page=page, per_page=per_page, error_out=False)
    return jsonify({
        'sessions': [{
            **s.to_dict(),
            'flagReason':  s.flag_reason,
            'submittedAt': s.created_at.isoformat() if s.created_at else None,
        } for s in sessions.items],
        'total': sessions.total,
        'page':  sessions.page,
        'pages': sessions.pages,
    })


@dashboard_bp.route('/sessions/<session_id>', methods=['GET'])
@require_admin
def get_session(session_id):
    session = db.get_or_404(GameSession, session_id)
    data = session.to_dict()
    data['decisions']      = [d.to_dict() for d in session.decision_events]
    data['pss10']          = session.pss10_response.to_dict() if session.pss10_response else None
    data['wellbeingScore'] = session.wellbeing_score.to_dict() if session.wellbeing_score else None
    data['flagReason']     = session.flag_reason
    return jsonify(data)


@dashboard_bp.route('/scores', methods=['GET'])
@require_admin
def list_scores():
    scores = db.session.execute(
        db.select(WellbeingScore).order_by(WellbeingScore.scored_at.desc())
    ).scalars().all()
    return jsonify([{**s.to_dict(), 'sessionId': s.session_id} for s in scores])


@dashboard_bp.route('/stats', methods=['GET'])
@require_admin
def stats():
    """Backward-compatible alias; delegates to /metrics + risk band breakdown."""
    game, period = _parse_filters()

    total = db.session.execute(
        db.select(func.count(GameSession.id))
        .where(_game_filter(game))
        .where(_period_filter(period))
    ).scalar()

    flagged = db.session.execute(
        db.select(func.count(GameSession.id))
        .where(GameSession.flagged_as_invalid.is_(True))
        .where(_game_filter(game))
        .where(_period_filter(period))
    ).scalar()

    band_rows = db.session.execute(
        db.select(WellbeingScore.risk_band, func.count(WellbeingScore.id))
        .join(GameSession, GameSession.id == WellbeingScore.session_id)
        .where(_game_filter(game))
        .where(_period_filter(period))
        .group_by(WellbeingScore.risk_band)
    ).all()

    return jsonify({
        'totalSessions':   total,
        'flaggedSessions': flagged,
        'riskBands':       {band: count for band, count in band_rows},
    })
