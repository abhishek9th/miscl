import { createClient } from '@supabase/supabase-js';

// Frontend Supabase client — uses the PUBLIC anon key only. Never put the
// service-role key here. Session is persisted in localStorage by supabase-js.
const url = import.meta.env.VITE_SUPABASE_URL;
// Accept either the legacy anon-key name or the newer "publishable key" name.
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
