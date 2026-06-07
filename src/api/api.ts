import axios from 'axios';
import type { SessionData, PSS10Answer, ProfileData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getSessionToken = () => sessionStorage.getItem('sessionToken') ?? '';
const getSessionId    = () => sessionStorage.getItem('sessionId')    ?? '';

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Session-ID': getSessionToken(),
});

export const initSession = async (profileData: ProfileData) => {
  const res = await axios.post(`${API_BASE}/sessions/init`, { profileData });
  const { anonSessionToken, sessionId } = res.data;
  sessionStorage.setItem('sessionToken', anonSessionToken);
  sessionStorage.setItem('sessionId',    sessionId);
  return res.data;
};

export const submitSession = async (session: SessionData) =>
  axios.post(
    `${API_BASE}/sessions`,
    { ...session, anonSessionToken: getSessionToken(), sessionId: getSessionId() },
    { headers: headers() },
  );

export const submitProfile = async (profileData: ProfileData) =>
  axios.post(
    `${API_BASE}/profile`,
    { ...profileData, sessionId: getSessionId() },
    { headers: headers() },
  );

export const submitPSS10 = async (answers: PSS10Answer[]) =>
  axios.post(
    `${API_BASE}/pss10`,
    { sessionId: getSessionId(), responses: answers },
    { headers: headers() },
  );
