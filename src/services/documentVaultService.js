import { supabase, isSupabaseConfigured } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || '';

export async function getDocumentVault() {
  if (!isSupabaseConfigured) { const e = new Error('Sign-in not configured'); e.code = 'SUPABASE_NOT_CONFIGURED'; throw e; }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) { const e = new Error('Please sign in'); e.code = 'NO_SESSION'; throw e; }
  const res = await fetch(`${API}/api/documents/vault`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) { const e = new Error('Could not load documents'); throw e; }
  return res.json();
}
