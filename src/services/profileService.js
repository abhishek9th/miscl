import { supabase, isSupabaseConfigured } from './supabaseClient';

async function currentUid() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

// Whitelisted, user-editable profile columns (matches the profiles table —
// see supabase/migrations/20260911_schemesetu_profiles.sql). Kept narrow on
// purpose: identity fields (email, phone, live_photo_url) are set at
// registration and not editable here.
// NOTE: aadhaar_number / pan_number are deliberately NOT in this list — those
// are legacy plaintext columns superseded by the encrypted
// identity_documents_sensitive table (see sensitiveProfileService.js /
// backend/routes/identity.js). Writing to them here would reintroduce
// plaintext storage of highly-sensitive data.
const EDITABLE_PROFILE_FIELDS = [
  'state', 'district', 'gender', 'social_category', 'annual_income',
  'date_of_birth', 'occupation', 'education_level', 'disability_status',
  'marital_status', 'family_size', 'age', 'spouse_name', 'address', 'pincode',
  'annual_personal_income',
];

// Patch the signed-in user's own profile row (RLS restricts this to their own
// id). Only whitelisted fields are sent; anything else in `updates` is dropped.
export async function updateMyProfile(updates) {
  const uid = await currentUid();
  if (!uid) throw new Error('Not signed in');
  const patch = {};
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (key in updates) patch[key] = updates[key] === '' ? null : updates[key];
  }
  if (Object.keys(patch).length === 0) return null;
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', uid).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// Schemes the signed-in user has registered for (newest first).
export async function getMyApplications() {
  const uid = await currentUid();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('scheme_applications')
    .select('*')
    .eq('user_id', uid)
    .order('registered_at', { ascending: false });
  if (error) return []; // table may not exist yet — fail soft
  return data || [];
}

// Register (or re-register) the user for a scheme. Idempotent on (user, scheme).
export async function registerScheme(scheme) {
  const uid = await currentUid();
  if (!uid) throw new Error('Not signed in');
  const row = {
    user_id: uid,
    scheme_id: scheme.id || scheme.name,
    scheme_name: scheme.name || scheme.name_hi || null,
    scheme_type: scheme.type || (scheme.student_type ? 'student' : null),
    status: 'registered',
    registered_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('scheme_applications')
    .upsert(row, { onConflict: 'user_id,scheme_id' });
  if (error) throw new Error(error.message);
  return true;
}

export async function unregisterScheme(schemeId) {
  const uid = await currentUid();
  if (!uid) return;
  await supabase.from('scheme_applications').delete().eq('user_id', uid).eq('scheme_id', schemeId);
}

// Documents the signed-in user has uploaded to their vault (newest first).
export async function getMyDocuments() {
  const uid = await currentUid();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', uid)
    .order('uploaded_at', { ascending: false });
  if (error) return [];
  return data || [];
}

// Upload a single PDF into the private "documents" bucket at <uid>/<type>_<ts>.pdf
// and record it in user_documents. RLS scopes both the object and the row to the
// owner. Only PDFs are accepted here (the profile vault expects PDF copies).
export async function uploadUserDocument(documentType, file) {
  const uid = await currentUid();
  if (!uid) throw new Error('Not signed in');
  if (!file) throw new Error('No file selected');
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name || '')) {
    throw new Error('Please upload a PDF file');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('File is too large (max 10 MB)');

  const path = `${uid}/${documentType}_${Date.now()}.pdf`;
  const { error: upErr } = await supabase.storage
    .from('documents')
    .upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data, error } = await supabase
    .from('user_documents')
    .insert({
      user_id: uid,
      document_type: documentType,
      file_path: path,
      file_name: file.name || `${documentType}.pdf`,
      mime_type: 'application/pdf',
    })
    .select()
    .single();
  if (error) {
    // Roll back the uploaded object if the row insert fails.
    await supabase.storage.from('documents').remove([path]).catch(() => {});
    throw new Error(error.message);
  }
  return data;
}

// Short-lived signed URL for a private storage object (e.g. the live photo).
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  if (!isSupabaseConfigured || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
