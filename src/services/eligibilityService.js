// Proactive eligibility dashboard — frontend API client.
import { supabase, isSupabaseConfigured } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || '';

export async function getEligibilityDashboard() {
  if (!isSupabaseConfigured) {
    const err = new Error('Sign-in is not configured.'); err.code = 'SUPABASE_NOT_CONFIGURED'; throw err;
  }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) { const err = new Error('Please sign in.'); err.code = 'NO_SESSION'; throw err; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let res;
  try {
    res = await fetch(`${API}/api/eligibility/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const err = new Error(e.name === 'AbortError' ? 'The server took too long.' : 'Cannot reach the server.');
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  clearTimeout(timer);
  let payload = {};
  try { payload = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error(payload.error || 'Request failed'); err.code = payload.code; throw err;
  }
  return payload;
}
