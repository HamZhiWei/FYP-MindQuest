_FAST_RT_MS = 1500  # avg reaction time below this is suspicious


class GamingDetector:

    @staticmethod
    def check(choices: list[dict]) -> tuple[bool, str]:
        """Return (is_flagged, reason). Empty choices are not flagged."""
        if not choices:
            return False, ''

        all_low = all(c.get('riskLevel') == 'low' for c in choices)
        avg_rt  = sum(c.get('reactionTimeMs', 9999) for c in choices) / len(choices)
        too_fast = avg_rt < _FAST_RT_MS

        if all_low and too_fast:
            return True, (
                f'All low-risk choices with avg RT {avg_rt:.0f}ms — possible gaming'
            )

        return False, ''
