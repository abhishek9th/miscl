/**
 * Native browse/search over the full myscheme.gov.in catalogue, served from
 * SchemeSetu's own backend (public.myscheme_catalogue) — never a redirect to
 * the official site. Every scheme here was scraped from the government's own
 * platform, not AI-generated (see backend/scripts/scrapeSchemeIndex.mjs).
 */
export async function searchCatalogue({ q = '', level, ministry, state, category, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  if (level) params.set('level', level);
  if (ministry) params.set('ministry', ministry);
  if (state) params.set('state', state);
  if (category) params.set('category', category);

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogue/search?${params.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('Could not search the scheme catalogue');
  return res.json();
}

export async function getCatalogueFilters() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogue/filters`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('Could not load catalogue filters');
  return res.json();
}

// Catalogue schemes the signed-in user is likely eligible for, from
// AI-extracted criteria. `benefitTypes` narrows to what the user is after
// (e.g. ['loan','subsidy']). Returns [] when signed-out or nothing matches —
// never throws to the caller, so the results screen degrades gracefully.
export async function getEligibleCatalogueSchemes(benefitTypes = [], limit = 12) {
  try {
    const { supabase, isSupabaseConfigured } = await import('./supabaseClient');
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return [];
    const params = new URLSearchParams({ limit: String(limit) });
    if (benefitTypes.length) params.set('benefit_types', benefitTypes.join(','));
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogue/eligible?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.schemes) ? json.schemes : [];
  } catch {
    return [];
  }
}

export async function getCatalogueScheme(slug) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalogue/${encodeURIComponent(slug)}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('Could not load this scheme');
  const data = await res.json();
  return data.scheme;
}
