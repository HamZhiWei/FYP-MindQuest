import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WoodButton from '../components/WoodButton';
import ChalkFrame from '../components/ChalkFrame';
import { initSession } from '../api/api';

const CONSENT_POINTS: string[] = [
  'Your responses are anonymous',
  'No personal identity will be collected',
  'Data will only be used for research and analysis',
  'This is NOT a diagnosis tool',
];

export default function ConsentPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  async function handleNext() {
    if (!agreed || loading) return;
    setLoading(true);
    setError('');
    try {
      await initSession({});
      navigate('/profile');
    } catch {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8">
      <div className="w-full max-w-lg">
        <ChalkFrame>
          <h1 className="text-4xl font-bold text-chalk-white font-chalk mb-6">
            Your Privacy Matters
          </h1>
          <ul className="mb-6 space-y-3">
            {CONSENT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-xl text-chalk-white">
                <span className="mt-1 shrink-0">•</span>
                {point}
              </li>
            ))}
          </ul>
          <p className="text-xl text-chalk-white mb-6">
            By continuing, you agree to participate in this study.
          </p>
          <label className="flex items-center gap-3 text-xl text-chalk-white mb-6 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 accent-wood-brown cursor-pointer"
            />
            I understand and agree
          </label>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="wood-button-row">
            <WoodButton label="Back" onClick={() => navigate('/welcome-info')} />
            <WoodButton
              label={loading ? 'Please wait…' : 'Next'}
              onClick={handleNext}
              disabled={!agreed || loading}
            />
          </div>
        </ChalkFrame>
      </div>
    </main>
  );
}
