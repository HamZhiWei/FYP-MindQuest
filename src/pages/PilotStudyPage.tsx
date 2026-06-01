import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { ScenarioId } from '../types';

const PAPER_BG = '/assets/ui/paper.png';

const SCENARIO_BG: Record<ScenarioId, string> = {
  'assignment-deadline': '/assets/backgrounds/assignment_deadline_1.png',
  'sleep-decisions': '/assets/backgrounds/sleep_decision_1.png',
  'social-interaction': '/assets/backgrounds/social_interaction_1.png',
};

function resolveScenarioId(
  selected: ScenarioId | null,
  sessionScenarioId: string | undefined,
): ScenarioId | null {
  if (selected) return selected;
  if (sessionScenarioId && sessionScenarioId in SCENARIO_BG) {
    return sessionScenarioId as ScenarioId;
  }
  return null;
}

export default function PilotStudyPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const { selectedScenario, sessionData } = useGame();

  const activeScenario = resolveScenarioId(
    selectedScenario,
    sessionData?.scenarioId,
  );
  const sceneBg = activeScenario ? SCENARIO_BG[activeScenario] : null;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-6 font-chalk bg-chalk-green bg-cover bg-center"
      style={sceneBg ? { backgroundImage: `url(${sceneBg})` } : undefined}
    >
      <div
        className="w-full max-w-xl px-10 py-9"
        style={{
          backgroundImage: `url(${PAPER_BG})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h1 className="mb-5 text-center text-3xl font-bold text-[#1a1a1a]">
          Pilot Study
        </h1>

        <p className="mb-6 text-base font-bold leading-relaxed text-[#1a1a1a]">
          To help us validate our system&apos;s accuracy, would you be willing to answer
          10 brief questions about your feelings over the last month? This is optional
          and anonymous.
        </p>

        <div className="relative mb-8 overflow-hidden rounded-md bg-black/25">
          <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#3d2a18]" />
          <p className="py-4 pl-5 pr-4 text-sm leading-relaxed text-[#2c2c2a]">
            <span className="font-bold">Disclaimer:</span> This is not a clinical
            diagnosis. Your responses are used for research purposes to analyze the
            correlation between gameplay and perceived stress.
          </p>
        </div>

        <div className="flex items-center justify-between gap-6">
          <label className="flex cursor-pointer select-none items-center gap-3 text-base font-bold text-[#1a1a1a]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-5 w-5 shrink-0 cursor-pointer accent-wood-brown"
            />
            I Understand and Agree
          </label>

          <button
            type="button"
            onClick={() => navigate('/pss10')}
            disabled={!agreed}
            className="inline-flex items-center gap-2 text-lg font-bold text-wood-brown transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:text-[#3d2210] enabled:hover:opacity-90"
          >
            Next
            <span aria-hidden>→</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/done')}
          className="mt-5 w-full text-center text-sm font-bold text-[#5c3317] underline underline-offset-2 opacity-70 transition-opacity hover:opacity-100"
        >
          No thanks, skip
        </button>
      </div>
    </main>
  );
}
