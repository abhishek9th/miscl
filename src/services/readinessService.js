// Application Readiness & Document Checker — frontend API client.
import { supabase, isSupabaseConfigured } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || '';

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

export const getReadinessReport = (schemeId, lang = 'hi') =>
  authedFetch(`/api/readiness/${schemeId}?lang=${lang}`);

export const findNearbyPartners = ({ lat, lon, state, district, radiusKm = 25 } = {}) => {
  const params = new URLSearchParams();
  if (lat != null && lon != null) { params.set('lat', lat); params.set('lon', lon); params.set('radius_km', radiusKm); }
  if (state) params.set('state', state);
  if (district) params.set('district', district);
  return authedFetch(`/api/partners/nearby?${params.toString()}`);
};

// ---- document_availability (non-sensitive — direct Supabase, RLS-scoped) --
export async function markDocumentAvailability(documentType, status, note = null) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('document_availability')
    .upsert({ user_id: uid, document_type: documentType, status, note }, { onConflict: 'user_id,document_type' })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDocumentAvailability() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase.from('document_availability').select('*').eq('user_id', uid);
  if (error) return [];
  return data || [];
}
