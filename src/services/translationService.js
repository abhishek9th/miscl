/**
 * Client-side runtime translation with persistent caching.
 *
 * Every translatable string in the app funnels through here. For the active
 * language we look up a cached translation; if it is missing we queue the
 * source text, batch-send it to the Groq-backed /api/translate endpoint, store
 * the result in localStorage, and notify subscribers so the UI re-renders with
 * the translated text. If the backend is unavailable the app keeps showing the
 * source (English/Hindi) text, so nothing ever breaks.
 */

const STORAGE_KEY = 'schemesetu_i18n_cache_v1';
// Short UI strings batch fine at 40/request, but long scraped content (scheme
// descriptions can run 300-500+ chars each) makes the model's JSON output big
// enough that generation can exceed a 20s timeout at that batch size — so a
// smaller batch is used whenever the queued texts are long (see chunkForFlush).
const BATCH_SIZE = 40;
const LONG_TEXT_BATCH_SIZE = 8;
const LONG_TEXT_THRESHOLD = 120; // chars
const FLUSH_DELAY = 60; // ms – coalesce a render's worth of requests
const FETCH_TIMEOUT_MS = 45000;

// cache shape: { [lang]: { [ `${sourceLang}::${text}` ]: translatedText } }
let cache = loadCache();

// pending[lang] = Map<cacheKey, { text, sourceLang }>
const pending = {};
// keys already sent and awaiting a response, so we don't resend mid-flight
const inFlight = new Set();
const subscribers = new Set();
let flushTimer = null;

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* quota / private mode – in-memory cache still works this session */
  }
}

function keyFor(sourceLang, text) {
  return `${sourceLang}::${text}`;
}

export function subscribe(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function notify() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore subscriber errors */
    }
  });
}

/**
 * Synchronous lookup. Returns the translated string if cached, else undefined.
 * If not cached (and target !== source), the text is queued for translation.
 */
export function lookup(text, targetLang, sourceLang = 'en') {
  if (text == null || text === '') return text;
  if (targetLang === sourceLang) return text;

  const k = keyFor(sourceLang, text);
  const langCache = cache[targetLang];
  if (langCache && Object.prototype.hasOwnProperty.call(langCache, k)) {
    return langCache[k];
  }

  queue(text, targetLang, sourceLang);
  return undefined;
}

function queue(text, targetLang, sourceLang) {
  const k = keyFor(sourceLang, text);
  if (inFlight.has(`${targetLang}::${k}`)) return;
  if (!pending[targetLang]) pending[targetLang] = new Map();
  if (pending[targetLang].has(k)) return;
  pending[targetLang].set(k, { text, sourceLang });
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY);
}

async function flush() {
  const langs = Object.keys(pending);
  for (const lang of langs) {
    const entries = Array.from(pending[lang].entries());
    if (entries.length === 0) continue;
    delete pending[lang];

    // Group by source language, then chunk.
    const bySource = {};
    for (const [k, { text, sourceLang }] of entries) {
      if (!bySource[sourceLang]) bySource[sourceLang] = [];
      bySource[sourceLang].push({ k, text });
      inFlight.add(`${lang}::${k}`);
    }

    for (const sourceLang of Object.keys(bySource)) {
      const list = bySource[sourceLang];
      const isLong = list.some((item) => item.text.length > LONG_TEXT_THRESHOLD);
      const size = isLong ? LONG_TEXT_BATCH_SIZE : BATCH_SIZE;
      for (let i = 0; i < list.length; i += size) {
        const chunk = list.slice(i, i + size);
        // Fire batches without blocking one another.
        translateChunk(chunk, lang, sourceLang);
      }
    }
  }
}

async function translateChunk(chunk, targetLang, sourceLang) {
  const texts = chunk.map((c) => c.text);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang, sourceLang }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`translate ${res.status}`);
    const data = await res.json();
    const translations = Array.isArray(data.translations) ? data.translations : [];

    if (!cache[targetLang]) cache[targetLang] = {};
    chunk.forEach((c, idx) => {
      const translated = translations[idx];
      if (typeof translated === 'string' && translated.length > 0) {
        cache[targetLang][c.k] = translated;
      }
      inFlight.delete(`${targetLang}::${c.k}`);
    });
    persist();
    notify();
  } catch {
    // Release in-flight locks so a later render can retry.
    chunk.forEach((c) => inFlight.delete(`${targetLang}::${c.k}`));
  }
}

/**
 * Warm the cache for a set of strings without waiting on the result.
 * Useful when switching language to pre-fetch visible content.
 */
export function prime(texts, targetLang, sourceLang = 'en') {
  if (targetLang === sourceLang) return;
  texts.forEach((t) => {
    if (t) lookup(t, targetLang, sourceLang);
  });
}
