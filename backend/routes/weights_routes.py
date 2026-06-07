from flask import Blueprint, jsonify, g
from routes.auth import require_admin
from extensions import db
from models.scoring_weight import ScoringWeight
from utils.audit import write_audit

weights_bp = Blueprint('weights', __name__)


def _weight_dict(v: ScoringWeight) -> dict:
    return {
        'id':               v.id,
        'versionLabel':     v.version_label,
        'isActive':         v.is_active,
        'pilotPearsonR':    v.pilot_pearson_r,
        'appliedAt':        v.applied_at.isoformat() if v.applied_at else None,
        'calibrationNote':  v.calibration_note,
        'indicatorWeights': v.indicator_weights,
        'wGameDeadline':    v.w_game_deadline,
        'wGameSleep':       v.w_game_sleep,
        'wGameSocial':      v.w_game_social,
    }


@weights_bp.route('/weights', methods=['GET'])
@require_admin
def list_weights():
    versions = db.session.execute(
        db.select(ScoringWeight).order_by(ScoringWeight.applied_at.desc())
    ).scalars().all()
    return jsonify({'versions': [_weight_dict(v) for v in versions]})


def _activate(version_id: str):
    db.session.execute(db.update(ScoringWeight).values(is_active=False))
    version = db.get_or_404(ScoringWeight, version_id)
    version.is_active = True

    write_audit(
        'WEIGHT_CHANGE',
        entity_type='scoring_weight_versions',
        entity_id=version_id,
        performed_by=g.current_user,
        details={'activatedVersion': version.version_label},
    )
    db.session.commit()
    return jsonify({'success': True})


@weights_bp.route('/weights/<version_id>/activate', methods=['PATCH', 'PUT'])
@require_admin
def activate_weight(version_id):
    return _activate(version_id)
