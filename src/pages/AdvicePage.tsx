import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import WoodButton from '../components/WoodButton';
import EnergyBar from '../components/EnergyBar';

const TIPS: string[] = [
  'Take short breaks between tasks — even 5 minutes helps reset your focus.',
  'Communicating your boundaries early reduces pressure on you and others.',
  'It is okay to ask for help. Reaching out is a sign of strength, not weakness.',
  'Avoiding a stressor temporarily can feel like relief, but facing it calmly reduces long-term stress.',
  'Physical movement — even a short walk — lowers cortisol levels noticeably.',
];

export default function AdvicePage() {
  const navigate = useNavigate();
  const { energyLevel } = useGame();

  return (
    <div className="relative w-screen min-h-screen game-bg flex items-center justify-center p-6" >
      <EnergyBar level={energyLevel} />

      <div
        className="w-full max-w-xl p-8 font-chalk"
         style={{
          backgroundImage: 'url(/assets/ui/paper.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h1 className="text-3xl font-bold text-wood-brown text-center mb-6 tracking-wide uppercase">
          Advise &amp; Tips
        </h1>

        <p className="text-[#2c2c2a] text-base mb-4">
          Well done for completing the scenario! Here are some wellbeing tips
          based on what you experienced:
        </p>

        <ul className="space-y-3 mb-8">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-3 text-[#2c2c2a] text-sm leading-snug">
              <span className="shrink-0 font-bold text-wood-brown">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <WoodButton label="Next" onClick={() => navigate('/pilot-study')} width={200} height={60} fontSize={18}/>
        </div>
      </div>
    </div>
  );
}
