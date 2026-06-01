import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';

const WelcomePage       = lazy(() => import('./pages/WelcomePage'));
const WelcomeInfoPage   = lazy(() => import('./pages/WelcomeInfoPage'));
const ConsentPage       = lazy(() => import('./pages/ConsentPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));
const ScenarioSelectPage = lazy(() => import('./pages/ScenarioSelectPage'));
const GameIntroPage     = lazy(() => import('./pages/GameIntroPage'));
const GamePage          = lazy(() => import('./pages/GamePage'));
const AdvicePage        = lazy(() => import('./pages/AdvicePage'));
const PilotStudyPage    = lazy(() => import('./pages/PilotStudyPage'));
const PSS10Page         = lazy(() => import('./pages/PSS10Page'));
const DonePage          = lazy(() => import('./pages/DonePage'));

function Fallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-chalk-green text-chalk-white font-chalk">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/"               element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome"        element={<WelcomePage />} />
            <Route path="/welcome-info"   element={<WelcomeInfoPage />} />
            <Route path="/consent"        element={<ConsentPage />} />
            <Route path="/profile"        element={<ProfilePage />} />
            <Route path="/scenarios"      element={<ScenarioSelectPage />} />
            <Route path="/game/:scenarioId"       element={<GameIntroPage />} />
            <Route path="/game/:scenarioId/play" element={<GamePage />} />
            <Route path="/advise"         element={<AdvicePage />} />
            <Route path="/pilot-study"    element={<PilotStudyPage />} />
            <Route path="/pss10"          element={<PSS10Page />} />
            <Route path="/done"           element={<DonePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </GameProvider>
  );
}
