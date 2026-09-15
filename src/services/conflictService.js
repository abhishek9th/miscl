import { supabase, isSupabaseConfigured } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || '';

// Returns null when the user isn't signed in (conflicts need application
// history) — the caller simply shows nothing then.
export async function getSchemeConflicts(schemeId) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/conflicts/${encodeURIComponent(schemeId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
