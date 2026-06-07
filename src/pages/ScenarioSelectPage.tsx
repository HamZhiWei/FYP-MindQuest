import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import type { ScenarioId, ScenarioMeta } from '@/types';
import ScenarioCard from '@/components/ScenarioCard';
import WoodButton from '@/components/WoodButton';
const AssignmentDeadlineImage = '/assets/backgrounds/assignment_deadline_1.png';
const SleepDecisionsImage = '/assets/backgrounds/sleep_decision_1.png';
const SocialInteractionImage = '/assets/backgrounds/social_interaction_1.png';

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'assignment-deadline',
    badge: 'Scenario 1',
    label: 'Assignment Deadline',
    description: 'Manage stress under academic pressure.',
    image: AssignmentDeadlineImage,
  },
  {
    id: 'sleep-decisions',
    badge: 'Scenario 2',
    label: 'Sleep Decisions',
    description: 'Navigate choices that affect your rest.',
    image: SleepDecisionsImage,
  },
  {
    id: 'social-interaction',
    badge: 'Scenario 3',
    label: 'Social Interaction',
    description: 'Handle tricky social situations.',
    image: SocialInteractionImage,
  },
];


export default function ScenarioSelectPage() {
  const navigate = useNavigate();
  const { setSelectedScenario } = useGame();

  function handleSelect(id: ScenarioId) {
    setSelectedScenario(id);
    navigate(`/game/${id}`);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8">
      <h1 className="text-4xl font-bold text-chalk-white font-chalk mb-2">
        Choose a Scenario
      </h1>
      <p className="text-xl text-chalk-white mb-10">
        Pick one to start — you can complete all
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
        {SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} scenario={s} onClick={() => handleSelect(s.id)} />
        ))}
      </div>
         <WoodButton label="Back" onClick={() => navigate('/profile')} />
    </main>
  );
}
