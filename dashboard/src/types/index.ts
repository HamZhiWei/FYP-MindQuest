export interface Profile {
  gender?: string;
  ageGroup?: string;
  faculty?: string;
  yearOfStudy?: number;
}

export interface Session {
  id: string;
  scenarioId: string;
  anonSessionToken: string;
  startedAt: string;
  endedAt?: string;
  completed: boolean;
  totalDecisionsMade: number;
  flaggedAsInvalid: boolean;
  flagReason?: string;
  submittedAt: string;
  profile: Profile;
}

export interface DecisionEvent {
  id: string;
  nodeId: string;
  choiceKey: string;
  reactionTimeMs: number;
  riskLevel: 'low' | 'mid' | 'high';
  anxietyProxyScore?: number;
  occurredAt: string;
}

export interface WellbeingScore {
  compositeIndex: number;
  riskBand: 'LOW' | 'MODERATE' | 'HIGH';
  weightVersion: string;
  scoredAt: string;
  breakdown: {
    avoidance: number;
    sleepSacrifice: number;
    anxietyProxy: number;
    socialWithdrawal: number;
    irritability: number;
    catastrophising: number;
    resilienceFailure: number;
    dropoutPenalty: number;
  };
}

export interface PSS10Response {
  totalScore: number;
  stressBand: 'LOW' | 'MODERATE' | 'HIGH';
  responses: Record<string, number>;
}

export interface SessionDetail extends Session {
  decisions: DecisionEvent[];
  wellbeingScore: WellbeingScore | null;
  pss10: PSS10Response | null;
}

export interface PaginatedSessions {
  sessions: Session[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardStats {
  totalSessions: number;
  flaggedSessions: number;
  riskBands: Record<string, number>;
}

export interface AuditEntry {
  id: number;
  action: string;
  actor: string;
  targetTable: string;
  detail: string;
  occurredAt: string;
}

export interface FlaggedSession {
  sessionId: string;
  scenarioId: string;
  flagReason?: string;
  avgRtMs?: number | null;
  allLowRisk: boolean;
  flaggedAt?: string;
  reviewed: boolean;
}
