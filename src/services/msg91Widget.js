// MSG91 OTP Widget integration (client-side) using exposeMethods: true.
// Loads https://verify.msg91.com/otp-provider.js once, initialises the widget,
// and exposes promise-based wrappers around the window methods:
//   window.sendOtp / window.verifyOtp / window.retryOtp / window.getWidgetData
// No MSG91 popup is shown — we drive it from our own UI.

const WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID;
const TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH;

export const isOtpWidgetConfigured = Boolean(WIDGET_ID && TOKEN_AUTH);

const CAPTCHA_RENDER_ID = 'msg91-captcha';

let loadPromise = null;

function normalizeErr(err) {
  const msg =
    (err && (err.message || err.msg || err.error)) ||
    (typeof err === 'string' ? err : '') ||
    'OTP request failed';
  return new Error(msg);
}

// Extract the verified access token from a verifyOtp success payload. MSG91 has
// returned this under a few shapes across versions, so check them all.
export function extractAccessToken(data) {
  if (!data) return null;
  return (
    data.message ||
    data['access-token'] ||
    data.accessToken ||
    data.token ||
    (typeof data === 'string' ? data : null)
  );
}

// Warm the network path to MSG91 early (DNS + TLS) so the later script fetch is
// fast. Cheap and safe to call on mount; does nothing if already done.
export function warmupOtpWidget() {
  if (!isOtpWidgetConfigured || typeof document === 'undefined') return;
  if (document.getElementById('msg91-warmup')) return;
  const marker = document.createElement('meta');
  marker.id = 'msg91-warmup';
  document.head.appendChild(marker);
  for (const rel of ['dns-prefetch', 'preconnect']) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = 'https://verify.msg91.com';
    if (rel === 'preconnect') link.crossOrigin = '';
    document.head.appendChild(link);
  }
}

export function loadOtpWidget() {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (!isOtpWidgetConfigured) {
      reject(new Error('OTP widget is not configured'));
      return;
    }
    if (typeof window !== 'undefined' && window.sendOtp && window.verifyOtp) {
      resolve();
      return;
    }
    const configuration = {
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
      exposeMethods: true,
      captchaRenderId: CAPTCHA_RENDER_ID,
      success: () => {},
      failure: () => {},
    };
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      try {
        window.initSendOTP(configuration);
      } catch {
        /* init may still expose methods shortly */
      }
      const start = Date.now();
      const poll = () => {
        if (window.sendOtp && window.verifyOtp) resolve();
        else if (Date.now() - start > 8000) reject(new Error('OTP widget failed to initialise'));
        else setTimeout(poll, 100);
      };
      poll();
    };
    script.onerror = () => reject(new Error('Could not load the OTP service'));
    document.body.appendChild(script);
  });
  return loadPromise;
}

// identifier: mobile with country code, no "+"  (e.g. 919999999999)
export async function widgetSendOtp(identifier) {
  await loadOtpWidget();
  return new Promise((resolve, reject) => {
    window.sendOtp(identifier, (data) => resolve(data), (err) => reject(normalizeErr(err)));
  });
}

export function widgetVerifyOtp(otp) {
  return new Promise((resolve, reject) => {
    if (!window.verifyOtp) return reject(new Error('OTP is not ready. Please resend the code.'));
    window.verifyOtp(otp, (data) => resolve(data), (err) => reject(normalizeErr(err)));
  });
}

// channel: null for default widget config (see MSG91 docs for custom channels)
export function widgetRetryOtp(channel = null) {
  return new Promise((resolve, reject) => {
    if (!window.retryOtp) return reject(new Error('OTP is not ready.'));
    window.retryOtp(channel, (data) => resolve(data), (err) => reject(normalizeErr(err)));
  });
}

export function widgetGetData() {
  return typeof window !== 'undefined' && window.getWidgetData ? window.getWidgetData() : null;
}

export { CAPTCHA_RENDER_ID };
