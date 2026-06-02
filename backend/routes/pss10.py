import traceback
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from extensions import db
from models import GameSession, PSS10Response

pss10_bp = Blueprint('pss10', __name__)


@pss10_bp.route('/pss10', methods=['POST'])
def submit_pss10():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        responses = data.get('responses')
        if not responses:
            return jsonify({'error': 'responses is required'}), 400
        if not isinstance(responses, list) or len(responses) != 10:
            return jsonify({'error': 'responses must be an array of exactly 10 answers'}), 400

        # Validate and index by questionId
        answers: dict[int, int] = {}
        for item in responses:
            q_id   = item.get('questionId')
            answer = item.get('answer')
            if q_id is None:
                return jsonify({'error': 'Each response requires questionId'}), 400
            if answer is None:
                return jsonify({'error': 'Each response requires answer'}), 400
            try:
                q_id   = int(q_id)
                answer = int(answer)
            except (ValueError, TypeError):
                return jsonify({'error': 'questionId and answer must be integers'}), 400
            if not (1 <= q_id <= 10):
                return jsonify({'error': f'questionId {q_id} is invalid — must be 1–10'}), 400
            if not (0 <= answer <= 4):
                return jsonify({'error': f'answer {answer} for q{q_id} is invalid — must be 0–4'}), 400
            answers[q_id] = answer

        if len(answers) != 10:
            return jsonify({'error': 'Duplicate or missing questionIds — need q1 through q10'}), 400

        session_id = data.get('sessionId') or request.headers.get('X-Session-ID')
        anon_token = data.get('anonSessionToken') or str(uuid.uuid4())

        if session_id:
            session = db.session.get(GameSession, session_id)
            if not session:
                return jsonify({'error': 'Session not found'}), 404
            anon_token = session.anon_session_token

            existing = db.session.execute(
                db.select(PSS10Response).filter_by(session_id=session.id)
            ).scalar_one_or_none()
            if existing:
                return jsonify({'error': 'PSS-10 already submitted for this session'}), 409
        else:
            session = GameSession(
                scenario_id='pss10-only',
                anon_session_token=anon_token,
                started_at=datetime.now(timezone.utc),
            )
            db.session.add(session)

        row = PSS10Response(
            session_id=session.id,
            anon_session_token=anon_token,
            q1=answers[1],  q2=answers[2],  q3=answers[3],
            q4=answers[4],  q5=answers[5],  q6=answers[6],
            q7=answers[7],  q8=answers[8],  q9=answers[9],
            q10=answers[10],
        )
        row.compute_total()
        db.session.add(row)
        db.session.commit()

        return jsonify({
            'ok': True,
            'sessionId': session.id,
            'totalScore': row.total_score,
            'stressBand': row.stress_band,
        }), 201

    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500
