from extensions import db
from models.game_session import GameSession
from models.wellbeing_score import WellbeingScore
from models.scoring_weight import ScoringWeight

# Choice registry — maps (scenario, node, choice_key) → raw indicator deltas
CHOICE_REGISTRY = {
    'assignment-deadline': {
        'D1': {
            'START_WORKING': {'avoidance': 0.0, 'sleep': 0.0, 'social': 0.0},
            'SOCIAL_MEDIA':  {'avoidance': 1.2, 'sleep': 0.0, 'social': 0.0},
            'PLAY_GAME':     {'avoidance': 2.0, 'sleep': 0.5, 'social': 0.0},
        },
        'D2': {
            'TAKE_BREAK':  {'avoidance': 0.0, 'sleep': 0.0, 'social': 0.0},
            'PUSH_THROUGH':{'avoidance': 0.0, 'sleep': 2.0, 'social': 0.0},
            'GIVE_UP':     {'avoidance': 1.0, 'sleep': 1.0, 'social': 0.0},
        },
        'D3': {
            'JOIN_FRIEND':    {'avoidance': 0.0, 'sleep': 0.0, 'social': 0.0},
            'IGNORE_MESSAGE': {'avoidance': 0.5, 'sleep': 0.0, 'social': 1.0},
            'SPIRAL_PHONE':   {'avoidance': 1.5, 'sleep': 0.0, 'social': 2.0},
        },
        'D4': {
            'SUBMIT_NOW':  {'avoidance': 0.0, 'sleep': 0.0, 'social': 0.0},
            'FIX_TYPOS':   {'avoidance': 0.0, 'sleep': 0.0, 'social': 0.0},
            'SPIRAL_FIX':  {'avoidance': 0.0, 'sleep': 0.0, 'social': 0.0},
        },
    },
    'sleep-decisions': {
        'D1': {
            'NO_SCREEN':   {'routine': 0.0, 'sleep_q': 0.0},
            'ONE_EPISODE': {'routine': 1.2, 'sleep_q': 0.5},
            'SCROLL_BED':  {'routine': 2.0, 'sleep_q': 1.0},
        },
        'D2': {
            'LET_GO':      {'routine': 0.0, 'sleep_q': 0.0},
            'QUICK_CHECK': {'routine': 0.8, 'sleep_q': 0.8},
            'WORRY_SPIRAL':{'routine': 0.5, 'sleep_q': 2.0},
        },
        'D3': {
            'UP_FIRST':   {'recovery': 0.0, 'sleep_q': 0.0},
            'SNOOZE_ONCE':{'recovery': 1.0, 'sleep_q': 0.0},
            'SNOOZE_MANY':{'recovery': 2.0, 'sleep_q': 1.0},
        },
        'D4': {
            'CALM_REPLY': {'irritability': 0.0},
            'SHORT_REPLY':{'irritability': 1.0},
            'ANGRY_VOICE':{'irritability': 2.0, 'recovery': 0.5},
        },
    },
    'social-interaction': {
        'D1': {
            'HELP_FULLY':  {'withdrawal': 0.0, 'support': 0.0},
            'HALF_COMMIT': {'withdrawal': 0.5, 'support': 0.5},
            'LEAVE_READ':  {'withdrawal': 2.0, 'support': 1.0},
        },
        'D2': {
            'ACCEPT_HELP': {'withdrawal': 0.0, 'support': 0.0},
            'DEFLECT':     {'withdrawal': 1.0, 'support': 1.0},
            'GHOST':       {'withdrawal': 2.0, 'support': 2.0},
        },
        'D3': {
            'REPLY_CALM':   {'catastrophise': 0.0},
            'DRAFT_LONG':   {'catastrophise': 1.5, 'withdrawal': 0.0},
            'PANIC_IGNORE': {'catastrophise': 2.0, 'withdrawal': 0.5},
        },
        'D4': {
            'REFRAME':     {'resilience': 0.0},
            'SMILE_SPIRAL':{'resilience': 1.0, 'withdrawal': 0.5},
            'SELF_BLAME':  {'resilience': 2.0},
        },
    },
}

# Theoretical worst-case raw accumulation per indicator (used for normalisation)
MAX_RAW = {
    'avoidance':    5.5,
    'sleep':        5.0,
    'anxiety_rt':  10.0,
    'social':       4.5,
    'irritability': 2.0,
    'routine':      4.0,
    'sleep_q':      4.0,
    'recovery':     2.5,
    'withdrawal':   5.0,
    'support':      3.0,
    'catastrophise':4.5,
    'resilience':   3.5,
}


class WellbeingScorer:

    @staticmethod
    def score(session: GameSession, choices: list[dict]) -> WellbeingScore:
        weights = db.session.execute(
            db.select(ScoringWeight).filter_by(is_active=True)
        ).scalar_one_or_none()

        if not weights:
            raise RuntimeError('No active ScoringWeight found in database')

        # Step 1: aggregate raw indicator scores from registry
        raw: dict[str, float] = {k: 0.0 for k in MAX_RAW}

        for choice in choices:
            contrib = (
                CHOICE_REGISTRY
                .get(session.scenario_id, {})
                .get(choice.get('nodeId', ''), {})
                .get(choice.get('choiceKey', ''), {})
            )
            for indicator, value in contrib.items():
                if indicator in raw:
                    raw[indicator] += value

        # Step 2: reaction-time → anxiety proxy
        if choices:
            avg_rt = sum(c.get('reactionTimeMs', 0) for c in choices) / len(choices)
        else:
            avg_rt = 0.0

        if avg_rt < 2000:
            raw['anxiety_rt'] = 0.0
        elif avg_rt < 4000:
            raw['anxiety_rt'] = 2.5
        elif avg_rt < 7000:
            raw['anxiety_rt'] = 6.0
        else:
            raw['anxiety_rt'] = 10.0

        # Step 3: normalise each indicator to 0–10 
        def norm(key: str) -> float:
            return min(10.0, max(0.0, round(raw[key] / MAX_RAW[key] * 10, 2)))

        # Step 4: per-scenario composite index 
        iw = weights.indicator_weights
        scenario = session.scenario_id

        if scenario == 'assignment-deadline':
            composite = (
                norm('avoidance')  * iw['deadline']['avoidance'] +
                norm('sleep')      * iw['deadline']['sleep_sacrifice'] +
                norm('anxiety_rt') * iw['deadline']['anxiety_rt'] +
                norm('social')     * iw['deadline']['social_withdrawal'] +
                (10.0 if not session.completed else 0.0) * iw['deadline']['dropout']
            )
        elif scenario == 'sleep-decisions':
            composite = (
                norm('routine')      * iw['sleep']['routine'] +
                norm('sleep_q')      * iw['sleep']['sleep_quality'] +
                norm('recovery')     * iw['sleep']['recovery'] +
                norm('irritability') * iw['sleep']['irritability']
            )
        else:  # social-interaction
            composite = (
                norm('withdrawal')   * iw['social']['withdrawal'] +
                norm('support')      * iw['social']['support_rejection'] +
                norm('catastrophise')* iw['social']['catastrophising'] +
                norm('resilience')   * iw['social']['resilience']
            )

        composite = round(min(10.0, max(0.0, composite)), 2)

        # Step 5: risk band 
        if composite <= weights.risk_band_low_max:
            band = 'LOW'
        elif composite <= weights.risk_band_mod_max:
            band = 'MODERATE'
        else:
            band = 'HIGH'

        # Step 6: build WellbeingScore (caller commits) 
        return WellbeingScore(
            session_id=session.id,
            avoidance_score=norm('avoidance'),
            sleep_sacrifice_score=min(10.0, norm('sleep') + norm('sleep_q')),
            anxiety_proxy_score=norm('anxiety_rt'),
            social_withdrawal_score=min(10.0, norm('social') + norm('withdrawal')),
            irritability_score=norm('irritability'),
            catastrophising_score=norm('catastrophise'),
            resilience_failure_score=norm('resilience'),
            dropout_penalty=0.0 if session.completed else 10.0,
            composite_index=composite,
            risk_band=band,
            weight_version=weights.version_label,
        )
