import { supabase, isSupabaseConfigured } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || '';

// Financial Advisor: POST the user's own description of their situation, get
// back ONE recommended scheme with a fully-calculated funding + loan plan.
// Nothing about the user's finances is stored or logged.
export async function getFundingPlan(situation, language = 'en') {
  if (!isSupabaseConfigured) { const e = new Error('Sign-in is not configured.'); e.code = 'SUPABASE_NOT_CONFIGURED'; throw e; }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) { const e = new Error('Please sign in to continue.'); e.code = 'NO_SESSION'; throw e; }

  let res;
  try {
    res = await fetch(`${API}/api/advisor/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ situation, language }),
      signal: AbortSignal.timeout(60000), // Render cold start can take ~50s
    });
  } catch (err) {
    const e = new Error(err.name === 'TimeoutError' ? 'The server took too long to respond. Please try again.' : 'Cannot reach the server.');
    e.code = 'NETWORK_ERROR';
    throw e;
  }
  let payload = {};
  try { payload = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const e = new Error(payload.error || 'Request failed');
    e.code = payload.code; e.field = payload.field; e.status = res.status;
    throw e;
  }
  return payload;
}
