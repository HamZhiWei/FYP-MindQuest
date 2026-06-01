import { useNavigate } from 'react-router-dom';

export default function DonePage() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk p-8 text-center">
      <div
        className="w-full max-w-lg p-10"
       style={{
          backgroundImage: 'url(/assets/ui/paper.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h1 className="text-4xl font-bold text-wood-brown mb-4">
          Done &amp; Answered!
        </h1>

        <p className="text-[#2c2c2a] text-lg leading-relaxed mb-8">
          Thank you for contributing to our pilot study!
          Your input helps us build a more supportive campus environment.
        </p>

        {/* Placeholder: Flask API call to submit all data will be wired here */}

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 font-chalk font-bold text-lg text-wood-brown underline underline-offset-4 hover:text-[#3d2210] transition-colors"
        >
          Go to Main Page
          <span>→</span>
        </button>
      </div>
    </main>
  );
}
