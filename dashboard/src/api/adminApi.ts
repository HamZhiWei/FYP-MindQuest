import axios from 'axios';
import keycloak, { logout as keycloakLogout } from '../keycloak';
import type { PaginatedSessions, DashboardStats, AuditEntry, FlaggedSession } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

const authHeaders = async () => {
  try {
    await keycloak.updateToken(30);
  } catch {
    await keycloakLogout();
    throw new Error('Session expired');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${keycloak.token ?? ''}`,
  };
};

export const toGameParam = (label: string) => (label === 'All' ? 'all' : label);

export const toPeriodParam = (label: string) => {
  if (label === 'Mid-term') return 'midterm';
  if (label === 'Finals') return 'finals';
  return 'full';
};

const filterParams = (game = 'all', period = 'full') => ({ game, period });

// Staff info

export const getStaffName = (): string =>
  (keycloak.tokenParsed as Record<string, string> | undefined)?.preferred_username ??
  (keycloak.tokenParsed as Record<string, string> | undefined)?.name ??
  'Staff';

export const logout = () => keycloakLogout();

// Sessions
// not used
export const getSessions = async (page = 1, flaggedOnly = false): Promise<PaginatedSessions> => {
  const res = await axios.get(`${API_BASE}/dashboard/sessions`, {
    headers: await authHeaders(),
    params: { page, per_page: 20, flagged: flaggedOnly },
  });
  console.log(res.data);
  return res.data;
};

export const getFlagged = async (): Promise<FlaggedSession[]> => {
  const res = await axios.get(`${API_BASE}/dashboard/flagged`, { headers: await authHeaders() });
  return res.data;
};

export const reviewFlag = async (id: string, decision: 'keep' | 'exclude') => {
  const res = await axios.patch(
    `${API_BASE}/dashboard/flagged/${id}`,
    { decision },
    { headers: await authHeaders() },
  );
  return res.data;
};

// Analytics

export const getStats = async (game = 'all', period = 'full'): Promise<DashboardStats> => {
  const res = await axios.get(`${API_BASE}/dashboard/stats`, {
    headers: await authHeaders(),
    params: filterParams(game, period),
  });
  console.log("getStats",res.data);
  return res.data;
};

// not use
export const getMetrics = async (game = 'all', period = 'full') => {
  const res = await axios.get(`${API_BASE}/dashboard/metrics`, {
    headers: await authHeaders(),
    params: filterParams(game, period),
  });
  console.log("getMetrics",res.data);
  return res.data;
};

export const getTrend = async (game = 'all', period = 'full') => {
  const res = await axios.get(`${API_BASE}/dashboard/trend`, {
    headers: await authHeaders(),
    params: filterParams(game, period),
  });
  const rows: { week: number; avgComposite: number | null }[] = res.data;
  console.log("getTrend", rows);
  return {
    weeks: rows.map(w => ({
      week: `W${w.week}`,
      composite: w.avgComposite,
    })),
  };
};

export const getScores = async () => {
  const res = await axios.get(`${API_BASE}/dashboard/scores`, { headers: await authHeaders() });
  return res.data;
};

const INDICATOR_LABELS: Record<string, string> = {
  avoidance:         'Avoidance',
  sleepSacrifice:    'Sleep sacrifice',
  anxietyRt:         'Anxiety (RT)',
  socialWithdrawal:  'Social withdrawal',
  irritability:      'Irritability',
  catastrophising:   'Catastrophising',
  resilienceFailure: 'Resilience failure',
};

export const getIndicators = async (game = 'all', period = 'full') => {
  const res = await axios.get(`${API_BASE}/dashboard/indicators`, {
    headers: await authHeaders(),
    params: filterParams(game, period),
  });
  const d = res.data as Record<string, number>;
  return {
    indicators: Object.entries(INDICATOR_LABELS).map(([key, name]) => ({
      name,
      value: d[key] ?? 0,
    })),
  };
};

// later can add filtering by scenario/period
export const getRtAnalysis = async (game = 'all', period = 'full') => {
  const res = await axios.get(`${API_BASE}/dashboard/rt-analysis`, {
    headers: await authHeaders(),
    params: filterParams(game, period),
  });
  return (res.data as { nodeId: string; avgRtMs: number }[]).map(r => ({
    node: r.nodeId,
    avgRt: Math.round(r.avgRtMs / 100) / 10,
  }));
};

export const getPSS10Correlation = async () => {
  const res = await axios.get(`${API_BASE}/dashboard/pss10-correlation`, {
    headers: await authHeaders(),
  });
  return res.data;
};

// Weights

export const getWeights = async () => {
  const res = await axios.get(`${API_BASE}/weights`, { headers: await authHeaders() });
  return res.data;
};

export const activateWeight = async (id: string) => {
  const res = await axios.patch(`${API_BASE}/weights/${id}/activate`, {},
    { headers: await authHeaders() });
  return res.data;
};

// ── Tips ──────────────────────────────────────────────────────────────────────

export const getTips = async (scenarioId: string) => {
  const res = await axios.get(`${API_BASE}/tips/${scenarioId}`, { headers: await authHeaders() });
  return res.data;
};

export const updateTips = async (scenarioId: string, tips: string[]) => {
  const res = await axios.put(`${API_BASE}/tips/${scenarioId}`, { tips },
    { headers: await authHeaders() });
  return res.data;
};

// ── Audit log ─────────────────────────────────────────────────────────────────

export const getAuditLog = async (
  page = 1, action = '',
): Promise<{ entries: AuditEntry[]; total: number; page: number; pages: number }> => {
  const res = await axios.get(`${API_BASE}/audit-log`, {
    headers: await authHeaders(),
    params: { page, per_page: 20, ...(action ? { action } : {}) },
  });
  return res.data;
};

// ── Study config ──────────────────────────────────────────────────────────────

export const getStudyConfig = async (): Promise<{ semesterWeeks: (string | null)[] }> => {
  const res = await axios.get(`${API_BASE}/config`, { headers: await authHeaders() });
  return res.data;
};

export const backfillSemesterWeeks = async (): Promise<{ updated: number }> => {
  const res = await axios.post(`${API_BASE}/config/backfill`, {}, { headers: await authHeaders() });
  return res.data;
};

export const updateStudyConfig = async (semesterWeeks: (string | null)[]): Promise<{ semesterWeeks: (string | null)[] }> => {
  const res = await axios.patch(
    `${API_BASE}/config`,
    { semesterWeeks },
    { headers: await authHeaders() },
  );
  return res.data;
};

// ── Export ────────────────────────────────────────────────────────────────────

export const downloadExport = async (type: 'pilot' | 'sessions' | 'audit', filename: string) => {
  const res = await axios.get(`${API_BASE}/export/${type}`, {
    headers: { ...(await authHeaders()), Accept: 'text/csv' },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
