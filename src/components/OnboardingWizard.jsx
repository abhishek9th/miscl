import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ShieldCheck, Loader2, CheckCircle2, Plus, Trash2,
  AlertCircle, FileText, UploadCloud, Info,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { INDIAN_STATES } from '../services/locationService';
import {
  updateOnboardingProfile, saveAddress, saveEligibilityProfile,
  addFamilyMember, removeFamilyMember, getFamilyMembers,
  addEducation, removeEducation, getEducation,
  saveEmployment, saveAgricultureProfile,
} from '../services/onboardingService';
import { saveIdentity, addBankAccount, saveConsents } from '../services/sensitiveProfileService';
import { uploadUserDocument, getMyDocuments } from '../services/profileService';
import {
  isValidPincode, isValidIfsc, isValidAadhaar, isValidPan, isValidPastDate, isValidPercentage,
} from '../utils/validators';

const TOTAL_STEPS = 11;
const CONSENT_VERSION = '1.0';

const cls = {
  input: 'w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:border-gov-navy focus:outline-none focus:ring-2 focus:ring-gov-navy/15',
  label: 'block text-sm font-bold text-gov-navy mb-1.5',
  section: 'space-y-4',
  card: 'bg-white border border-slate-200 rounded-xl p-5 sm:p-6',
};

function Field({ label, hint, children, error }) {
  return (
    <div>
      <label className={cls.label}>{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function YesNo({ value, onChange, yesLabel, noLabel }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className={`flex-1 h-11 rounded-lg border-2 font-bold text-sm ${value === true ? 'bg-gov-navy border-gov-navy text-white' : 'border-slate-300 text-slate-700'}`}>
        {yesLabel}
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`flex-1 h-11 rounded-lg border-2 font-bold text-sm ${value === false ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-300 text-slate-700'}`}>
        {noLabel}
      </button>
    </div>
  );
}

function StepShell({ title, subtitle, stepIndex, onBack, onNext, nextLabel, nextDisabled, busy, error, children, skippable, onSkip }) {
  const { tr } = useI18n();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold text-sm hover:underline">
            <ArrowLeft className="w-4 h-4" /> {tr('Back', 'वापस')}
          </button>
          <span className="bg-amber-100 border border-amber-300 text-gov-navy text-xs font-black px-3 py-1 rounded-full">
            {tr('Step', 'चरण')} {stepIndex} {tr('of', 'का')} {TOTAL_STEPS}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div className="bg-gov-saffron h-full transition-all duration-300 rounded-full" style={{ width: `${(stepIndex / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-gov-navy">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}

      <div className="mt-5">{children}</div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={onNext} disabled={busy || nextDisabled}
          className="flex-1 h-12 rounded-lg bg-gov-navy hover:bg-[#083d71] disabled:opacity-50 text-white font-extrabold flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {nextLabel || tr('Continue', 'जारी रखें')} {!busy && <ArrowRight className="w-5 h-5" />}
        </button>
        {skippable && (
          <button onClick={onSkip} disabled={busy} className="h-12 px-4 rounded-lg border border-slate-300 text-slate-600 font-bold text-sm">
            {tr('Skip', 'छोड़ें')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OnboardingWizard({ profile, onDone, onProfileUpdated }) {
  const { tr, lang } = useI18n();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Cross-step flags used later (e.g. consent step only shows sensitive-data
  // consent if the user actually provided Aadhaar/PAN/bank details).
  const [providedSensitiveData, setProvidedSensitiveData] = useState(false);
  const [uploadedAnyDocument, setUploadedAnyDocument] = useState(false);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => (step === 1 ? onDone() : setStep((s) => s - 1));

  const runStep = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); next(); }
    catch (err) { setError(err.message || tr('Could not save. Please try again.', 'सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।')); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5efe3]">
      <div className="bg-gov-navy text-white px-5 py-3 flex items-center gap-3 border-b-4 border-gov-saffron">
        <ShieldCheck className="w-6 h-6 text-amber-400" />
        <div>
          <div className="font-black leading-tight">{tr('Set up your profile', 'अपनी प्रोफ़ाइल सेट करें')}</div>
          <div className="text-xs text-slate-200">{tr('One-time setup — reused across every scheme application', 'एक-बार सेटअप — हर योजना आवेदन में पुनः उपयोग होता है')}</div>
        </div>
      </div>

      {step === 1 && (
        <BasicInfoStep profile={profile} tr={tr} lang={lang} stepIndex={1} busy={busy} error={error}
          onBack={back} onNext={(vals) => runStep(async () => { const p = await updateOnboardingProfile(vals); onProfileUpdated?.(p); })} />
      )}
      {step === 2 && (
        <ContactStep profile={profile} tr={tr} stepIndex={2} busy={busy} error={error}
          onBack={back} onNext={(vals) => runStep(async () => { const p = await updateOnboardingProfile(vals); onProfileUpdated?.(p); })} />
      )}
      {step === 3 && (
        <AddressStep tr={tr} stepIndex={3} busy={busy} error={error} onBack={back}
          onNext={(current, permanent) => runStep(async () => {
            await saveAddress('current', current);
            await saveAddress('permanent', permanent);
          })} />
      )}
      {step === 4 && (
        <EligibilityStep profile={profile} tr={tr} stepIndex={4} busy={busy} error={error} onBack={back}
          onNext={(profileVals, eligibilityVals) => runStep(async () => {
            const p = await updateOnboardingProfile(profileVals);
            onProfileUpdated?.(p);
            await saveEligibilityProfile(eligibilityVals);
          })} />
      )}
      {step === 5 && (
        <FamilyStep profile={profile} tr={tr} stepIndex={5} busy={busy} error={error} onBack={back}
          onNext={(vals) => runStep(async () => { const p = await updateOnboardingProfile(vals); onProfileUpdated?.(p); })} />
      )}
      {step === 6 && (
        <EducationStep tr={tr} stepIndex={6} busy={busy} error={error} onBack={back} onNext={() => runStep(async () => {})} />
      )}
      {step === 7 && (
        <EmploymentStep tr={tr} stepIndex={7} busy={busy} error={error} onBack={back}
          onNext={(employmentVals, agricultureVals) => runStep(async () => {
            if (employmentVals) await saveEmployment(employmentVals);
            if (agricultureVals) await saveAgricultureProfile(agricultureVals);
          })} />
      )}
      {step === 8 && (
        <BankStep tr={tr} stepIndex={8} busy={busy} error={error} onBack={back}
          onNext={(provided) => runStep(async () => { if (provided) setProvidedSensitiveData(true); })} />
      )}
      {step === 9 && (
        <IdentityStep tr={tr} stepIndex={9} busy={busy} error={error} onBack={back}
          onNext={(provided) => runStep(async () => { if (provided) setProvidedSensitiveData(true); })} />
      )}
      {step === 10 && (
        <DocumentsStep tr={tr} stepIndex={10} busy={busy} error={error} onBack={back}
          onAnyUpload={() => setUploadedAnyDocument(true)}
          onNext={() => runStep(async () => {})} />
      )}
      {step === 11 && (
        <ConsentStep tr={tr} stepIndex={11} busy={busy} error={error} onBack={back}
          showSensitiveConsent={providedSensitiveData} showDocumentConsent={uploadedAnyDocument}
          onFinish={(decisions) => runStep(async () => { await saveConsents(decisions); onDone(); })} />
      )}
    </div>
  );
}

// ============================================================================
// STEP 1 — Basic Information
// ============================================================================
function BasicInfoStep({ profile, tr, lang, stepIndex, busy, error, onBack, onNext }) {
  const nameParts = (profile?.full_name || '').trim().split(/\s+/);
  const [firstName, setFirstName] = useState(profile?.first_name || nameParts[0] || '');
  const [middleName, setMiddleName] = useState(profile?.middle_name || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''));
  const [lastName, setLastName] = useState(profile?.last_name || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''));
  const [dob, setDob] = useState(profile?.date_of_birth || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [maritalStatus, setMaritalStatus] = useState(profile?.marital_status || '');
  const [spouseName, setSpouseName] = useState(profile?.spouse_name || '');
  const [fathersName, setFathersName] = useState(profile?.fathers_name || '');
  const [mothersName, setMothersName] = useState(profile?.mothers_name || '');
  const [nationality, setNationality] = useState(profile?.nationality || 'Indian');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || lang);

  const [localError, setLocalError] = useState('');
  const preview = [firstName, middleName, lastName].filter(Boolean).join(' ');

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) return setLocalError(tr('First and last name are required.', 'पहला और अंतिम नाम आवश्यक है।'));
    if (!dob) return setLocalError(tr('Date of birth is required.', 'जन्म तिथि आवश्यक है।'));
    if (!isValidPastDate(dob)) return setLocalError(tr('Enter a valid date of birth.', 'मान्य जन्म तिथि दर्ज करें।'));
    if (!gender) return setLocalError(tr('Please select your gender.', 'कृपया अपना लिंग चुनें।'));
    setLocalError('');
    onNext({
      first_name: firstName.trim(), middle_name: middleName.trim() || null, last_name: lastName.trim(),
      date_of_birth: dob, gender, marital_status: maritalStatus || null,
      spouse_name: maritalStatus === 'married' ? (spouseName.trim() || null) : null,
      fathers_name: fathersName.trim() || null, mothers_name: mothersName.trim() || null,
      nationality: nationality.trim() || 'Indian', preferred_language: preferredLanguage,
    });
  };

  return (
    <StepShell title={tr('Basic Information', 'बुनियादी जानकारी')}
      subtitle={tr('This is reused to auto-fill every scheme application.', 'यह हर योजना आवेदन में स्वतः भरने के लिए उपयोग होगी।')}
      stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={tr('First Name', 'पहला नाम')}><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Middle Name', 'बीच का नाम')}><input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Last Name', 'अंतिम नाम')}><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={cls.input} /></Field>
        </div>
        {preview && <p className="text-xs text-slate-500">{tr('Full name', 'पूरा नाम')}: <span className="font-bold text-slate-700">{preview}</span></p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tr('Date of Birth', 'जन्म तिथि')}><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Gender', 'लिंग')}>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={cls.input}>
              <option value="">{tr('Select', 'चुनें')}</option>
              <option value="female">{tr('Female', 'महिला')}</option>
              <option value="male">{tr('Male', 'पुरुष')}</option>
              <option value="other">{tr('Other', 'अन्य')}</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tr("Father's Name", 'पिता का नाम')}><input value={fathersName} onChange={(e) => setFathersName(e.target.value)} className={cls.input} /></Field>
          <Field label={tr("Mother's Name", 'माता का नाम')}><input value={mothersName} onChange={(e) => setMothersName(e.target.value)} className={cls.input} /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tr('Marital Status', 'वैवाहिक स्थिति')}>
            <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={cls.input}>
              <option value="">{tr('Select', 'चुनें')}</option>
              <option value="single">{tr('Single', 'अविवाहित')}</option>
              <option value="married">{tr('Married', 'विवाहित')}</option>
              <option value="widowed">{tr('Widowed', 'विधवा/विधुर')}</option>
              <option value="divorced">{tr('Divorced', 'तलाकशुदा')}</option>
            </select>
          </Field>
          {maritalStatus === 'married' && (
            <Field label={tr("Spouse's Name", 'पति/पत्नी का नाम')}><input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} className={cls.input} /></Field>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tr('Nationality', 'राष्ट्रीयता')}><input value={nationality} onChange={(e) => setNationality(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Preferred Language', 'पसंदीदा भाषा')}>
            <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className={cls.input}>
              <option value="en">English</option><option value="hi">हिंदी</option>
            </select>
          </Field>
        </div>
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 2 — Contact Information
// ============================================================================
function ContactStep({ profile, tr, stepIndex, busy, error, onBack, onNext }) {
  const [domicileState, setDomicileState] = useState(profile?.domicile_state || profile?.state || '');
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!domicileState) return setLocalError(tr('Please select your domicile state.', 'कृपया अपना निवास राज्य चुनें।'));
    setLocalError('');
    onNext({ domicile_state: domicileState });
  };

  return (
    <StepShell title={tr('Contact Information', 'संपर्क जानकारी')}
      subtitle={tr('Your mobile and email were already verified when you signed up.', 'आपका मोबाइल और ईमेल साइन अप के समय पहले ही सत्यापित हो चुका है।')}
      stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tr('Mobile Number', 'मोबाइल नंबर')}><input value={profile?.phone ? `+${profile.phone}` : ''} disabled className={cls.input + ' bg-slate-50 text-slate-500'} /></Field>
          <Field label={tr('Email', 'ईमेल')}><input value={profile?.email || ''} disabled className={cls.input + ' bg-slate-50 text-slate-500'} /></Field>
        </div>
        <Field label={tr('Domicile State', 'निवास राज्य')} hint={tr('The state where you officially reside, for domicile-based scheme eligibility.', 'वह राज्य जहाँ आप आधिकारिक रूप से निवासी हैं।')}>
          <select value={domicileState} onChange={(e) => setDomicileState(e.target.value)} className={cls.input}>
            <option value="">{tr('Select your state', 'अपना राज्य चुनें')}</option>
            {INDIAN_STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </Field>
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 3 — Address
// ============================================================================
function emptyAddress() {
  return { address_line_1: '', address_line_2: '', village: '', locality: '', city: '', district: '', sub_district: '', state: '', pincode: '' };
}

function AddressFields({ tr, value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label={tr('Address Line 1', 'पता पंक्ति 1')}><input value={value.address_line_1} onChange={set('address_line_1')} className={cls.input} /></Field>
      <Field label={tr('Address Line 2', 'पता पंक्ति 2')}><input value={value.address_line_2} onChange={set('address_line_2')} className={cls.input} /></Field>
      <Field label={tr('Village', 'गाँव')}><input value={value.village} onChange={set('village')} className={cls.input} /></Field>
      <Field label={tr('Locality', 'मोहल्ला')}><input value={value.locality} onChange={set('locality')} className={cls.input} /></Field>
      <Field label={tr('City', 'शहर')}><input value={value.city} onChange={set('city')} className={cls.input} /></Field>
      <Field label={tr('District', 'ज़िला')}><input value={value.district} onChange={set('district')} className={cls.input} /></Field>
      <Field label={tr('Sub-district / Tehsil', 'तहसील')}><input value={value.sub_district} onChange={set('sub_district')} className={cls.input} /></Field>
      <Field label={tr('State', 'राज्य')}>
        <select value={value.state} onChange={set('state')} className={cls.input}>
          <option value="">{tr('Select', 'चुनें')}</option>
          {INDIAN_STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </Field>
      <Field label={tr('PIN Code', 'पिन कोड')} error={value.pincode && !isValidPincode(value.pincode) ? tr('Enter a valid 6-digit PIN code', 'मान्य 6-अंकीय पिन कोड दर्ज करें') : null}>
        <input value={value.pincode} onChange={set('pincode')} maxLength={6} inputMode="numeric" className={cls.input} />
      </Field>
    </div>
  );
}

function AddressStep({ tr, stepIndex, busy, error, onBack, onNext }) {
  const [current, setCurrent] = useState(emptyAddress());
  const [sameAsCurrent, setSameAsCurrent] = useState(true);
  const [permanent, setPermanent] = useState(emptyAddress());
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!current.city || !current.state || !current.pincode) return setLocalError(tr('City, state and PIN code are required for your current address.', 'वर्तमान पते के लिए शहर, राज्य और पिन कोड आवश्यक हैं।'));
    if (!isValidPincode(current.pincode)) return setLocalError(tr('Enter a valid 6-digit PIN code.', 'मान्य 6-अंकीय पिन कोड दर्ज करें।'));
    if (!sameAsCurrent && permanent.pincode && !isValidPincode(permanent.pincode)) return setLocalError(tr('Enter a valid PIN code for your permanent address.', 'स्थायी पते के लिए मान्य पिन कोड दर्ज करें।'));
    setLocalError('');
    onNext(
      { ...current, is_primary: true },
      { ...(sameAsCurrent ? current : permanent), is_primary: sameAsCurrent }
    );
  };

  return (
    <StepShell title={tr('Address', 'पता')} stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <h3 className="text-sm font-black text-gov-navy uppercase tracking-wide">{tr('Current Address', 'वर्तमान पता')}</h3>
        <AddressFields tr={tr} value={current} onChange={setCurrent} />

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer pt-2">
          <input type="checkbox" checked={sameAsCurrent} onChange={(e) => setSameAsCurrent(e.target.checked)} />
          {tr('Permanent address is the same as current address', 'स्थायी पता वर्तमान पते के समान है')}
        </label>

        {!sameAsCurrent && (
          <>
            <h3 className="text-sm font-black text-gov-navy uppercase tracking-wide pt-2">{tr('Permanent Address', 'स्थायी पता')}</h3>
            <AddressFields tr={tr} value={permanent} onChange={setPermanent} />
          </>
        )}
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 4 — Social & Eligibility Information
// ============================================================================
function EligibilityStep({ profile, tr, stepIndex, busy, error, onBack, onNext }) {
  const [category, setCategory] = useState(profile?.social_category || '');
  const [casteCommunity, setCasteCommunity] = useState('');
  const [minorityStatus, setMinorityStatus] = useState(null);
  const [hasDisability, setHasDisability] = useState(profile?.disability_status ?? null);
  const [disabilityType, setDisabilityType] = useState('');
  const [disabilityPercentage, setDisabilityPercentage] = useState('');
  const [ruralUrban, setRuralUrban] = useState('');
  const [hasRationCard, setHasRationCard] = useState(null);
  const [rationCardNumber, setRationCardNumber] = useState('');
  const [bplStatus, setBplStatus] = useState(null);
  const [ewsStatus, setEwsStatus] = useState(null);
  const [exServiceman, setExServiceman] = useState(null);
  const [govtEmployee, setGovtEmployee] = useState(null);
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (disabilityPercentage && !isValidPercentage(disabilityPercentage)) {
      return setLocalError(tr('Disability percentage must be between 0 and 100.', 'दिव्यांगता प्रतिशत 0 से 100 के बीच होना चाहिए।'));
    }
    setLocalError('');
    onNext(
      { social_category: category || null, disability_status: hasDisability },
      {
        caste_community: casteCommunity.trim() || null,
        minority_status: minorityStatus,
        disability_type: hasDisability ? (disabilityType.trim() || null) : null,
        disability_percentage: hasDisability && disabilityPercentage ? Number(disabilityPercentage) : null,
        rural_urban: ruralUrban || null,
        ration_card_status: hasRationCard,
        ration_card_number: hasRationCard ? (rationCardNumber.trim() || null) : null,
        bpl_status: bplStatus,
        economically_weaker_section_status: ewsStatus,
        ex_serviceman_status: exServiceman,
        government_employee_status: govtEmployee,
      }
    );
  };

  return (
    <StepShell title={tr('Social & Eligibility Information', 'सामाजिक एवं पात्रता जानकारी')}
      subtitle={tr('Only answer what applies to you — irrelevant questions stay hidden.', 'केवल वही उत्तर दें जो आप पर लागू हो — अप्रासंगिक प्रश्न छिपे रहते हैं।')}
      stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <Field label={tr('Social Category', 'सामाजिक श्रेणी')}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={cls.input}>
            <option value="">{tr('Select', 'चुनें')}</option>
            <option value="general">{tr('General', 'सामान्य')}</option>
            <option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option>
          </select>
        </Field>
        {category && category !== 'general' && (
          <Field label={tr('Caste / Community (optional)', 'जाति / समुदाय (वैकल्पिक)')}>
            <input value={casteCommunity} onChange={(e) => setCasteCommunity(e.target.value)} className={cls.input} />
          </Field>
        )}

        <Field label={tr('Do you belong to a minority community?', 'क्या आप अल्पसंख्यक समुदाय से हैं?')}>
          <YesNo value={minorityStatus} onChange={setMinorityStatus} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>

        <Field label={tr('Do you have a disability?', 'क्या आपको कोई दिव्यांगता है?')}>
          <YesNo value={hasDisability} onChange={setHasDisability} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>
        {hasDisability && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 border-l-2 border-amber-300">
            <Field label={tr('Disability Type', 'दिव्यांगता का प्रकार')}><input value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)} className={cls.input} /></Field>
            <Field label={tr('Disability Percentage', 'दिव्यांगता प्रतिशत')}><input type="number" min="0" max="100" value={disabilityPercentage} onChange={(e) => setDisabilityPercentage(e.target.value)} className={cls.input} /></Field>
          </div>
        )}

        <Field label={tr('Rural or Urban', 'ग्रामीण या शहरी')}>
          <select value={ruralUrban} onChange={(e) => setRuralUrban(e.target.value)} className={cls.input}>
            <option value="">{tr('Select', 'चुनें')}</option>
            <option value="rural">{tr('Rural', 'ग्रामीण')}</option>
            <option value="urban">{tr('Urban', 'शहरी')}</option>
          </select>
        </Field>

        <Field label={tr('Do you have a ration card?', 'क्या आपके पास राशन कार्ड है?')}>
          <YesNo value={hasRationCard} onChange={setHasRationCard} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>
        {hasRationCard && (
          <Field label={tr('Ration Card Number', 'राशन कार्ड संख्या')}>
            <input value={rationCardNumber} onChange={(e) => setRationCardNumber(e.target.value)} className={cls.input} />
          </Field>
        )}

        <Field label={tr('Below Poverty Line (BPL) household?', 'क्या आपका परिवार गरीबी रेखा से नीचे (BPL) है?')}>
          <YesNo value={bplStatus} onChange={setBplStatus} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>
        <Field label={tr('Economically Weaker Section (EWS) certified?', 'क्या आप EWS प्रमाणित हैं?')}>
          <YesNo value={ewsStatus} onChange={setEwsStatus} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>
        <Field label={tr('Are you an ex-serviceman?', 'क्या आप भूतपूर्व सैनिक हैं?')}>
          <YesNo value={exServiceman} onChange={setExServiceman} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>
        <Field label={tr('Are you a government employee?', 'क्या आप सरकारी कर्मचारी हैं?')}>
          <YesNo value={govtEmployee} onChange={setGovtEmployee} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 5 — Family Information
// ============================================================================
function emptyMember() { return { name: '', relationship: '', date_of_birth: '', occupation: '' }; }

function FamilyStep({ profile, tr, stepIndex, busy, error, onBack, onNext }) {
  const [householdIncome, setHouseholdIncome] = useState(profile?.annual_income ?? '');
  const [personalIncome, setPersonalIncome] = useState(profile?.annual_personal_income ?? '');
  const [familySize, setFamilySize] = useState(profile?.family_size ?? '');
  const [dependents, setDependents] = useState(profile?.number_of_dependents ?? '');
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState(emptyMember());
  const [localError, setLocalError] = useState('');
  const [savingMember, setSavingMember] = useState(false);

  useEffect(() => { getFamilyMembers().then(setMembers); }, []);

  const addMember = async () => {
    if (!draft.name.trim()) return;
    setSavingMember(true);
    try {
      const saved = await addFamilyMember({ ...draft, name: draft.name.trim() });
      setMembers((m) => [...m, saved]);
      setDraft(emptyMember());
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSavingMember(false);
    }
  };

  const removeMember = async (id) => {
    await removeFamilyMember(id);
    setMembers((m) => m.filter((x) => x.family_member_id !== id));
  };

  const submit = () => {
    setLocalError('');
    onNext({
      annual_income: householdIncome === '' ? null : Number(householdIncome),
      annual_personal_income: personalIncome === '' ? null : Number(personalIncome),
      family_size: familySize === '' ? null : Number(familySize),
      number_of_dependents: dependents === '' ? null : Number(dependents),
    });
  };

  return (
    <StepShell title={tr('Family Information', 'पारिवारिक जानकारी')} stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tr('Annual Household Income (₹)', 'वार्षिक पारिवारिक आय (₹)')}><input type="number" value={householdIncome} onChange={(e) => setHouseholdIncome(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Annual Personal Income (₹)', 'वार्षिक व्यक्तिगत आय (₹)')}><input type="number" value={personalIncome} onChange={(e) => setPersonalIncome(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Family Size', 'परिवार का आकार')}><input type="number" min="1" value={familySize} onChange={(e) => setFamilySize(e.target.value)} className={cls.input} /></Field>
          <Field label={tr('Number of Dependents', 'आश्रितों की संख्या')}><input type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value)} className={cls.input} /></Field>
        </div>

        <div className={cls.card}>
          <h3 className="text-sm font-black text-gov-navy uppercase tracking-wide mb-3">{tr('Family Members (optional)', 'परिवार के सदस्य (वैकल्पिक)')}</h3>
          {members.map((m) => (
            <div key={m.family_member_id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
              <div className="text-sm"><span className="font-bold">{m.name}</span>{m.relationship && <span className="text-slate-500"> — {m.relationship}</span>}</div>
              <button onClick={() => removeMember(m.family_member_id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <input placeholder={tr('Name', 'नाम')} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={cls.input} />
            <input placeholder={tr('Relationship', 'रिश्ता')} value={draft.relationship} onChange={(e) => setDraft((d) => ({ ...d, relationship: e.target.value }))} className={cls.input} />
            <button onClick={addMember} disabled={savingMember || !draft.name.trim()} className="h-11 rounded-lg border-2 border-gov-navy text-gov-navy font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {tr('Add', 'जोड़ें')}
            </button>
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 6 — Education
// ============================================================================
function EducationStep({ tr, stepIndex, busy, error, onBack, onNext }) {
  const [wantsToAdd, setWantsToAdd] = useState(null);
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState({ education_level: '', institution_name: '', course_name: '', board_or_university: '', passing_year: '', percentage: '' });
  const [localError, setLocalError] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);

  useEffect(() => { getEducation().then(setEntries); }, []);

  const LEVELS = [
    ['school', tr('School (up to 8th)', 'स्कूल (8वीं तक)')], ['10th', tr('10th', '10वीं')], ['12th', tr('12th', '12वीं')],
    ['diploma', tr('Diploma', 'डिप्लोमा')], ['undergraduate', tr('Undergraduate', 'स्नातक')],
    ['postgraduate', tr('Postgraduate', 'स्नातकोत्तर')], ['phd', 'PhD'], ['vocational', tr('Vocational', 'व्यावसायिक')], ['other', tr('Other', 'अन्य')],
  ];

  const addEntry = async () => {
    if (!draft.education_level) return;
    setSavingEntry(true);
    try {
      const saved = await addEducation({
        ...draft,
        passing_year: draft.passing_year ? Number(draft.passing_year) : null,
        percentage: draft.percentage ? Number(draft.percentage) : null,
      });
      setEntries((e) => [...e, saved]);
      setDraft({ education_level: '', institution_name: '', course_name: '', board_or_university: '', passing_year: '', percentage: '' });
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSavingEntry(false);
    }
  };

  const removeEntry = async (id) => { await removeEducation(id); setEntries((e) => e.filter((x) => x.education_id !== id)); };

  return (
    <StepShell title={tr('Education', 'शिक्षा')} stepIndex={stepIndex} onBack={onBack} onNext={onNext} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <Field label={tr('Do you want to add your education details?', 'क्या आप अपनी शैक्षणिक जानकारी जोड़ना चाहते हैं?')} hint={tr('Helps with scholarship and education-support schemes.', 'यह छात्रवृत्ति और शिक्षा सहायता योजनाओं में मदद करता है।')}>
          <YesNo value={wantsToAdd} onChange={setWantsToAdd} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>

        {wantsToAdd && (
          <div className={cls.card}>
            {entries.map((e) => (
              <div key={e.education_id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
                <div className="text-sm"><span className="font-bold">{LEVELS.find(([v]) => v === e.education_level)?.[1] || e.education_level}</span>{e.institution_name && <span className="text-slate-500"> — {e.institution_name}</span>}</div>
                <button onClick={() => removeEntry(e.education_id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <select value={draft.education_level} onChange={(e) => setDraft((d) => ({ ...d, education_level: e.target.value }))} className={cls.input}>
                <option value="">{tr('Education Level', 'शिक्षा स्तर')}</option>
                {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input placeholder={tr('Institution Name', 'संस्थान का नाम')} value={draft.institution_name} onChange={(e) => setDraft((d) => ({ ...d, institution_name: e.target.value }))} className={cls.input} />
              <input placeholder={tr('Course Name', 'पाठ्यक्रम')} value={draft.course_name} onChange={(e) => setDraft((d) => ({ ...d, course_name: e.target.value }))} className={cls.input} />
              <input placeholder={tr('Board / University', 'बोर्ड / विश्वविद्यालय')} value={draft.board_or_university} onChange={(e) => setDraft((d) => ({ ...d, board_or_university: e.target.value }))} className={cls.input} />
              <input type="number" placeholder={tr('Passing Year', 'उत्तीर्ण वर्ष')} value={draft.passing_year} onChange={(e) => setDraft((d) => ({ ...d, passing_year: e.target.value }))} className={cls.input} />
              <input type="number" placeholder={tr('Percentage', 'प्रतिशत')} value={draft.percentage} onChange={(e) => setDraft((d) => ({ ...d, percentage: e.target.value }))} className={cls.input} />
            </div>
            <button onClick={addEntry} disabled={savingEntry || !draft.education_level} className="mt-3 h-11 px-4 rounded-lg border-2 border-gov-navy text-gov-navy font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {tr('Add education entry', 'शिक्षा जोड़ें')}
            </button>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 7 — Occupation / Income (+ conditional Agriculture)
// ============================================================================
function EmploymentStep({ tr, stepIndex, busy, error, onBack, onNext }) {
  const [status, setStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [workLocation, setWorkLocation] = useState('');

  const [landOwnership, setLandOwnership] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('');
  const [landAreaUnit, setLandAreaUnit] = useState('acre');
  const [irrigationStatus, setIrrigationStatus] = useState('');
  const [localError, setLocalError] = useState('');

  const STATUSES = [
    ['student', tr('Student', 'छात्र')], ['employed', tr('Employed', 'नौकरीपेशा')], ['self_employed', tr('Self-employed', 'स्वरोजगार')],
    ['unemployed', tr('Unemployed', 'बेरोजगार')], ['farmer', tr('Farmer', 'किसान')], ['homemaker', tr('Homemaker', 'गृहिणी')],
    ['retired', tr('Retired', 'सेवानिवृत्त')], ['other', tr('Other', 'अन्य')],
  ];

  const submit = () => {
    if (!status) return setLocalError(tr('Please select your current status.', 'कृपया अपनी वर्तमान स्थिति चुनें।'));
    setLocalError('');
    const employmentVals = { employment_status: status };
    if (['employed', 'self_employed', 'farmer'].includes(status)) {
      Object.assign(employmentVals, {
        occupation: occupation.trim() || null,
        employer_name: employerName.trim() || null,
        monthly_income: monthlyIncome ? Number(monthlyIncome) : null,
        business_type: status === 'self_employed' ? (businessType.trim() || null) : null,
        work_location: workLocation.trim() || null,
      });
    }
    const agricultureVals = status === 'farmer' ? {
      farmer_status: true,
      land_ownership_status: landOwnership || null,
      total_land_area: totalLandArea ? Number(totalLandArea) : null,
      land_area_unit: landAreaUnit,
      irrigation_status: irrigationStatus || null,
    } : null;
    onNext(employmentVals, agricultureVals);
  };

  return (
    <StepShell title={tr('Occupation / Income', 'व्यवसाय / आय')} stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError}>
      <div className={cls.section}>
        <Field label={tr('What best describes you?', 'आपका सबसे उपयुक्त विवरण क्या है?')}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={cls.input}>
            <option value="">{tr('Select', 'चुनें')}</option>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>

        {['employed', 'self_employed', 'farmer'].includes(status) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 border-l-2 border-amber-300">
            <Field label={tr('Occupation', 'व्यवसाय')}><input value={occupation} onChange={(e) => setOccupation(e.target.value)} className={cls.input} /></Field>
            {status === 'employed' && <Field label={tr('Employer Name', 'नियोक्ता का नाम')}><input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className={cls.input} /></Field>}
            {status === 'self_employed' && <Field label={tr('Business Type', 'व्यवसाय का प्रकार')}><input value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={cls.input} /></Field>}
            <Field label={tr('Monthly Income (₹)', 'मासिक आय (₹)')}><input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className={cls.input} /></Field>
            <Field label={tr('Work Location', 'कार्य स्थान')}><input value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className={cls.input} /></Field>
          </div>
        )}

        {status === 'farmer' && (
          <div className={cls.card}>
            <h3 className="text-sm font-black text-gov-navy uppercase tracking-wide mb-3">{tr('Agriculture Details', 'कृषि विवरण')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={tr('Land Ownership', 'भूमि स्वामित्व')}>
                <select value={landOwnership} onChange={(e) => setLandOwnership(e.target.value)} className={cls.input}>
                  <option value="">{tr('Select', 'चुनें')}</option>
                  <option value="owned">{tr('Owned', 'स्वयं का')}</option>
                  <option value="leased">{tr('Leased', 'पट्टे पर')}</option>
                  <option value="shared">{tr('Shared', 'साझा')}</option>
                  <option value="landless">{tr('Landless', 'भूमिहीन')}</option>
                </select>
              </Field>
              <Field label={tr('Irrigation Status', 'सिंचाई स्थिति')}>
                <select value={irrigationStatus} onChange={(e) => setIrrigationStatus(e.target.value)} className={cls.input}>
                  <option value="">{tr('Select', 'चुनें')}</option>
                  <option value="irrigated">{tr('Irrigated', 'सिंचित')}</option>
                  <option value="rain_fed">{tr('Rain-fed', 'वर्षा आधारित')}</option>
                  <option value="partially_irrigated">{tr('Partially irrigated', 'आंशिक रूप से सिंचित')}</option>
                </select>
              </Field>
              <Field label={tr('Total Land Area', 'कुल भूमि क्षेत्रफल')}><input type="number" value={totalLandArea} onChange={(e) => setTotalLandArea(e.target.value)} className={cls.input} /></Field>
              <Field label={tr('Unit', 'इकाई')}>
                <select value={landAreaUnit} onChange={(e) => setLandAreaUnit(e.target.value)} className={cls.input}>
                  <option value="acre">{tr('Acre', 'एकड़')}</option>
                  <option value="hectare">{tr('Hectare', 'हेक्टेयर')}</option>
                  <option value="bigha">{tr('Bigha', 'बीघा')}</option>
                </select>
              </Field>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 8 — Bank Details
// ============================================================================
function BankStep({ tr, stepIndex, busy, error, onBack, onNext }) {
  const [wantsToAdd, setWantsToAdd] = useState(null);
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountType, setAccountType] = useState('savings');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    if (!wantsToAdd) return onNext(false);
    if (!accountNumber || accountNumber !== confirmAccountNumber) return setLocalError(tr('Account numbers do not match.', 'खाता संख्या मेल नहीं खाती।'));
    if (!isValidIfsc(ifsc)) return setLocalError(tr('Enter a valid IFSC code (e.g. SBIN0001234).', 'मान्य IFSC कोड दर्ज करें (उदा. SBIN0001234)।'));
    setLocalError('');
    try {
      await addBankAccount({ account_holder_name: holderName, bank_name: bankName, account_number: accountNumber, ifsc, account_type: accountType, is_primary: true });
      onNext(true);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <StepShell title={tr('Bank Details', 'बैंक विवरण')} stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError} skippable onSkip={() => onNext(false)}>
      <div className={cls.section}>
        <Field label={tr('Do you want to save a bank account for auto-fill?', 'क्या आप ऑटो-फिल के लिए बैंक खाता सहेजना चाहते हैं?')}>
          <YesNo value={wantsToAdd} onChange={setWantsToAdd} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>

        {wantsToAdd && (
          <>
            <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              {tr('Your account number is encrypted before storage. Only the last 4 digits are ever shown.', 'आपकी खाता संख्या भंडारण से पहले एन्क्रिप्ट की जाती है। केवल अंतिम 4 अंक ही दिखाए जाते हैं।')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={tr('Account Holder Name', 'खाताधारक का नाम')}><input value={holderName} onChange={(e) => setHolderName(e.target.value)} className={cls.input} /></Field>
              <Field label={tr('Bank Name', 'बैंक का नाम')}><input value={bankName} onChange={(e) => setBankName(e.target.value)} className={cls.input} /></Field>
              <Field label={tr('Account Number', 'खाता संख्या')}><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} className={cls.input} /></Field>
              <Field label={tr('Confirm Account Number', 'खाता संख्या पुष्टि करें')}><input value={confirmAccountNumber} onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))} className={cls.input} /></Field>
              <Field label="IFSC"><input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} className={cls.input} /></Field>
              <Field label={tr('Account Type', 'खाता प्रकार')}>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={cls.input}>
                  <option value="savings">{tr('Savings', 'बचत')}</option>
                  <option value="current">{tr('Current', 'चालू')}</option>
                  <option value="jan_dhan">Jan Dhan</option>
                </select>
              </Field>
            </div>
          </>
        )}
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 9 — Government IDs
// ============================================================================
function IdentityStep({ tr, stepIndex, busy, error, onBack, onNext }) {
  const [wantsToAdd, setWantsToAdd] = useState(null);
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    if (!wantsToAdd) return onNext(false);
    if (aadhaar && !isValidAadhaar(aadhaar)) return setLocalError(tr('Aadhaar number must be 12 digits.', 'आधार संख्या 12 अंकों की होनी चाहिए।'));
    if (pan && !isValidPan(pan)) return setLocalError(tr('Enter a valid PAN (e.g. ABCDE1234F).', 'मान्य पैन दर्ज करें (उदा. ABCDE1234F)।'));
    if (!aadhaar && !pan) return setLocalError(tr('Enter at least one ID, or choose No above.', 'कम से कम एक ID दर्ज करें, या ऊपर नहीं चुनें।'));
    setLocalError('');
    try {
      await saveIdentity({ aadhaar: aadhaar || undefined, pan: pan ? pan.toUpperCase() : undefined });
      onNext(true);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <StepShell title={tr('Government IDs', 'सरकारी पहचान पत्र')} stepIndex={stepIndex} onBack={onBack} onNext={submit} busy={busy} error={error || localError} skippable onSkip={() => onNext(false)}>
      <div className={cls.section}>
        <Field label={tr('Do you want to save your Aadhaar / PAN for auto-fill?', 'क्या आप ऑटो-फिल के लिए आधार / पैन सहेजना चाहते हैं?')}>
          <YesNo value={wantsToAdd} onChange={setWantsToAdd} yesLabel={tr('Yes', 'हाँ')} noLabel={tr('No', 'नहीं')} />
        </Field>

        {wantsToAdd && (
          <>
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              {tr('Stored encrypted. SchemeSetu does not verify these against government databases — official verification happens on the government portal itself.', 'एन्क्रिप्टेड रूप से संग्रहीत। SchemeSetu इन्हें सरकारी डेटाबेस से सत्यापित नहीं करता — आधिकारिक सत्यापन सरकारी पोर्टल पर ही होता है।')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={tr('Aadhaar Number', 'आधार संख्या')}><input value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" className={cls.input} /></Field>
              <Field label="PAN"><input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} className={cls.input} /></Field>
            </div>
          </>
        )}
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 10 — Documents
// ============================================================================
const DOC_TYPES = [
  ['aadhaar', 'Aadhaar Card', 'आधार कार्ड'], ['pan', 'PAN Card', 'पैन कार्ड'],
  ['income_certificate', 'Income Certificate', 'आय प्रमाण पत्र'], ['domicile_certificate', 'Domicile Certificate', 'निवास प्रमाण पत्र'],
  ['caste_certificate', 'Caste Certificate', 'जाति प्रमाण पत्र'], ['bank_passbook', 'Bank Passbook', 'बैंक पासबुक'],
];

function DocumentsStep({ tr, stepIndex, busy, error, onBack, onNext, onAnyUpload }) {
  const [status, setStatus] = useState({});

  useEffect(() => {
    getMyDocuments().then((docs) => {
      const seen = {};
      for (const d of docs) seen[d.document_type] = 'done';
      setStatus(seen);
      if (docs.length) onAnyUpload?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (type, file) => {
    if (!file) return;
    setStatus((s) => ({ ...s, [type]: 'uploading' }));
    try {
      await uploadUserDocument(type, file);
      setStatus((s) => ({ ...s, [type]: 'done' }));
      onAnyUpload?.();
    } catch {
      setStatus((s) => ({ ...s, [type]: 'error' }));
    }
  };

  return (
    <StepShell title={tr('Documents', 'दस्तावेज़')} subtitle={tr('Optional — you can add these later from your profile.', 'वैकल्पिक — आप इन्हें बाद में अपनी प्रोफ़ाइल से जोड़ सकते हैं।')}
      stepIndex={stepIndex} onBack={onBack} onNext={onNext} busy={busy} error={error} skippable onSkip={onNext}>
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
        {DOC_TYPES.map(([type, en, hi]) => {
          const st = status[type];
          return (
            <div key={type} className="flex items-center gap-3 px-3.5 py-3">
              <FileText className="w-5 h-5 text-gov-navy shrink-0" />
              <div className="flex-1 text-sm font-bold text-slate-800">{tr(en, hi)}</div>
              {st === 'done' ? (
                <span className="text-emerald-700 text-sm font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{tr('Saved', 'सहेजा गया')}</span>
              ) : st === 'uploading' ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-1.5 border border-gov-navy text-gov-navy rounded-md py-1.5 px-3 text-xs font-bold">
                  <UploadCloud className="w-3.5 h-3.5" /> {tr('Upload PDF', 'PDF अपलोड')}
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFile(type, e.target.files?.[0])} />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}

// ============================================================================
// STEP 11 — Consent & Privacy
// ============================================================================
function ConsentStep({ tr, stepIndex, busy, error, onBack, onFinish, showSensitiveConsent, showDocumentConsent }) {
  const [consents, setConsents] = useState({
    profile_data_storage: false,
    document_storage: false,
    sensitive_data_processing: false,
    auto_fill: false,
    government_portal_submission: false,
  });
  const [localError, setLocalError] = useState('');

  const toggle = (key) => setConsents((c) => ({ ...c, [key]: !c[key] }));

  const ITEMS = [
    ['profile_data_storage', tr('Store my profile information', 'मेरी प्रोफ़ाइल जानकारी संग्रहीत करें'),
      tr('SchemeSetu will securely store the details you provided (name, address, eligibility, etc.) to show you relevant schemes.', 'SchemeSetu आपके द्वारा दी गई जानकारी को सुरक्षित रूप से संग्रहीत करेगा ताकि आपको प्रासंगिक योजनाएँ दिखाई जा सकें।'), true],
    ...(showDocumentConsent ? [['document_storage', tr('Store my uploaded documents', 'मेरे अपलोड किए गए दस्तावेज़ संग्रहीत करें'),
      tr('The documents you uploaded will be kept in your private, encrypted document vault.', 'आपके द्वारा अपलोड किए गए दस्तावेज़ आपके निजी, एन्क्रिप्टेड वॉल्ट में रखे जाएँगे।'), false]] : []),
    ...(showSensitiveConsent ? [['sensitive_data_processing', tr('Process my Aadhaar / PAN / bank details', 'मेरे आधार / पैन / बैंक विवरण संसाधित करें'),
      tr('These are encrypted and used only to auto-fill forms you explicitly submit — never shared without your action.', 'ये एन्क्रिप्टेड हैं और केवल आपके द्वारा स्पष्ट रूप से जमा किए गए फॉर्म को स्वतः भरने के लिए उपयोग होते हैं।'), false]] : []),
    ['auto_fill', tr('Allow SchemeSetu to auto-fill scheme applications for me', 'SchemeSetu को मेरे लिए योजना आवेदन स्वतः भरने की अनुमति दें'),
      tr('Uses your saved profile to pre-fill forms. You always review and approve before anything is submitted.', 'फॉर्म को पहले से भरने के लिए आपकी सहेजी गई प्रोफ़ाइल का उपयोग होता है। कुछ भी जमा करने से पहले आप हमेशा समीक्षा और अनुमोदन करते हैं।'), false],
    ['government_portal_submission', tr('Allow submission to government portals on my behalf, after my review', 'मेरी समीक्षा के बाद मेरी ओर से सरकारी पोर्टल पर जमा करने की अनुमति दें'),
      tr('SchemeSetu will only submit an application after you have reviewed it and given explicit approval.', 'SchemeSetu केवल आपकी समीक्षा और स्पष्ट अनुमोदन के बाद ही आवेदन जमा करेगा।'), false],
  ];

  const finish = () => {
    if (!consents.profile_data_storage) return setLocalError(tr('Storing your profile is required to use SchemeSetu.', 'SchemeSetu का उपयोग करने के लिए प्रोफ़ाइल संग्रहीत करना आवश्यक है।'));
    setLocalError('');
    const decisions = ITEMS.map(([key]) => ({ type: key, version: CONSENT_VERSION, granted: Boolean(consents[key]) }));
    onFinish(decisions);
  };

  return (
    <StepShell title={tr('Consent & Privacy', 'सहमति एवं गोपनीयता')} stepIndex={stepIndex} onBack={onBack} onNext={finish}
      nextLabel={tr('Finish setup', 'सेटअप पूर्ण करें')} busy={busy} error={error || localError}>
      <div className="space-y-3">
        {ITEMS.map(([key, title, desc, required]) => (
          <label key={key} className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg p-3.5 cursor-pointer">
            <input type="checkbox" checked={Boolean(consents[key])} onChange={() => toggle(key)} className="mt-1" />
            <div>
              <div className="text-sm font-bold text-slate-800">{title}{required && <span className="text-red-500 ml-1">*</span>}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
            </div>
          </label>
        ))}
      </div>
    </StepShell>
  );
}
