from datetime import datetime, date, timedelta, timezone


def semester_week_of(dt: datetime, week_starts: list | None) -> int | None:
    """
    Return the 1-based teaching week number for dt, or None.

    week_starts is an ordered list of up to 14 entries — the Monday that opens
    each teaching week. Entries that are None or empty string are skipped
    (break weeks left blank by the admin).

    A session belongs to week N if its date falls on or after the Nth valid
    start date and before the next valid start date (or within 7 days of the
    last valid entry).
    """
    if not week_starts:
        return None

    # Build (week_number, date) pairs, skipping blank entries
    valid: list[tuple[int, date]] = []
    for i, raw in enumerate(week_starts):
        if not raw:
            continue
        try:
            d = date.fromisoformat(raw) if isinstance(raw, str) else raw
            valid.append((i + 1, d))
        except (ValueError, TypeError):
            continue

    if not valid:
        return None

    session_date = dt.astimezone(timezone.utc).date()

    for j, (week_num, start) in enumerate(valid):
        end = valid[j + 1][1] if j + 1 < len(valid) else start + timedelta(days=7)
        if start <= session_date < end:
            return week_num

    return None


def time_of_day_bucket(dt: datetime) -> str:
    hour = dt.astimezone(timezone.utc).hour
    if 6 <= hour < 12:
        return 'morning'
    if 12 <= hour < 18:
        return 'afternoon'
    if 18 <= hour < 23:
        return 'evening'
    return 'night'
