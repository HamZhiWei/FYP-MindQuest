import math
from flask import Blueprint, jsonify
from routes.auth import require_admin
from extensions import db
from models import WellbeingScore, PSS10Response

analytics_bp = Blueprint('analytics', __name__)


def _pearson_r(xs, ys):
    n = len(xs)
    if n < 2:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx  = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy  = math.sqrt(sum((y - my) ** 2 for y in ys))
    return round(num / (dx * dy), 3) if dx and dy else None


def _spearman_rho(xs, ys):
    n = len(xs)
    if n < 2:
        return None

    def ranks(lst):
        order = sorted(range(n), key=lambda i: lst[i])
        r = [0] * n
        for rank, i in enumerate(order):
            r[i] = rank + 1
        return r

    rx, ry = ranks(xs), ranks(ys)
    d_sq = sum((rx[i] - ry[i]) ** 2 for i in range(n))
    denom = n * (n ** 2 - 1)
    return round(1 - 6 * d_sq / denom, 3) if denom else None


@analytics_bp.route('/pss10-correlation', methods=['GET'])
@require_admin
def pss10_correlation():
    rows = db.session.execute(
        db.select(WellbeingScore, PSS10Response)
        .join(PSS10Response, PSS10Response.session_id == WellbeingScore.session_id)
    ).all()

    if not rows:
        return jsonify({
            'n': 0, 'pearsonR': None, 'spearmanRho': None,
            'dataPoints': [], 'perIndicator': [], 'bandDistribution': {},
        })

    composites = [ws.composite_index for ws, _ in rows]
    pss10s     = [pr.total_score     for _,  pr in rows]

    def ind_r(attr):
        return _pearson_r([getattr(ws, attr) for ws, _ in rows], pss10s)

    per_indicator = [
        {'name': 'Avoidance',          'r': ind_r('avoidance_score')},
        {'name': 'Sleep Sacrifice',    'r': ind_r('sleep_sacrifice_score')},
        {'name': 'Anxiety (RT)',       'r': ind_r('anxiety_proxy_score')},
        {'name': 'Social Withdrawal',  'r': ind_r('social_withdrawal_score')},
        {'name': 'Irritability',       'r': ind_r('irritability_score')},
        {'name': 'Catastrophising',    'r': ind_r('catastrophising_score')},
        {'name': 'Resilience Failure', 'r': ind_r('resilience_failure_score')},
    ]

    band_dist: dict[str, int] = {}
    for _, pr in rows:
        band_dist[pr.stress_band] = band_dist.get(pr.stress_band, 0) + 1

    return jsonify({
        'n':                len(rows),
        'pearsonR':         _pearson_r(composites, pss10s),
        'spearmanRho':      _spearman_rho(composites, pss10s),
        'dataPoints':       [{'composite': c, 'pss10Total': p} for c, p in zip(composites, pss10s)],
        'perIndicator':     per_indicator,
        'bandDistribution': band_dist,
    })
