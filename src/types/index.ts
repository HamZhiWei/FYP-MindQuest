export interface Choice {
  nodeId: string;
  choiceKey: string;
  reactionTimeMs: number;
  riskLevel: 'low' | 'mid' | 'high';
}

export interface SessionData {
  scenarioId: string;
  choices: Choice[];
  startedAt: string;
  completedAt: string;
  completed: boolean;
}

export interface ProfileData {
  gender?: string;
  ageGroup?: string;
  faculty?: string;
  yearOfStudy?: string;
}

export interface PSS10Answer {
  questionId: number;
  answer: number;
}

export type ScenarioId =
  | 'assignment-deadline'
  | 'sleep-decisions'
  | 'social-interaction';

export type RiskBand = 'LOW' | 'MODERATE' | 'HIGH';

export interface SceneData {
  scenarioId: ScenarioId;
}
