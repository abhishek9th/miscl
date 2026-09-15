import { supabase, isSupabaseConfigured } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || '';

// Attach the signed-in user's Supabase access token so the backend can identify
// them (requireUser middleware). The token is only ever sent to our own backend.
async function authedFetch(path, { method = 'GET', body } = {}) {
  if (!isSupabaseConfigured) {
    const err = new Error('Sign-in is not configured.'); err.code = 'SUPABASE_NOT_CONFIGURED'; throw err;
  }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) { const err = new Error('Please sign in to continue.'); err.code = 'NO_SESSION'; throw err; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const err = new Error(e.name === 'AbortError' ? 'The server took too long to respond.' : 'Cannot reach the server.');
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  clearTimeout(timer);
  let payload = {};
  try { payload = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error(payload.error || 'Request failed');
    err.code = payload.code; err.status = res.status;
    throw err;
  }
  return payload;
}

// ---- guided journey --------------------------------------------------------
export const startJourney = (scheme) =>
  authedFetch('/api/journey/start', { method: 'POST', body: { scheme } });

export const getJourney = (id) => authedFetch(`/api/journey/${id}`);
export const listJourneys = () => authedFetch('/api/journey/list');
export const getJourneyEvents = (id) => authedFetch(`/api/journey/${id}/events`);

export const provideJourneyInput = (id, value) =>
  authedFetch(`/api/journey/${id}/input`, { method: 'POST', body: { value } });

export const checkJourneyStatus = (id) =>
  authedFetch(`/api/journey/${id}/check-status`, { method: 'POST' });

export const deleteJourney = (id) => authedFetch(`/api/journey/${id}`, { method: 'DELETE' });

// ---- connected portals / credentials --------------------------------------
export const listCredentials = () => authedFetch('/api/credentials');
export const saveCredential = (payload) => authedFetch('/api/credentials', { method: 'POST', body: payload });
export const setCredentialEnabled = (id, enabled) =>
  authedFetch(`/api/credentials/${id}`, { method: 'PATCH', body: { enabled } });
export const deleteCredential = (id) => authedFetch(`/api/credentials/${id}`, { method: 'DELETE' });
