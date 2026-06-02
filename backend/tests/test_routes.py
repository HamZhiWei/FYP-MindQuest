"""
Integration tests for MindQuest Flask routes.
Run with: python tests/test_routes.py
Flask server must be running on http://localhost:5000
"""

import sys
import uuid
from datetime import datetime, timezone

import requests

BASE = 'http://localhost:5000/api'

CHOICES = [
    {'nodeId': 'D1', 'choiceKey': 'LEAVE_READ',   'reactionTimeMs': 8200,  'riskLevel': 'high'},
    {'nodeId': 'D2', 'choiceKey': 'GHOST',         'reactionTimeMs': 9000,  'riskLevel': 'high'},
    {'nodeId': 'D3', 'choiceKey': 'PANIC_IGNORE',  'reactionTimeMs': 11000, 'riskLevel': 'high'},
    {'nodeId': 'D4', 'choiceKey': 'SELF_BLAME',    'reactionTimeMs': 7600,  'riskLevel': 'high'},
]

PSS10_RESPONSES = [
    {'questionId': i, 'answer': 3} for i in range(1, 11)
]

passed = 0
failed = 0


def ok(label: str):
    global passed
    passed += 1
    print(f'  PASS  {label}')


def fail(label: str, detail: str = ''):
    global failed
    failed += 1
    msg = f'  FAIL  {label}'
    if detail:
        msg += f'\n        {detail}'
    print(msg)


def check(label: str, condition: bool, detail: str = ''):
    if condition:
        ok(label)
    else:
        fail(label, detail)


# ---------------------------------------------------------------------------
# Test 1 — POST /api/sessions/init
# ---------------------------------------------------------------------------
print('\n── Test 1: POST /api/sessions/init ──────────────────────────────────')

anon_token = str(uuid.uuid4())
r1 = requests.post(f'{BASE}/sessions/init', json={
    'scenarioId': 'social-interaction',
    'anonSessionToken': anon_token,
    'profileData': {
        'gender': 'male',
        'ageGroup': '20-24',
        'faculty': 'Engineering',
        'yearOfStudy': 3,
    },
})

check('status 201', r1.status_code == 201, f'got {r1.status_code}: {r1.text}')

body1 = r1.json() if r1.ok else {}
session_id = body1.get('sessionId', '')

check('sessionId present',     bool(session_id),          f'body: {body1}')
check('anonSessionToken echo', body1.get('anonSessionToken') == anon_token,
      f'got {body1.get("anonSessionToken")}')

# ---------------------------------------------------------------------------
# Test 2 — POST /api/sessions
# ---------------------------------------------------------------------------
print('\n── Test 2: POST /api/sessions ───────────────────────────────────────')

now_iso = datetime.now(timezone.utc).isoformat()
r2 = requests.post(f'{BASE}/sessions', json={
    'scenarioId':      'social-interaction',
    'anonSessionToken': anon_token,
    'startedAt':       now_iso,
    'completedAt':     now_iso,
    'completed':       True,
    'choices':         CHOICES,
})

check('status 201', r2.status_code == 201, f'got {r2.status_code}: {r2.text}')

body2 = r2.json() if r2.ok else {}
composite = body2.get('compositeIndex', -1)
risk_band  = body2.get('riskBand', '')
session_id_game = body2.get('sessionId', '')

check('sessionId present',          bool(session_id_game),        f'body: {body2}')
check('compositeIndex present',     composite != -1,              f'body: {body2}')
check('compositeIndex > 6.5',       composite > 6.5,              f'got {composite}')
check('riskBand == HIGH',           risk_band == 'HIGH',          f'got {risk_band!r}')

# ---------------------------------------------------------------------------
# Test 3 — POST /api/pss10
# ---------------------------------------------------------------------------
print('\n── Test 3: POST /api/pss10 ──────────────────────────────────────────')

r3 = requests.post(f'{BASE}/pss10', json={
    'sessionId':        session_id_game,
    'anonSessionToken': anon_token,
    'responses':        PSS10_RESPONSES,
})

check('status 201', r3.status_code == 201, f'got {r3.status_code}: {r3.text}')

body3 = r3.json() if r3.ok else {}
total_score = body3.get('totalScore')
stress_band = body3.get('stressBand', '')

check('ok == True',           body3.get('ok') is True,   f'body: {body3}')
check('totalScore present',   total_score is not None,   f'body: {body3}')
check('totalScore in 0–40',   0 <= (total_score or -1) <= 40, f'got {total_score}')
check('stressBand present',   bool(stress_band),          f'body: {body3}')

# All answers are 3; reverse-scored q6-q9 become (4-3)=1 each
# forward: q1+q2+q3+q4+q5+q10 = 6×3 = 18; reversed: q6+q7+q8+q9 = 4×1 = 4; total = 22
check('totalScore == 22', total_score == 22, f'got {total_score}')
check('stressBand == MODERATE', stress_band == 'MODERATE', f'got {stress_band!r}')

# ---------------------------------------------------------------------------
# Test 4 — Duplicate PSS-10 returns 409
# ---------------------------------------------------------------------------
print('\n── Test 4: Duplicate PSS-10 → 409 ──────────────────────────────────')

r4 = requests.post(f'{BASE}/pss10', json={
    'sessionId':        session_id_game,
    'anonSessionToken': anon_token,
    'responses':        PSS10_RESPONSES,
})

check('status 409', r4.status_code == 409, f'got {r4.status_code}: {r4.text}')
check('error message present', 'error' in (r4.json() if r4.ok or r4.status_code == 409 else {}),
      f'body: {r4.text}')

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
total = passed + failed
print(f'\n{"─" * 60}')
print(f'  {passed}/{total} passed', '✓' if failed == 0 else f'  ({failed} failed)')
print()

if failed:
    sys.exit(1)
