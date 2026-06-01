import type { Choice, ScenarioId, SessionData } from '../types';

class GameManager {
  private static instance: GameManager;

  private session: SessionData | null = null;
  private energy: number = 75;
  private nodeStartTime: number = 0;
  private currentNodeId: string = '';

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  startSession(scenarioId: ScenarioId): void {
    this.session = {
      scenarioId,
      choices: [],
      startedAt: new Date().toISOString(),
      completedAt: '',
      completed: false,
    };
    this.energy = 75;
    this.nodeStartTime = 0;
    this.currentNodeId = '';
  }

  /** Call when a decision node becomes visible to start the reaction-time clock. */
  markNodeStart(nodeId: string): void {
    this.currentNodeId = nodeId;
    this.nodeStartTime = Date.now();
  }

  /** Milliseconds since the last markNodeStart() call. */
  getReactionTime(): number {
    return Date.now() - this.nodeStartTime;
  }

  recordChoice(choice: Choice): void {
    if (!this.session) throw new Error('No active session — call startSession() first');
    this.session.choices.push(choice);
  }

  endSession(): SessionData {
    if (!this.session) throw new Error('No active session');
    this.session.completedAt = new Date().toISOString();
    this.session.completed = true;
    return { ...this.session };
  }

  getSession(): SessionData | null {
    return this.session ? { ...this.session } : null;
  }

  getEnergyLevel(): number {
    return this.energy;
  }

  updateEnergy(delta: number): void {
    this.energy = Math.max(0, Math.min(100, this.energy + delta));
  }

  getCurrentNodeId(): string {
    return this.currentNodeId;
  }
}

export default GameManager.getInstance();
