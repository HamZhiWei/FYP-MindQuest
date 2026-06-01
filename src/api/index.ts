import axios from 'axios';
import type { SessionData, PSS10Answer } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

export async function submitSession(session: SessionData): Promise<void> {
  await api.post('/api/session', session);
}

export async function submitPSS10(answers: PSS10Answer[]): Promise<void> {
  await api.post('/api/pss10', { answers });
}
