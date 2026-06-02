import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { submitSession, submitPSS10 } from '../api/api';

type SubmitStatus = 'loading' | 'success' | 'error';

export default function DonePage() {
  const navigate = useNavigate();
  const { sessionData, pss10Answers } = useGame();
  const [status, setStatus] = useState<SubmitStatus>('loading');

  const doSubmit = useCallback(async () => {
    setStatus('loading');
    try {
      if (sessionData) {
        await submitSession(sessionData);
      }
      if (pss10Answers.length > 0) {
        await submitPSS10(pss10Answers);
      }
      setStatus('success');
    } catch (err) {
      console.error('Submission failed:', err);
      setStatus('error');
    }
  }, [sessionData, pss10Answers]);

  useEffect(() => {
    doSubmit();
  }, [doSubmit]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8 text-center">
      <div
        className="w-full max-w-lg p-10"
        style={{
          backgroundImage: 'url(/assets/ui/paper.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h1 className="text-4xl font-bold text-wood-brown mb-4">
          Done &amp; Answered!
        </h1>

        <p className="text-[#2c2c2a] text-lg leading-relaxed mb-6">
          Thank you for contributing to our pilot study!
          Your input helps us build a more supportive campus environment.
        </p>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-8 h-8 border-4 border-wood-brown border-t-transparent rounded-full animate-spin" />
            <p className="text-[#2c2c2a] text-sm">Submitting your responses…</p>
          </div>
        )}

        {status === 'success' && (
          <p className="text-green-700 font-semibold mb-6">
            Responses submitted successfully!
          </p>
        )}

        {status === 'error' && (
          <div className="mb-6">
            <p className="text-red-700 font-semibold mb-3">
              Submission failed, please try again.
            </p>
            <button
              onClick={doSubmit}
              className="font-chalk font-bold text-wood-brown underline underline-offset-4 hover:text-[#3d2210] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {status !== 'loading' && (
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 font-chalk font-bold text-lg text-wood-brown underline underline-offset-4 hover:text-[#3d2210] transition-colors"
          >
            Go to Main Page
            <span>→</span>
          </button>
        )}
      </div>
    </main>
  );
}
