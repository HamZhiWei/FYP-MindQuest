import { useNavigate } from 'react-router-dom';
import WoodButton from '@/components/WoodButton';

const imageSrc = '/assets/ui/logo.png';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk gap-6 p-8">
      {/* Chalk overlay — sits above the green bg, below the content */}
      <img
        src="/assets/ui/white_chalk_overlay.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      <img src={imageSrc} alt="MindQuest Logo" className="relative z-10 w-32 h-32" />
      <h1 className="relative z-10 text-4xl font-bold text-chalk-white font-chalk text-center">
        Welcome to MindQuest
      </h1>
      <p className="relative z-10 text-xl text-chalk-white text-center max-w-md">
        A short interactive experience to explore student wellbeing
      </p>
      <div className="relative z-10">
        <WoodButton label="Start" onClick={() => navigate('/welcome-info')} />
      </div>
    </main>
  );
}
