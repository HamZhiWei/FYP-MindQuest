from flask import Blueprint, request, jsonify, g
from routes.auth import require_admin
from extensions import db
from models.wellbeing_tip import WellbeingTip
from utils.audit import write_audit

tips_bp = Blueprint('tips', __name__)

_DEFAULTS = {
    'assignment-deadline': [
        'Break your assignment into smaller tasks and tackle one at a time.',
        'Take regular 5-minute breaks every 25 minutes to maintain focus.',
        'Reach out to classmates or your lecturer if you feel stuck.',
        'Remember: done is better than perfect — submit what you have.',
    ],
    'sleep-decisions': [
        'Aim for 7–9 hours of sleep to support memory consolidation and mood.',
        'Avoid screens for 30 minutes before bed to improve sleep quality.',
        'Create a consistent bedtime routine to regulate your sleep cycle.',
        'If you cannot sleep, try a breathing exercise: 4 counts in, 4 hold, 4 out.',
    ],
    'social-interaction': [
        "It's okay to set boundaries — saying no is a form of self-care.",
        'Talk to someone you trust when things feel overwhelming.',
        'Small acts of connection matter — a quick reply keeps relationships alive.',
        'If you feel misunderstood, try expressing your feelings in writing first.',
    ],
}


def _tip_row(t: WellbeingTip) -> dict:
    return {
        'id':        t.id,
        'tipOrder':  t.tip_order,
        'tipText':   t.tip_text,
        'isActive':  t.is_active,
    }


@tips_bp.route('/tips/<scenario_id>', methods=['GET'])
@require_admin
def get_tips(scenario_id):
    rows = db.session.execute(
        db.select(WellbeingTip)
        .filter_by(scenario_id=scenario_id, is_active=True)
        .order_by(WellbeingTip.tip_order)
    ).scalars().all()

    if rows:
        tips = [_tip_row(r) for r in rows]
    else:
        tips = [
            {'tipOrder': i + 1, 'tipText': text, 'isActive': True}
            for i, text in enumerate(_DEFAULTS.get(scenario_id, []))
        ]

    # Keep string array for existing dashboard UI
    return jsonify({
        'tips': [t['tipText'] for t in tips],
        'rows': tips,
    })


@tips_bp.route('/tips/<scenario_id>', methods=['PUT'])
@require_admin
def update_tips(scenario_id):
    payload = request.get_json(silent=True) or {}
    raw     = payload.get('tips', [])

    db.session.execute(
        db.update(WellbeingTip)
        .where(WellbeingTip.scenario_id == scenario_id)
        .values(is_active=False)
    )

    for i, item in enumerate(raw):
        if isinstance(item, str):
            text  = item.strip()
            order = i + 1
        else:
            text  = (item.get('tipText') or '').strip()
            order = item.get('tipOrder') or (i + 1)
        if not text:
            continue

        db.session.add(WellbeingTip(
            scenario_id=scenario_id,
            tip_order=order,
            tip_text=text,
            is_active=True,
        ))

    write_audit(
        'TIPS_UPDATED',
        entity_type='wellbeing_tips',
        entity_id=scenario_id,
        performed_by=g.current_user,
        details={'scenario': scenario_id, 'count': len(raw)},
    )
    db.session.commit()
    return jsonify({'success': True})
