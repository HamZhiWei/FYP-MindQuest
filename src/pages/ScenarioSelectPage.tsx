import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { ScenarioId } from '../types';
import WoodButton from '../components/WoodButton';
const AssignmentDeadlineImage = '/assets/backgrounds/assignment_deadline_1.png';
const SleepDecisionsImage = '/assets/backgrounds/sleep_decision_1.png';
const SocialInteractionImage = '/assets/backgrounds/social_interaction_1.png';

interface ScenarioMeta {
  id: ScenarioId;
  badge: string;
  label: string;
  description: string;
  image: string;
}

interface ScenarioCardProps {
  scenario: ScenarioMeta;
  onClick: () => void;
}

const SCENARIOS: ScenarioMeta[] = [
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

function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left bg-chalk-green-dark rounded-xl overflow-hidden border border-chalk-white/20 hover:scale-105 hover:brightness-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-chalk-white/50"
    >
      <div className="p-3">
        <span className="bg-stone-900/80 text-chalk-white font-chalk text-xs px-3 py-1 rounded-full">
          {scenario.badge}
        </span>
      </div>
      <div className="w-full h-36">
        <img src={scenario.image} alt={scenario.label} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex-1">
        <p className="font-chalk font-bold text-chalk-white text-lg">{scenario.label}</p>
        <p className="font-chalk text-chalk-white/70 text-sm mt-1">{scenario.description}</p>
      </div>
    </button>
  );
}

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
