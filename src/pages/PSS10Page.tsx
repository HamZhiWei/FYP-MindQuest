import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import type { PSS10Answer } from '@/types';

const clickSound = new Audio('/assets/audio/click.wav');
const ADVANCE_DELAY_MS = 220;

const QUESTIONS: string[] = [
  'In the last month, how often have you Been upset because of something that happened unexpectedly?',
  'In the last month, how often have you Felt unable to control the important things in your life?',
  'In the last month, how often have you Felt nervous and stressed?',
  'In the last month, how often have you Felt difficulties piling up so high you could not overcome them?',
  'In the last month, how often have you Been angered by things outside your control?',
  'In the last month, how often have you Been able to effectively deal with irritating life hassles?',
  'In the last month, how often have you Been able to control irritations in your life?',
  'In the last month, how often have you Felt that you were on top of things?',
  'In the last month, how often have you Been able to control the way you spend your time?',
  'In the last month, how often have you Felt you could not cope with all the things you had to do?',
];

const OPTIONS: { label: string; value: number }[] = [
  { label: 'Never',        value: 0 },
  { label: 'Almost never', value: 1 },
  { label: 'Sometimes',    value: 2 },
  { label: 'Fairly often', value: 3 },
  { label: 'Very often',   value: 4 },
];

export default function PSS10Page() {
  const navigate = useNavigate();
  const { setPss10Answers } = useGame();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS.length).fill(null),
  );
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showSelectTip, setShowSelectTip] = useState(false);

  const selected = answers[current];
  const isLast = current === QUESTIONS.length - 1;
  const canProceed = selected !== null && !isAdvancing;

  useEffect(() => {
    setShowSelectTip(false);
  }, [current]);

  function handleSelect(value: number) {
    if (isAdvancing) return;

    setShowSelectTip(false);

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    const nextAnswers = [...answers];
    nextAnswers[current] = value;
    setAnswers(nextAnswers);

    if (isLast) return;

    setIsAdvancing(true);
    window.setTimeout(() => {
      setCurrent(c => c + 1);
      setIsAdvancing(false);
    }, ADVANCE_DELAY_MS);
  }

  function handleNext() {
    if (isAdvancing) return;

    if (selected === null) {
      setShowSelectTip(true);
      return;
    }

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    if (isLast) {
      const completed: PSS10Answer[] = answers.map((ans, i) => ({
        questionId: i + 1,
        answer: ans ?? 0,
      }));
      setPss10Answers(completed);
      navigate('/done');
    } else {
      setCurrent(c => c + 1);
    }
  }

  function handleBack() {
    if (isAdvancing) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    if (current === 0) {
      navigate('/pilot-study');
    } else {
      setCurrent(c => c - 1);
    }
  }

  return (
    <div className="relative w-screen min-h-screen game-bg flex items-center justify-center p-6">
      <div
        className="w-full max-w-xl p-8 font-chalk"
        style={{
          backgroundImage: 'url(/assets/ui/paper.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Progress */}
        <p className="text-center text-[#5c3317] text-base font-semibold mb-4">
          {current + 1}/{QUESTIONS.length}
        </p>

        {/* Question */}
        <p className="text-[#1a1a1a] text-xl font-bold leading-snug mb-8">
          {QUESTIONS[current]}
        </p>

        {/* Options */}
        <div
          className={[
            'flex flex-col gap-4 mb-4 rounded-lg transition-shadow',
            showSelectTip ? 'ring-2 ring-amber-600/60 ring-offset-2 ring-offset-transparent' : '',
          ].join(' ')}
        >
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isAdvancing}
                onClick={() => handleSelect(opt.value)}
                className="flex items-center gap-4 text-left w-full group disabled:opacity-70"
              >
                {/* Custom radio circle */}
                <span
                  className={[
                    'w-6 h-6 rounded-full border-2 shrink-0 transition-all duration-150 flex items-center justify-center',
                    isSelected
                      ? 'border-wood-brown bg-wood-brown'
                      : 'border-[#5c3317] bg-transparent group-hover:border-wood-brown',
                  ].join(' ')}
                >
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-parchment-light" />
                  )}
                </span>
                <span
                  className={[
                    'text-lg',
                    isSelected ? 'text-wood-brown font-bold' : 'text-[#2c2c2a]',
                  ].join(' ')}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {showSelectTip && (
          <p
            role="alert"
            className="mb-6 text-center text-sm font-semibold text-amber-900 bg-amber-100/90 border border-amber-300/80 rounded-lg px-4 py-2.5"
          >
            Please tap one option above before pressing {isLast ? 'Submit' : 'Next'}.
          </p>
        )}

        {!showSelectTip && <div className="mb-6" />}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={isAdvancing}
            className="flex items-center gap-2 font-chalk text-lg text-[#5c3317] hover:text-wood-brown transition-colors disabled:opacity-50"
          >
            <span className="text-xl">←</span>
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-disabled={!canProceed}
            className={[
              'flex items-center gap-2 font-chalk text-lg font-bold transition-all',
              canProceed
                ? 'text-wood-brown hover:text-[#3d2210]'
                : 'text-[#5c3317]/40 cursor-not-allowed',
            ].join(' ')}
          >
            <span>{isLast ? 'Submit' : 'Next'}</span>
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
