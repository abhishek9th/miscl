import React, { useEffect, useState } from 'react';
import {
  X, LogOut, User, Phone, Mail, MapPin, CalendarDays, Users as UsersIcon,
  FileCheck2, ChevronRight, Trash2, Loader2, Pencil, IndianRupee, Check,
  AlertCircle, Home, Cake, Heart, GraduationCap, Briefcase, Sprout,
  Landmark, ShieldCheck, FileText, Hash,
} from 'lucide-react';
import { getMyApplications, unregisterScheme, getSignedUrl, updateMyProfile, getMyDocuments } from '../services/profileService';
import {
  getEligibilityProfile, getEmployment, getEducation, getFamilyMembers, getAgricultureProfile,
} from '../services/onboardingService';
import { listBankAccounts, getIdentity } from '../services/sensitiveProfileService';
import { INDIAN_STATES } from '../services/locationService';
import { ageFromDob } from '../utils/validators';
import { SCHEMES } from '../data/schemes';
import { useI18n } from '../i18n';

const CATEGORY_LABELS = { general: 'General', obc: 'OBC', sc: 'SC', st: 'ST', ews: 'EWS', minorities: 'Minorities' };
const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Other' };
const EDU_LABELS = {
  school: 'School', '10th': '10th', '12th': '12th', diploma: 'Diploma', undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate', phd: 'PhD', vocational: 'Vocational', other: 'Other',
};
const GENDER_OPTIONS = [{ v: 'female', en: 'Female', hi: 'महिला' }, { v: 'male', en: 'Male', hi: 'पुरुष' }, { v: 'other', en: 'Other', hi: 'अन्य' }];
const SOCIAL_OPTIONS = [
  { v: 'general', en: 'General', hi: 'सामान्य' }, { v: 'obc', en: 'OBC', hi: 'ओबीसी' }, { v: 'sc', en: 'SC', hi: 'अनुसूचित जाति' },
  { v: 'st', en: 'ST', hi: 'अनुसूचित जनजाति' }, { v: 'ews', en: 'EWS', hi: 'ईडब्ल्यूएस' }, { v: 'minorities', en: 'Minorities', hi: 'अल्पसंख्यक' },
];
const EDU_OPTIONS = [
  { v: 'school', en: 'School (up to 8th)', hi: 'स्कूल (8वीं तक)' }, { v: '10th', en: '10th', hi: '10वीं' }, { v: '12th', en: '12th', hi: '12वीं' },
  { v: 'diploma', en: 'Diploma', hi: 'डिप्लोमा' }, { v: 'undergraduate', en: 'Undergraduate', hi: 'स्नातक' },
  { v: 'postgraduate', en: 'Postgraduate', hi: 'स्नातकोत्तर' }, { v: 'phd', en: 'PhD', hi: 'पीएचडी' },
  { v: 'vocational', en: 'Vocational', hi: 'व्यावसायिक' }, { v: 'other', en: 'Other', hi: 'अन्य' },
];

// Always renders — a field the user hasn't filled shows an explicit "Not
// provided" prompt (rather than disappearing), so the profile visibly shows
// every field it tracks and invites the user to complete it.
function Row({ icon: Icon, label, value, onFill, fillLabel }) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <Icon className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${isEmpty ? 'text-slate-300' : 'text-slate-400'}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
        {isEmpty ? (
          <button onClick={onFill} disabled={!onFill}
            className="text-[14px] text-amber-700 italic font-medium hover:underline disabled:no-underline disabled:cursor-default text-left">
            {fillLabel}
          </button>
        ) : (
          <div className="text-[15px] text-slate-800 font-medium break-words">{value}</div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 flex items-center gap-2 first:mt-0">
      <Icon className="w-4 h-4" /> {children}
    </h3>
  );
}

export default function ProfilePanel({ profile, photoUrl, onClose, onSignOut, onOpenScheme, onProfileUpdated, startInEdit }) {
  const { tr } = useI18n();
  const [apps, setApps] = useState(null); // null = loading
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(Boolean(startInEdit));
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Richer onboarding data — fetched once, shown read-only here (edited via
  // the onboarding wizard / profile-specific flows, not inline in this panel).
  const [eligibility, setEligibility] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [education, setEducation] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [agriculture, setAgriculture] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [documents, setDocuments] = useState([]);

  function formFromProfile(p) {
    return {
      state: p?.state || '', gender: p?.gender || '', social_category: p?.social_category || '',
      annual_income: p?.annual_income ?? '', date_of_birth: p?.date_of_birth || '', age: p?.age ?? '',
      spouse_name: p?.spouse_name || '', address: p?.address || '', pincode: p?.pincode || '',
      education_level: p?.education_level || '', occupation: p?.occupation || '',
      annual_personal_income: p?.annual_personal_income ?? '', family_size: p?.family_size ?? '',
    };
  }

  useEffect(() => {
    let active = true;
    getMyApplications().then((list) => { if (active) setApps(list); });
    getEligibilityProfile().then((v) => active && setEligibility(v));
    getEmployment().then((v) => active && setEmployment(v));
    getEducation().then((v) => active && setEducation(v));
    getFamilyMembers().then((v) => active && setFamilyMembers(v));
    getAgricultureProfile().then((v) => active && setAgriculture(v));
    getMyDocuments().then((v) => active && setDocuments(v));
    listBankAccounts().then((r) => active && setBankAccounts(r.accounts || [])).catch(() => {});
    getIdentity().then((r) => active && setIdentity(r.identity)).catch(() => {});
    return () => { active = false; };
  }, []);

  // Keep the edit form in sync if the profile prop refreshes underneath us.
  useEffect(() => { setForm(formFromProfile(profile)); }, [profile]);

  const saveEdits = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateMyProfile({
        state: form.state, gender: form.gender, social_category: form.social_category,
        annual_income: form.annual_income === '' ? null : Number(form.annual_income),
        date_of_birth: form.date_of_birth || null, age: form.age === '' ? null : Number(form.age),
        spouse_name: form.spouse_name || null, address: form.address || null,
        pincode: form.pincode || null, education_level: form.education_level || null,
        occupation: form.occupation || null,
        annual_personal_income: form.annual_personal_income === '' ? null : Number(form.annual_personal_income),
        family_size: form.family_size === '' ? null : Number(form.family_size),
      });
      onProfileUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || tr('Could not save. Please try again.', 'सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।'));
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const remove = async (schemeId) => {
    await unregisterScheme(schemeId);
    setApps((prev) => (prev || []).filter((a) => a.scheme_id !== schemeId));
  };

  const openScheme = (app) => {
    const scheme = SCHEMES.find((s) => s.id === app.scheme_id);
    if (scheme && onOpenScheme) onOpenScheme(scheme);
  };

  const missingCore = !profile?.state || !profile?.gender || !profile?.social_category || !profile?.annual_income;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-[slideIn_.2s_ease-out]">
        <style>{`@keyframes slideIn{from{transform:translateX(24px);opacity:.6}to{transform:translateX(0);opacity:1}}`}</style>

        {/* Header */}
        <div className="bg-[#103a7e] text-white px-6 pt-6 pb-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full ring-4 ring-white/25 overflow-hidden bg-white/15 flex items-center justify-center shrink-0">
              {photoUrl
                ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-extrabold">{initials}</span>}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold leading-tight truncate">{profile?.full_name || tr('Your Profile', 'आपकी प्रोफ़ाइल')}</h2>
              {profile?.email && <p className="text-blue-100/90 text-sm truncate">{profile.email}</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ---- Core details ---- */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">{tr('My Details', 'मेरी जानकारी')}</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[12px] font-bold text-[#1d4ed8] hover:underline">
                <Pencil className="w-3.5 h-3.5" /> {tr('Edit', 'संपादित करें')}
              </button>
            )}
          </div>

          <div>
            <Row icon={User} label={tr('Full Name', 'पूरा नाम')} value={profile?.full_name}
              onFill={() => setEditing(true)} fillLabel={tr('Not provided', 'दर्ज नहीं किया गया')} />
            <Row icon={Mail} label={tr('Email', 'ईमेल')} value={profile?.email}
              fillLabel={tr('Not provided', 'दर्ज नहीं किया गया')} />
            <Row icon={Phone} label={tr('Mobile', 'मोबाइल')} value={profile?.phone ? `+${profile.phone}` : null}
              fillLabel={tr('Not provided', 'दर्ज नहीं किया गया')} />

            {!editing ? (
              <>
                {[
                  [CalendarDays, tr('Date of Birth', 'जन्म तिथि'), profile?.date_of_birth, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [Cake, tr('Age', 'आयु'), profile?.age, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [UsersIcon, tr('Gender', 'लिंग'), GENDER_LABELS[profile?.gender] || profile?.gender, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [Heart, tr("Spouse's Name", 'पति/पत्नी का नाम'), profile?.spouse_name, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [MapPin, tr('State', 'राज्य'), profile?.state, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [Home, tr('Address', 'पता'), profile?.address, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [Hash, tr('PIN Code', 'पिन कोड'), profile?.pincode, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [UsersIcon, tr('Category', 'श्रेणी'), CATEGORY_LABELS[profile?.social_category] || profile?.social_category, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [GraduationCap, tr('Qualification', 'शैक्षणिक योग्यता'), EDU_LABELS[profile?.education_level] || profile?.education_level, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [IndianRupee, tr('Annual Family Income', 'वार्षिक पारिवारिक आय'), profile?.annual_income ? `₹${Number(profile.annual_income).toLocaleString('en-IN')}` : null, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [IndianRupee, tr('Annual Personal Income', 'वार्षिक व्यक्तिगत आय'), profile?.annual_personal_income ? `₹${Number(profile.annual_personal_income).toLocaleString('en-IN')}` : null, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                  [UsersIcon, tr('Family Size', 'परिवार का आकार'), profile?.family_size, tr('Not provided — tap to add', 'दर्ज नहीं किया गया — जोड़ने के लिए टैप करें')],
                ].map(([Icon, label, value, fillLabel]) => (
                  <Row key={label} icon={Icon} label={label} value={value} onFill={() => setEditing(true)} fillLabel={fillLabel} />
                ))}
                {missingCore && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    {tr('Fill in the fields above for more accurate scheme matching.', 'अधिक सटीक योजना मिलान के लिए ऊपर दी गई जानकारी भरें।')}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3 py-2">
                {saveError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{saveError}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Date of Birth', 'जन्म तिथि')}</label>
                    <input type="date" value={form.date_of_birth}
                      onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value, age: ageFromDob(e.target.value) }))}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Age', 'आयु')}</label>
                    <input type="number" min="0" max="120" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{tr("Spouse's Name", 'पति/पत्नी का नाम')}</label>
                  <input type="text" value={form.spouse_name} onChange={(e) => setForm((f) => ({ ...f, spouse_name: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{tr('State', 'राज्य')}</label>
                  <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm">
                    <option value="">{tr('Select your state', 'अपना राज्य चुनें')}</option>
                    {INDIAN_STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Address', 'पता')}</label>
                  <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('PIN Code', 'पिन कोड')}</label>
                    <input type="text" inputMode="numeric" maxLength={6} value={form.pincode}
                      onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Gender', 'लिंग')}</label>
                    <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm">
                      <option value="">{tr('Select', 'चुनें')}</option>
                      {GENDER_OPTIONS.map((g) => <option key={g.v} value={g.v}>{tr(g.en, g.hi)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Category', 'श्रेणी')}</label>
                    <select value={form.social_category} onChange={(e) => setForm((f) => ({ ...f, social_category: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm">
                      <option value="">{tr('Select', 'चुनें')}</option>
                      {SOCIAL_OPTIONS.map((s) => <option key={s.v} value={s.v}>{tr(s.en, s.hi)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Qualification', 'शैक्षणिक योग्यता')}</label>
                    <select value={form.education_level} onChange={(e) => setForm((f) => ({ ...f, education_level: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm">
                      <option value="">{tr('Select', 'चुनें')}</option>
                      {EDU_OPTIONS.map((s) => <option key={s.v} value={s.v}>{tr(s.en, s.hi)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Annual Family Income (₹)', 'वार्षिक पारिवारिक आय (₹)')}</label>
                  <input type="number" value={form.annual_income} onChange={(e) => setForm((f) => ({ ...f, annual_income: e.target.value }))}
                    placeholder={tr('e.g. 250000', 'उदा. 250000')}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Occupation', 'व्यवसाय')}</label>
                  <input type="text" value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
                    placeholder={tr('e.g. Farmer, Student, Shopkeeper', 'उदा. किसान, छात्र, दुकानदार')}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Annual Personal Income (₹)', 'वार्षिक व्यक्तिगत आय (₹)')}</label>
                    <input type="number" value={form.annual_personal_income} onChange={(e) => setForm((f) => ({ ...f, annual_personal_income: e.target.value }))}
                      placeholder={tr('e.g. 150000', 'उदा. 150000')}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{tr('Family Size', 'परिवार का आकार')}</label>
                    <input type="number" min="1" value={form.family_size} onChange={(e) => setForm((f) => ({ ...f, family_size: e.target.value }))}
                      placeholder={tr('e.g. 4', 'उदा. 4')}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdits} disabled={saving}
                    className="flex-1 h-10 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-1.5">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {tr('Save', 'सहेजें')}
                  </button>
                  <button onClick={() => { setEditing(false); setSaveError(''); }} disabled={saving}
                    className="h-10 px-4 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold">
                    {tr('Cancel', 'रद्द करें')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---- Eligibility ---- */}
          {eligibility && (
            <>
              <SectionHeader icon={ShieldCheck}>{tr('Eligibility', 'पात्रता')}</SectionHeader>
              <Row icon={UsersIcon} label={tr('Caste / Community', 'जाति / समुदाय')} value={eligibility.caste_community} />
              <Row icon={ShieldCheck} label={tr('Minority Status', 'अल्पसंख्यक स्थिति')} value={eligibility.minority_status === true ? tr('Yes', 'हाँ') : eligibility.minority_status === false ? tr('No', 'नहीं') : null} />
              <Row icon={UsersIcon} label={tr('Disability Type', 'दिव्यांगता का प्रकार')} value={eligibility.disability_type} />
              <Row icon={UsersIcon} label={tr('Disability Percentage', 'दिव्यांगता प्रतिशत')} value={eligibility.disability_percentage ? `${eligibility.disability_percentage}%` : null} />
              <Row icon={Home} label={tr('Rural / Urban', 'ग्रामीण / शहरी')} value={eligibility.rural_urban} />
              <Row icon={FileText} label={tr('Ration Card Number', 'राशन कार्ड संख्या')} value={eligibility.ration_card_number} />
              <Row icon={ShieldCheck} label={tr('BPL Household', 'BPL परिवार')} value={eligibility.bpl_status === true ? tr('Yes', 'हाँ') : null} />
              <Row icon={ShieldCheck} label={tr('EWS Certified', 'EWS प्रमाणित')} value={eligibility.economically_weaker_section_status === true ? tr('Yes', 'हाँ') : null} />
              <Row icon={ShieldCheck} label={tr('Ex-Serviceman', 'भूतपूर्व सैनिक')} value={eligibility.ex_serviceman_status === true ? tr('Yes', 'हाँ') : null} />
              <Row icon={Briefcase} label={tr('Government Employee', 'सरकारी कर्मचारी')} value={eligibility.government_employee_status === true ? tr('Yes', 'हाँ') : null} />
            </>
          )}

          {/* ---- Employment ---- */}
          {employment && (
            <>
              <SectionHeader icon={Briefcase}>{tr('Occupation / Income', 'व्यवसाय / आय')}</SectionHeader>
              <Row icon={Briefcase} label={tr('Status', 'स्थिति')} value={employment.employment_status} />
              <Row icon={Briefcase} label={tr('Occupation', 'व्यवसाय')} value={employment.occupation} />
              <Row icon={Landmark} label={tr('Employer', 'नियोक्ता')} value={employment.employer_name} />
              <Row icon={IndianRupee} label={tr('Monthly Income', 'मासिक आय')} value={employment.monthly_income ? `₹${Number(employment.monthly_income).toLocaleString('en-IN')}` : null} />
              <Row icon={MapPin} label={tr('Work Location', 'कार्य स्थान')} value={employment.work_location} />
            </>
          )}

          {/* ---- Agriculture ---- */}
          {agriculture && (
            <>
              <SectionHeader icon={Sprout}>{tr('Agriculture', 'कृषि')}</SectionHeader>
              <Row icon={Sprout} label={tr('Land Ownership', 'भूमि स्वामित्व')} value={agriculture.land_ownership_status} />
              <Row icon={Sprout} label={tr('Total Land Area', 'कुल भूमि क्षेत्रफल')} value={agriculture.total_land_area ? `${agriculture.total_land_area} ${agriculture.land_area_unit || ''}` : null} />
              <Row icon={Sprout} label={tr('Irrigation', 'सिंचाई')} value={agriculture.irrigation_status} />
            </>
          )}

          {/* ---- Education entries ---- */}
          {education.length > 0 && (
            <>
              <SectionHeader icon={GraduationCap}>{tr('Education', 'शिक्षा')}</SectionHeader>
              {education.map((e) => (
                <Row key={e.education_id} icon={GraduationCap}
                  label={EDU_LABELS[e.education_level] || e.education_level}
                  value={[e.institution_name, e.passing_year].filter(Boolean).join(' — ') || tr('Added', 'जोड़ा गया')} />
              ))}
            </>
          )}

          {/* ---- Family members ---- */}
          {familyMembers.length > 0 && (
            <>
              <SectionHeader icon={UsersIcon}>{tr('Family Members', 'परिवार के सदस्य')}</SectionHeader>
              {familyMembers.map((m) => (
                <Row key={m.family_member_id} icon={UsersIcon} label={m.relationship || tr('Family Member', 'परिवार का सदस्य')} value={m.name} />
              ))}
            </>
          )}

          {/* ---- Bank accounts (masked) ---- */}
          {bankAccounts.length > 0 && (
            <>
              <SectionHeader icon={Landmark}>{tr('Bank Accounts', 'बैंक खाते')}</SectionHeader>
              {bankAccounts.map((b) => (
                <Row key={b.bank_account_id} icon={Landmark}
                  label={b.bank_name || tr('Bank Account', 'बैंक खाता')}
                  value={`•••• ${b.account_number_last4 || '····'}${b.is_primary ? ` (${tr('Primary', 'प्राथमिक')})` : ''}`} />
              ))}
            </>
          )}

          {/* ---- Government IDs (masked) ---- */}
          {identity && (identity.aadhaar_last4 || identity.pan_last4) && (
            <>
              <SectionHeader icon={ShieldCheck}>{tr('Government IDs', 'सरकारी पहचान पत्र')}</SectionHeader>
              {identity.aadhaar_last4 && <Row icon={ShieldCheck} label="Aadhaar" value={`•••• •••• ${identity.aadhaar_last4}`} />}
              {identity.pan_last4 && <Row icon={ShieldCheck} label="PAN" value={`•••••${identity.pan_last4}`} />}
            </>
          )}

          {/* ---- Documents ---- */}
          {documents.length > 0 && (
            <>
              <SectionHeader icon={FileText}>{tr('Documents', 'दस्तावेज़')}</SectionHeader>
              {documents.map((d) => (
                <Row key={d.id} icon={FileText} label={d.document_type?.replace(/_/g, ' ')} value={d.file_name || tr('Uploaded', 'अपलोड किया गया')} />
              ))}
            </>
          )}

          {/* ---- Registered schemes ---- */}
          <SectionHeader icon={FileCheck2}>{tr('Schemes You Registered For', 'आपकी पंजीकृत योजनाएँ')}</SectionHeader>

          {apps === null && (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> {tr('Loading…', 'लोड हो रहा है…')}
            </div>
          )}

          {apps && apps.length === 0 && (
            <div className="text-center text-slate-500 text-sm bg-slate-50 border border-slate-200 rounded-xl py-8 px-4">
              {tr('You haven’t registered for any schemes yet.', 'आपने अभी तक किसी योजना के लिए पंजीकरण नहीं किया है।')}
            </div>
          )}

          <div className="space-y-2.5">
            {(apps || []).map((app) => (
              <div key={app.scheme_id} className="border border-slate-200 rounded-xl p-3.5 hover:border-[#1d4ed8]/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => openScheme(app)} className="text-left min-w-0 group">
                    <div className="font-bold text-slate-800 group-hover:text-[#1d4ed8] truncate">{app.scheme_name || app.scheme_id}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {tr('Registered on', 'पंजीकरण तिथि')} {new Date(app.registered_at).toLocaleDateString()}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 capitalize">{app.status}</span>
                    <button onClick={() => remove(app.scheme_id)} className="text-slate-400 hover:text-red-600 p-1" aria-label="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {SCHEMES.some((s) => s.id === app.scheme_id) && (
                  <button onClick={() => openScheme(app)} className="mt-2 text-[13px] font-semibold text-[#1d4ed8] flex items-center gap-1 hover:underline">
                    {tr('View details', 'विवरण देखें')} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={async () => { setSigningOut(true); await onSignOut?.(); }}
            disabled={signingOut}
            className="w-full h-12 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            {tr('Sign Out', 'साइन आउट')}
          </button>
        </div>
      </aside>
    </div>
  );
}
