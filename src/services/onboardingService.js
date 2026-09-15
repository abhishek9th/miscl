// Non-sensitive onboarding data — written directly to Supabase from the
// frontend (RLS scopes every row to auth.uid()). Highly-sensitive data
// (Aadhaar/PAN/bank accounts) goes through backend/routes/identity.js and
// backend/routes/bankAccounts.js instead — see sensitiveProfileService.js.
import { supabase, isSupabaseConfigured } from './supabaseClient';

async function currentUid() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

function requireUid(uid) {
  if (!uid) throw new Error('Not signed in');
}

// ---------- core profile (name parts, domicile, language, income) ----------
// Whitelisted to the reusable columns added in 20260915_profile_extension.sql
// plus the pre-existing reusable columns on profiles.
const PROFILE_ONBOARDING_FIELDS = [
  'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
  'fathers_name', 'mothers_name', 'marital_status', 'spouse_name',
  'nationality', 'domicile_state', 'preferred_language', 'state', 'district',
  'social_category', 'disability_status', 'occupation', 'education_level',
  'family_size', 'annual_income', 'annual_personal_income', 'number_of_dependents',
  'number_of_earning_members', 'number_of_children', 'number_of_children_below_5',
  'number_of_senior_citizens', 'number_of_disabled_members', 'is_household_head',
  'primary_income_source', 'secondary_income_source', 'income_category',
];

// Persists the browser-granted location (state + coordinates) directly to the
// user's profile once permission is given — powers "Find help near me"
// without asking for location again on every visit.
export async function saveUserLocation({ state, lat, lon }) {
  const uid = await currentUid();
  if (!uid) return null; // not signed in yet (e.g. granted on the pre-login screen) — nothing to save
  const patch = {};
  if (state) patch.state = state;
  if (lat != null && lon != null) {
    patch.last_latitude = lat;
    patch.last_longitude = lon;
    patch.location_updated_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 0) return null;
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', uid).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOnboardingProfile(updates) {
  const uid = await currentUid();
  requireUid(uid);
  const patch = {};
  for (const key of PROFILE_ONBOARDING_FIELDS) {
    if (key in updates) patch[key] = updates[key] === '' ? null : updates[key];
  }
  if (Object.keys(patch).length === 0) return null;
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', uid).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------- addresses ----------
export async function getAddresses() {
  const uid = await currentUid();
  if (!uid) return [];
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', uid);
  if (error) return [];
  return data || [];
}

// Upserts one address row by (user_id, address_type).
export async function saveAddress(addressType, fields) {
  const uid = await currentUid();
  requireUid(uid);
  const row = { user_id: uid, address_type: addressType, ...fields };
  const { data, error } = await supabase
    .from('addresses').upsert(row, { onConflict: 'user_id,address_type' }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------- eligibility profile (one row per user) ----------
export async function getEligibilityProfile() {
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await supabase.from('eligibility_profile').select('*').eq('user_id', uid).maybeSingle();
  if (error) return null;
  return data;
}

export async function saveEligibilityProfile(fields) {
  const uid = await currentUid();
  requireUid(uid);
  const { data, error } = await supabase
    .from('eligibility_profile').upsert({ user_id: uid, ...fields }, { onConflict: 'user_id' }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------- family members (multiple rows) ----------
export async function getFamilyMembers() {
  const uid = await currentUid();
  if (!uid) return [];
  const { data, error } = await supabase.from('family_members').select('*').eq('user_id', uid).order('created_at');
  if (error) return [];
  return data || [];
}

export async function addFamilyMember(member) {
  const uid = await currentUid();
  requireUid(uid);
  const { data, error } = await supabase.from('family_members').insert({ user_id: uid, ...member }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeFamilyMember(familyMemberId) {
  const uid = await currentUid();
  if (!uid) return;
  await supabase.from('family_members').delete().eq('family_member_id', familyMemberId).eq('user_id', uid);
}

// ---------- education (multiple rows) ----------
export async function getEducation() {
  const uid = await currentUid();
  if (!uid) return [];
  const { data, error } = await supabase.from('education').select('*').eq('user_id', uid).order('created_at');
  if (error) return [];
  return data || [];
}

export async function addEducation(entry) {
  const uid = await currentUid();
  requireUid(uid);
  const { data, error } = await supabase.from('education').insert({ user_id: uid, ...entry }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeEducation(educationId) {
  const uid = await currentUid();
  if (!uid) return;
  await supabase.from('education').delete().eq('education_id', educationId).eq('user_id', uid);
}

// ---------- employment (current snapshot) ----------
export async function getEmployment() {
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await supabase.from('employment').select('*').eq('user_id', uid)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return null;
  return data;
}

export async function saveEmployment(fields) {
  const uid = await currentUid();
  requireUid(uid);
  const existing = await getEmployment();
  if (existing) {
    const { data, error } = await supabase.from('employment').update(fields)
      .eq('employment_id', existing.employment_id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase.from('employment').insert({ user_id: uid, ...fields }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------- agriculture profile (one row per user) ----------
export async function getAgricultureProfile() {
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await supabase.from('agriculture_profile').select('*').eq('user_id', uid).maybeSingle();
  if (error) return null;
  return data;
}

export async function saveAgricultureProfile(fields) {
  const uid = await currentUid();
  requireUid(uid);
  const { data, error } = await supabase
    .from('agriculture_profile').upsert({ user_id: uid, ...fields }, { onConflict: 'user_id' }).select().single();
  if (error) throw new Error(error.message);
  return data;
}
