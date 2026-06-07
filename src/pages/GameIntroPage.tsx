import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WoodButton from '@/components/WoodButton';
import ChalkFrame from '@/components/ChalkFrame';
import { useGame } from '@/context/GameContext';
import type { ScenarioId } from '@/types';

const SCENARIO_LABELS: Record<ScenarioId, string> = {
  'assignment-deadline': 'Assignment Deadline',
  'sleep-decisions': 'Sleep Decisions',
  'social-interaction': 'Social Interaction',
};

export default function GameIntroPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { setSelectedScenario } = useGame();

  useEffect(() => {
    if (scenarioId) {
      setSelectedScenario(scenarioId as ScenarioId);
    }
  }, [scenarioId, setSelectedScenario]);

  const label =
    scenarioId && scenarioId in SCENARIO_LABELS
      ? SCENARIO_LABELS[scenarioId as ScenarioId]
      : scenarioId ?? '';

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8">
      <div className="w-full max-w-lg">
        <ChalkFrame>
          <p className="font-chalk text-parchment text-sm uppercase tracking-wider mb-2">
            {label}
          </p>
          <h1 className="text-4xl font-bold text-chalk-white font-chalk mb-5">
            Game Intro
          </h1>
          <p className="text-xl text-chalk-white leading-relaxed mb-8">
            You will be placed in a situation. Choose what you would most likely
            do. Just be yourself — no right or wrong answers.
          </p>
          <div className="flex items-center gap-4">
            <WoodButton label="Back" onClick={() => navigate('/scenarios')} />
            <WoodButton
              label="Start"
              onClick={() => {
                if (scenarioId) navigate(`/game/${scenarioId}/play`);
              }}
            />
          </div>
        </ChalkFrame>
      </div>
    </main>
  );
}
