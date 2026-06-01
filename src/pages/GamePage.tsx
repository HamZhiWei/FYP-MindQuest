import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Phaser from 'phaser';
import type { ScenarioId, SessionData } from '../types';
import GameManager from '../game/GameManager';
import { useGame } from '../context/GameContext';
import EnergyBar from '../components/EnergyBar';
import AssignmentDeadlineScene from '../game/scenes/AssignmentDeadlineScene';
import SleepDecisionsScene from '../game/scenes/SleepDecisionsScene';
import SocialInteractionScene from '../game/scenes/SocialInteractionScene';

// Map each scenarioId to the Phaser scene class that implements it.
// Add entries here as new scenarios are built.
const SCENE_MAP: Partial<Record<ScenarioId, new () => Phaser.Scene>> = {
  'assignment-deadline': AssignmentDeadlineScene,
  'sleep-decisions': SleepDecisionsScene,
  'social-interaction': SocialInteractionScene,
};

// ─── GamePage ────────────────────────────────────────────────────────────────

export default function GamePage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { energyLevel, setEnergyLevel, setSelectedScenario, setSessionData } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Stable ref so Phaser event handlers never capture a stale setter/navigate
  const setEnergyRef = useRef(setEnergyLevel);
  setEnergyRef.current = setEnergyLevel;
  const setSelectedScenarioRef = useRef(setSelectedScenario);
  setSelectedScenarioRef.current = setSelectedScenario;
  const setSessionDataRef = useRef(setSessionData);
  setSessionDataRef.current = setSessionData;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!scenarioId || !containerRef.current) return;

    const validId = scenarioId as ScenarioId;
    if (SCENE_MAP[validId]) {
      setSelectedScenarioRef.current(validId);
    }
    GameManager.startSession(validId);

    const SceneClass = SCENE_MAP[validId];

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1a1a00',
      parent: containerRef.current,
      // Phaser canvas fills full viewport; Tailwind is only used on the
      // React overlay above — never inside Phaser scene code.
      scene: SceneClass ? [SceneClass] : [],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // The scene applies the delta to GameManager before emitting this event.
    // This handler only reads the updated value to sync React state.
    game.events.on('updateEnergy', (_riskLevel: 'low' | 'mid' | 'high') => {
      setEnergyRef.current(GameManager.getEnergyLevel());
    });

    game.events.on('gameComplete', (session: SessionData) => {
      setSessionDataRef.current(session);
      if (SCENE_MAP[session.scenarioId as ScenarioId]) {
        setSelectedScenarioRef.current(session.scenarioId as ScenarioId);
      }
      navigateRef.current('/advise');
    });

    game.events.on('sceneComplete', (session: SessionData) => {
      setSessionDataRef.current(session);
      if (SCENE_MAP[session.scenarioId as ScenarioId]) {
        setSelectedScenarioRef.current(session.scenarioId as ScenarioId);
      }
      navigateRef.current('/advise');
    });

    game.events.on('navigateBack', () => {
      navigateRef.current('/scenarios');
    });

    game.events.on('navigateTo', (path: string) => {
      navigateRef.current(path);
    });

    return () => {
      game.events.off('updateEnergy');
      game.events.off('gameComplete');
      game.events.off('sceneComplete');
      game.events.off('navigateBack');
      game.events.off('navigateTo');
      game.destroy(true);
      gameRef.current = null;
    };
  }, [scenarioId]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a00]">
      {/* Phaser canvas mounts inside this div */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* React overlay — sits above the canvas, pointer-events-none so
          clicks pass through to Phaser except on interactive overlay elements */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <EnergyBar level={energyLevel} />
      </div>
    </div>
  );
}
