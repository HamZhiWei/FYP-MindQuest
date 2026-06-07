import { useNavigate } from 'react-router-dom';
import WoodButton from '@/components/WoodButton';
import ChalkFrame from '@/components/ChalkFrame';

export default function WelcomeInfoPage() {
  const navigate = useNavigate();

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8">
      <div className="w-full max-w-lg">
        <ChalkFrame>
          <div className="flex items-center gap-3 mb-5">
            <h1 className="text-4xl font-bold text-chalk-white font-chalk">
              Hi there!
            </h1>
            <img src="/assets/ui/wave.png" alt="Waving Hand" className="w-12 h-12" />
          </div>
          <p className="text-xl text-chalk-white mb-8 leading-relaxed">
            You will go through a few short game scenarios based on student life.
            There are no right or wrong answers — just respond naturally. This
            will only take about 5–10 minutes.
          </p>
          <div className="wood-button-row">
            <WoodButton label="Back" onClick={() => navigate('/welcome')} />
            <WoodButton label="Next" onClick={() => navigate('/consent')} />
          </div>
        </ChalkFrame>
      </div>
    </main>
  );
}
