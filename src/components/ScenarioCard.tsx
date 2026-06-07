import type { ScenarioMeta } from '@/types';

const hoverSound = new Audio('/assets/audio/hover-card.wav');
const clickSound = new Audio('/assets/audio/click.wav');

interface ScenarioCardProps {
  scenario: ScenarioMeta;
  onClick: () => void;
}

function playHover() {
  hoverSound.currentTime = 0;
  hoverSound.play().catch(() => {});
}

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

export default function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
  function handleClick() {
    playClick();
    onClick();
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={playHover}
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