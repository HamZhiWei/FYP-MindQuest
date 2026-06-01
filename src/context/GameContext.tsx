import { createContext, useContext, useState, ReactNode } from 'react';
import type { ScenarioId, ProfileData, SessionData, PSS10Answer } from '../types';

interface GameContextValue {
  selectedScenario: ScenarioId | null;
  setSelectedScenario: (id: ScenarioId | null) => void;
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  sessionData: SessionData | null;
  setSessionData: (data: SessionData | null) => void;
  pss10Answers: PSS10Answer[];
  setPss10Answers: (answers: PSS10Answer[]) => void;
  energyLevel: number;
  setEnergyLevel: (level: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [pss10Answers, setPss10Answers] = useState<PSS10Answer[]>([]);
  const [energyLevel, setEnergyLevel] = useState(75);

  return (
    <GameContext.Provider
      value={{
        selectedScenario,
        setSelectedScenario,
        profileData,
        setProfileData,
        sessionData,
        setSessionData,
        pss10Answers,
        setPss10Answers,
        energyLevel,
        setEnergyLevel,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
