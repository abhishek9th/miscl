import { supabase, isSupabaseConfigured } from './supabaseClient';
import { widgetSendOtp, widgetVerifyOtp, widgetRetryOtp, extractAccessToken, isOtpWidgetConfigured } from './msg91Widget';

const API = import.meta.env.VITE_API_URL || '';

async function postJson(path, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const err = new Error(
      e.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Please check your connection and try again.'
    );
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  clearTimeout(timer);
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error */
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    const err = new Error('Sign-in is not configured yet. Please try again later.');
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
}

const toPhone = (v) => {
  const d = String(v).replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

// ---------- LOGIN (email OR mobile + password — no OTP) ----------
export async function login(identifier, password) {
  ensureConfigured();
  const id = String(identifier || '').trim();
  if (!id) throw Object.assign(new Error('Please enter your email or mobile number'), { code: 'INVALID_INPUT' });
  if (!password) throw Object.assign(new Error('Please enter your password'), { code: 'INVALID_INPUT' });

  let email;
  if (/^\d{10}$/.test(id) || /^91\d{10}$/.test(id)) {
    // Mobile number → resolve to the account email.
    const r = await postJson('/api/auth/resolve-mobile', { mobile: id });
    email = r.email;
  } else if (id.includes('@')) {
    email = id.toLowerCase();
  } else {
    throw Object.assign(new Error('Enter a valid email or 10-digit mobile number'), { code: 'INVALID_INPUT' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const e = new Error(/invalid login/i.test(error.message) ? 'Incorrect email/mobile or password' : error.message);
    e.code = 'INVALID_CREDENTIALS';
    throw e;
  }
  return data.session;
}

// ---------- PHONE OTP (registration only, via MSG91 widget) ----------
function ensureOtpConfigured() {
  if (!isOtpWidgetConfigured) {
    const err = new Error('OTP service is not configured yet.');
    err.code = 'OTP_NOT_CONFIGURED';
    throw err;
  }
}

export function sendOtp(mobile) {
  ensureOtpConfigured();
  return widgetSendOtp(toPhone(mobile));
}

export function retryOtp(channel = null) {
  ensureOtpConfigured();
  return widgetRetryOtp(channel);
}

// Verifies the OTP with MSG91 and returns the access token, which the backend
// re-validates during /register.
export async function verifyOtp(_mobile, otp) {
  ensureOtpConfigured();
  const data = await widgetVerifyOtp(String(otp));
  const token = extractAccessToken(data);
  if (!token) {
    const err = new Error('Could not verify OTP. Please try again.');
    err.code = 'OTP_VERIFY_FAILED';
    throw err;
  }
  return { verificationToken: token };
}

// ---------- REGISTRATION ----------
// The backend (service role) creates the auth user with the real email, uploads
// the mandatory live photo to the private "faces" bucket, and inserts the
// profile row (with live_photo_url) atomically. We then sign in with email+password.
export async function register({ email, password, fullName, mobile, verificationToken, photoBase64, profile }) {
  ensureConfigured();
  const mail = String(email || '').trim().toLowerCase();
  await postJson('/api/auth/register', {
    email: mail,
    password,
    fullName,
    mobile,
    verificationToken,
    photoBase64,
    profile,
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
  if (error) {
    const e = new Error('Account created, but automatic sign-in failed. Please log in.');
    e.code = 'POST_REGISTER_SIGNIN_FAILED';
    throw e;
  }
  return data.session;
}

// ---------- FORGOT / RESET PASSWORD (OTP to registered mobile) ----------
// Confirms a profile exists for this mobile before an OTP is sent to it.
export function forgotCheck(mobile) {
  return postJson('/api/auth/forgot-check', { mobile });
}

// Verifies the OTP token + mobile match on the backend, sets the new password,
// then signs the user in with the returned email.
export async function resetPassword({ mobile, verificationToken, newPassword }) {
  ensureConfigured();
  const { email } = await postJson('/api/auth/reset-password', { mobile, verificationToken, newPassword });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: newPassword });
  if (error) {
    const e = new Error('Password updated. Please log in with your new password.');
    e.code = 'RESET_SIGNIN_FAILED';
    throw e;
  }
  return data.session;
}

// Signed URL to view a private live photo / document (buckets are private).
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  if (!isSupabaseConfigured || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

// ---------- SESSION / PROFILE ----------
export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function getProfile() {
  if (!isSupabaseConfigured) return null;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) return null;
  return data;
}

export async function signOut() {
  if (isSupabaseConfigured) await supabase.auth.signOut();
}
