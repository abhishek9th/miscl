import React, { useEffect, useState } from 'react';
import {
  Phone, GraduationCap, HeartPulse, IndianRupee, Users, Eye, EyeOff,
  Lock, User, Mail, ArrowLeft, ArrowRight, Loader2, ShieldCheck, AlertCircle,
  ChevronDown, Languages, Check, MapPin,
} from 'lucide-react';
import { INDIAN_STATES } from '../services/locationService';
import { login, sendOtp, verifyOtp, retryOtp, register, forgotCheck, resetPassword } from '../services/authService';
import { warmupOtpWidget, loadOtpWidget, isOtpWidgetConfigured } from '../services/msg91Widget';
import { LANGUAGES } from '../data/translations';
import { useI18n } from '../i18n';
import FaceCapture from './FaceCapture';
import LocationModal from './LocationModal';
import { isValidPincode, isValidPastDate, ageFromDob } from '../utils/validators';

/* ---- Blue theme tokens ---- */
const NAVY = '#0f2d63';
const BLUE = '#1d4ed8';
const BLUE_HOVER = '#1e40af';
const ICON_BG = '#dbeafe';

/* Brand logo — same mark used in the site Header. */
function BrandLogo() {
  const { tr } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 82 70" className="w-11 h-11 shrink-0" aria-hidden="true">
        <circle cx="27" cy="12" r="10" fill="#F97316" />
        <circle cx="11" cy="23" r="8" fill="#FB923C" />
        <path d="M7 52C18 44 24 37 29 28c7 8 13 14 21 17C37 52 25 57 13 62Z" fill="#F97316" />
        <path d="M17 64c14-4 22-16 27-29 5-13 12-22 28-31-9 15-17 30-23 45-5 13-16 19-32 15Z" fill="#15803D" />
        <path d="M30 31c-8 4-14 4-22 1 7-1 13-5 18-11 3 2 5 6 4 10Z" fill="#16A34A" />
      </svg>
      <div className="leading-none">
        <h1 className="text-[22px] font-extrabold tracking-tight">
          <span className="text-[#0B3D71]">Scheme</span><span className="text-[#15803D]">Setu</span>
        </h1>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{tr('Connecting People to Possibilities', 'लोगों को अवसरों से जोड़ना')}</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: GraduationCap, en: 'Education Support', hi: 'शिक्षा सहायता', enD: 'Opportunities for a brighter future', hiD: 'उज्जवल भविष्य के अवसर' },
  { icon: HeartPulse, en: 'Healthcare Benefits', hi: 'स्वास्थ्य लाभ', enD: 'For a healthier, safer you', hiD: 'स्वस्थ और सुरक्षित जीवन के लिए' },
  { icon: IndianRupee, en: 'Financial Assistance', hi: 'वित्तीय सहायता', enD: 'Support at every step', hiD: 'हर कदम पर सहायता' },
  { icon: Users, en: 'Social Welfare', hi: 'सामाजिक कल्याण', enD: 'Building a more inclusive India', hiD: 'एक समावेशी भारत का निर्माण' },
];

const GENDERS = [{ v: 'female', en: 'Female', hi: 'महिला' }, { v: 'male', en: 'Male', hi: 'पुरुष' }, { v: 'other', en: 'Other', hi: 'अन्य' }];
const EDUCATION_LEVELS = [
  { v: 'school', en: 'School (up to 8th)', hi: 'स्कूल (8वीं तक)' }, { v: '10th', en: '10th', hi: '10वीं' }, { v: '12th', en: '12th', hi: '12वीं' },
  { v: 'diploma', en: 'Diploma', hi: 'डिप्लोमा' }, { v: 'undergraduate', en: 'Undergraduate', hi: 'स्नातक' },
  { v: 'postgraduate', en: 'Postgraduate', hi: 'स्नातकोत्तर' }, { v: 'phd', en: 'PhD', hi: 'पीएचडी' },
  { v: 'vocational', en: 'Vocational', hi: 'व्यावसायिक' }, { v: 'other', en: 'Other', hi: 'अन्य' },
];
const SOCIAL = [
  { v: 'general', en: 'General', hi: 'सामान्य' }, { v: 'obc', en: 'OBC', hi: 'ओबीसी' }, { v: 'sc', en: 'SC', hi: 'अनुसूचित जाति' },
  { v: 'st', en: 'ST', hi: 'अनुसूचित जनजाति' }, { v: 'ews', en: 'EWS', hi: 'ईडब्ल्यूएस' }, { v: 'minorities', en: 'Minorities', hi: 'अल्पसंख्यक' },
];

const inputCls =
  'w-full h-[52px] px-4 rounded-lg border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 outline-none transition';

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function PrimaryBtn({ loading, children, withArrow, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{ backgroundColor: BLUE }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
      className="w-4/5 mx-auto h-[54px] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[16px] shadow-sm transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
      {withArrow && !loading && <ArrowRight className="w-5 h-5" />}
    </button>
  );
}

function SecureNote() {
  const { tr } = useI18n();
  return (
    <p className="text-center text-[13px] text-slate-500 flex items-center justify-center gap-1.5">
      <ShieldCheck className="w-4 h-4" style={{ color: BLUE }} /> {tr('Your information is safe and secure with us.', 'आपकी जानकारी हमारे पास सुरक्षित है।')}
    </p>
  );
}

/* ---------------- LANGUAGE MODAL ---------------- */
function LanguageModal({ onClose }) {
  const { lang: currentLang, setLang, tr } = useI18n();
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border-2 border-gov-navy overflow-hidden">
        <div className="bg-gov-navy text-white p-4 flex items-center justify-between border-b-4 border-gov-saffron">
          <div className="flex items-center gap-2">
            <Languages className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold">{tr('Select Language', 'भाषा चुनें')}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-amber-400 text-2xl font-bold px-2 py-1" aria-label="Close">✕</button>
        </div>
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LANGUAGES.map((l) => {
            const isSelected = currentLang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); onClose(); }}
                className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                  isSelected
                    ? 'bg-amber-50 border-gov-saffron text-gov-navy font-extrabold shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-white border-slate-200 hover:border-gov-navy text-slate-800 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{l.label}</span>
                <span className="text-xs text-slate-500 font-normal">{l.name}</span>
                {isSelected && (
                  <span className="mt-1 bg-gov-saffron text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> {tr('Active', 'सक्रिय')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- TOP NAV ---------------- */
function TopNav({ onOpenLang, onBackToHome }) {
  const { tr, lang } = useI18n();
  const activeLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const links = [tr('Schemes', 'योजनाएँ'), tr('About', 'परिचय'), tr('Help', 'सहायता'), tr('Contact', 'संपर्क')];
  return (
    <header className="w-full bg-[#f7fafd] border-b border-slate-200">
      <div className="h-[74px] px-5 sm:px-8 flex items-center justify-between">
        <BrandLogo />
        <nav className="flex items-center gap-6">
          {onBackToHome && (
            <button onClick={onBackToHome} className="flex items-center gap-1.5 text-[15px] font-semibold hover:text-[#1d4ed8]" style={{ color: NAVY }}>
              <ArrowLeft className="w-4 h-4" /> {tr('Continue browsing without logging in', 'बिना लॉगिन किए ब्राउज़ करना जारी रखें')}
            </button>
          )}
          <div className="hidden md:flex items-center gap-6 text-[15px] font-semibold" style={{ color: NAVY }}>
            {links.map((l) => (
              <button key={l} className="hover:text-[#1d4ed8] transition-colors">{l}</button>
            ))}
          </div>
          <button onClick={onOpenLang} className="flex items-center gap-1.5 text-[15px] font-semibold hover:text-[#1d4ed8]" style={{ color: NAVY }}>
            <Languages className="w-4 h-4" /> {activeLang.label} <ChevronDown className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- FOOTER BAR ---------------- */
function FooterBar() {
  const { tr } = useI18n();
  return (
    <footer className="w-full text-white" style={{ backgroundColor: '#103a7e' }}>
      <div className="px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="leading-tight text-[13px] font-bold">
            <div>{tr('Empowered Citizens', 'सशक्त नागरिक')}</div>
            <div>{tr('Stronger India', 'सशक्त भारत')}</div>
          </div>
          <span className="hidden sm:block h-8 w-px bg-white/25" />
          <div className="hidden sm:flex items-center gap-4 text-[13px] text-blue-100/90 font-medium">
            <button className="hover:text-white">{tr('Privacy Policy', 'गोपनीयता नीति')}</button>
            <button className="hover:text-white">{tr('Terms of Use', 'उपयोग की शर्तें')}</button>
            <button className="hover:text-white">{tr('Accessibility', 'सुलभता')}</button>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-[13px] text-blue-100/90">{tr('A more inclusive. Informed. Empowered India.', 'अधिक समावेशी, जागरूक और सशक्त भारत।')}</span>
          <div className="flex h-2 w-16 overflow-hidden rounded-full">
            <span className="flex-1 bg-[#FF9933]" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-[#138808]" />
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  const { tr } = useI18n();
  return (
    <div className="hidden lg:block relative w-[70%] overflow-hidden bg-[#eaf2fc]">
      <img src="/rural_farmer_couple.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(233,241,251,0.97) 0%, rgba(238,244,252,0.92) 40%, rgba(238,244,252,0.55) 66%, rgba(238,244,252,0.12) 100%)' }} />
      <div className="relative z-10 h-full flex flex-col px-10 xl:px-14 py-9">
        <div>
          <p className="text-[13px] font-bold tracking-[0.18em] text-slate-500">
            {tr('PEOPLE', 'लोग')}&nbsp;&nbsp;|&nbsp;&nbsp;{tr('POLICIES', 'नीतियाँ')}&nbsp;&nbsp;|&nbsp;&nbsp;{tr('PROGRESS', 'प्रगति')}&nbsp;&nbsp;&nbsp;{tr('TOGETHER', 'साथ')}
          </p>
          <div className="w-14 h-[3px] mt-2 rounded-full" style={{ backgroundColor: BLUE }} />
        </div>

        <div className="mt-8 max-w-lg">
          <h2 className="text-[46px] xl:text-[54px] leading-[1.06] font-extrabold" style={{ color: NAVY }}>
            {tr('Government schemes for a brighter tomorrow', 'उज्जवल कल के लिए सरकारी योजनाएँ')}
          </h2>
          <p className="mt-5 text-[18px] text-slate-600 max-w-md leading-relaxed">
            {tr('A single platform to discover, apply and track government schemes — tailored for you.', 'सरकारी योजनाओं को खोजने, आवेदन करने और ट्रैक करने का एक ही मंच — आपके लिए अनुकूलित।')}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {FEATURES.map(({ icon: Icon, en, hi, enD, hiD }) => (
            <div key={en} className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_BG }}>
                <Icon className="w-5 h-5" style={{ color: BLUE }} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[15.5px] font-bold" style={{ color: NAVY }}>{tr(en, hi)}</div>
                <div className="text-[13px] text-slate-500">{tr(enD, hiD)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div>
          <div className="w-full max-w-sm h-px bg-slate-300/70 mb-4" />
          <p className="text-[22px] font-semibold italic" style={{ color: NAVY }}>&ldquo;Sarkari Yojanaen, Har Haath Tak&rdquo;</p>
          <div className="w-24 h-[3px] mt-2 rounded-full" style={{ backgroundColor: BLUE }} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- SCREEN ---------------- */
export default function LoginScreen({ onAuthed, onBackToHome }) {
  const { setLang } = useI18n();
  const [view, setView] = useState('login'); // login | register | forgot
  const [showLang, setShowLang] = useState(false);

  // Ask for location/state on the login page itself (once per browser session).
  const [showLocation, setShowLocation] = useState(() => {
    try { return !sessionStorage.getItem('schemesetu_loc_done'); } catch { return true; }
  });

  useEffect(() => { warmupOtpWidget(); }, []);

  const handleLocationGranted = (locData) => {
    try {
      if (locData?.state) localStorage.setItem('schemesetu_state', locData.state);
      sessionStorage.setItem('schemesetu_loc_done', '1');
    } catch { /* ignore */ }
    if (locData?.suggestedLang) setLang(locData.suggestedLang);
    setShowLocation(false);
  };
  const handleLocationDenied = () => {
    try { sessionStorage.setItem('schemesetu_loc_done', '1'); } catch { /* ignore */ }
    setShowLocation(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white font-sans">
      <TopNav onOpenLang={() => setShowLang(true)} onBackToHome={onBackToHome} />
      <div className="flex-1 flex min-h-0">
        <Hero />
        <div className="w-full lg:w-[30%] bg-white flex items-center justify-center px-6 sm:px-8 py-10 overflow-y-auto">
          <div className="w-full max-w-[440px]">
            {view === 'login' && (
              <LoginView onAuthed={onAuthed} onRegister={() => setView('register')} onForgot={() => setView('forgot')} />
            )}
            {view === 'register' && (
              <RegisterView onAuthed={onAuthed} onBackToLogin={() => setView('login')} />
            )}
            {view === 'forgot' && (
              <ForgotView onAuthed={onAuthed} onBackToLogin={() => setView('login')} />
            )}
          </div>
        </div>
      </div>
      <FooterBar />

      {showLang && <LanguageModal onClose={() => setShowLang(false)} />}
      {showLocation && (
        <LocationModal onLocationGranted={handleLocationGranted} onLocationDenied={handleLocationDenied} />
      )}
    </div>
  );
}

/* ---------------- LOGIN VIEW (email + password) ---------------- */
function LoginView({ onAuthed, onRegister, onForgot }) {
  const { tr } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(email, password);
      onAuthed?.(session);
    } catch (err) {
      setError(err.message || tr('Login failed. Please try again.', 'लॉगिन विफल रहा। कृपया पुनः प्रयास करें।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-7">
        <h3 className="text-[38px] font-extrabold tracking-tight leading-none" style={{ color: NAVY }}>{tr('Welcome back', 'पुनः स्वागत है')}</h3>
        <p className="mt-2 text-slate-500 text-[15px]">{tr('Sign in to access your personalized dashboard.', 'अपने व्यक्तिगत डैशबोर्ड तक पहुँचने के लिए साइन इन करें।')}</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Email or Mobile Number', 'ईमेल या मोबाइल नंबर')}</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input type="text" autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr('Email address or 10-digit mobile', 'ईमेल पता या 10-अंकीय मोबाइल')} className={inputCls + ' pl-11'} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Password', 'पासवर्ड')}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tr('Enter your password', 'अपना पासवर्ड दर्ज करें')} className={inputCls + ' pl-11 pr-11'} />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Signing in…', 'साइन इन हो रहा है…') : tr('Login', 'लॉगिन')}</PrimaryBtn>

        <div className="text-center">
          <button type="button" onClick={onForgot} className="text-sm font-semibold hover:underline" style={{ color: BLUE }}>
            {tr('Forgot Password?', 'पासवर्ड भूल गए?')}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-[15px] text-slate-600">
        {tr('New here?', 'नए हैं?')}{' '}
        <button type="button" onClick={onRegister} className="font-bold hover:underline" style={{ color: BLUE }}>
          {tr('Create an account', 'खाता बनाएँ')}
        </button>
      </p>
      <div className="mt-5"><SecureNote /></div>
    </>
  );
}

/* ---------------- STEP HEADER ---------------- */
function StepHeader({ stepIndex, total = 3, onBack }) {
  const { tr } = useI18n();
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-semibold hover:underline" style={{ color: BLUE }}>
          <ArrowLeft className="w-4 h-4" /> {tr('Back', 'वापस')}
        </button>
        <span className="text-sm font-semibold text-slate-500">{tr('Step', 'चरण')} {stepIndex + 1} {tr('of', 'का')} {total}</span>
      </div>
      <div className="flex gap-1.5 mb-7">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= stepIndex ? BLUE : '#dbe3ee' }} />
        ))}
      </div>
    </>
  );
}

/* ---------------- FORGOT PASSWORD VIEW ---------------- */
function ForgotView({ onAuthed, onBackToLogin }) {
  const { tr } = useI18n();
  const [step, setStep] = useState('mobile'); // mobile | otp | reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (isOtpWidgetConfigured) loadOtpWidget().catch(() => {}); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (fn) => async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try { await fn(); }
    catch (err) { setError(err.message || tr('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।')); }
    finally { setLoading(false); }
  };

  const doSendOtp = go(async () => {
    if (!/^\d{10}$/.test(mobile.trim())) throw new Error(tr('Please enter a valid 10-digit mobile number', 'कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें'));
    await forgotCheck(mobile.trim());
    await sendOtp(mobile.trim());
    setStep('otp');
    setCooldown(30);
  });

  const doResend = go(async () => { await retryOtp(null); setCooldown(30); });

  const doVerifyOtp = go(async () => {
    if (otp.trim().length < 4) throw new Error(tr('Please enter the OTP you received', 'कृपया प्राप्त ओटीपी दर्ज करें'));
    const { verificationToken: token } = await verifyOtp(mobile.trim(), otp.trim());
    setVerificationToken(token);
    setStep('reset');
  });

  const doReset = go(async () => {
    if (password.length < 6) throw new Error(tr('Password must be at least 6 characters', 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'));
    if (password !== confirm) throw new Error(tr('Passwords do not match', 'पासवर्ड मेल नहीं खाते'));
    const session = await resetPassword({ mobile: mobile.trim(), verificationToken, newPassword: password });
    onAuthed?.(session);
  });

  const steps = ['mobile', 'otp', 'reset'];
  const stepIndex = steps.indexOf(step);
  const onBack = () => (stepIndex === 0 ? onBackToLogin() : setStep(steps[stepIndex - 1]));

  const titles = {
    mobile: [tr('Reset your password', 'अपना पासवर्ड रीसेट करें'), tr('Enter your registered mobile number to receive an OTP', 'ओटीपी प्राप्त करने के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें')],
    otp: [tr('Verify your mobile', 'अपना मोबाइल सत्यापित करें'), `${tr('Enter the code sent to', 'इस नंबर पर भेजा गया कोड दर्ज करें')} +91 ${mobile}`],
    reset: [tr('Set a new password', 'नया पासवर्ड सेट करें'), tr('Choose a new password for your account', 'अपने खाते के लिए एक नया पासवर्ड चुनें')],
  };

  return (
    <>
      <StepHeader stepIndex={stepIndex} total={3} onBack={onBack} />
      <div className="mb-6">
        <h3 className="text-[32px] font-extrabold tracking-tight leading-tight" style={{ color: NAVY }}>{titles[step][0]}</h3>
        <p className="mt-1.5 text-slate-500 text-[15px]">{titles[step][1]}</p>
      </div>

      <ErrorBanner message={error} />
      <div className="mt-4 space-y-4">
        {step === 'mobile' && (
          <form onSubmit={doSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Registered Mobile Number', 'पंजीकृत मोबाइल नंबर')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={tr('Enter your mobile number', 'अपना मोबाइल नंबर दर्ज करें')} className={inputCls + ' pl-11'} />
              </div>
            </div>
            <div id="msg91-captcha" />
            <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Sending OTP…', 'ओटीपी भेजा जा रहा है…') : tr('Send OTP', 'ओटीपी भेजें')}</PrimaryBtn>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={doVerifyOtp} className="space-y-4">
            <input type="text" inputMode="numeric" maxLength={4} value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" className={inputCls + ' tracking-[0.5em] text-center text-lg'} />
            <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Verifying…', 'सत्यापित हो रहा है…') : tr('Verify & Continue', 'सत्यापित करें और आगे बढ़ें')}</PrimaryBtn>
            <div className="text-center text-sm">
              {cooldown > 0
                ? <span className="text-slate-400">{tr('Resend OTP in', 'ओटीपी पुनः भेजें')} {cooldown}s</span>
                : <button type="button" onClick={doResend} className="font-semibold hover:underline" style={{ color: BLUE }}>{tr('Resend OTP', 'ओटीपी पुनः भेजें')}</button>}
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={doReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('New Password', 'नया पासवर्ड')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={tr('Create a password (min. 6 characters)', 'पासवर्ड बनाएँ (कम से कम 6 अक्षर)')} className={inputCls + ' pl-11 pr-11'} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Confirm New Password', 'नया पासवर्ड पुष्टि करें')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder={tr('Re-enter your new password', 'अपना नया पासवर्ड पुनः दर्ज करें')} className={inputCls + ' pl-11'} />
              </div>
            </div>
            <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Updating…', 'अपडेट हो रहा है…') : tr('Update Password', 'पासवर्ड अपडेट करें')}</PrimaryBtn>
            <SecureNote />
          </form>
        )}
      </div>
    </>
  );
}

/* ---------------- REGISTER (OTP) VIEW ---------------- */
function RegisterView({ onAuthed, onBackToLogin }) {
  const { tr } = useI18n();
  const [step, setStep] = useState('mobile'); // mobile | otp | details | photo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Registration collects these so they can be reused everywhere later (the
  // scheme-search flow reads them from the profile instead of re-asking).
  const [profile, setProfile] = useState(() => {
    let state = '';
    try { state = localStorage.getItem('schemesetu_state') || ''; } catch { /* ignore */ }
    return {
      state, gender: '', social_category: '',
      date_of_birth: '', age: '', spouse_name: '', address: '', pincode: '', education_level: '',
    };
  });
  const AGE_OPTIONS = Array.from({ length: 121 }, (_, i) => i); // 0..120 — wide enough to always match the DOB-computed age
  const [facePhoto, setFacePhoto] = useState('');

  useEffect(() => { if (isOtpWidgetConfigured) loadOtpWidget().catch(() => {}); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (fn) => async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try { await fn(); }
    catch (err) { setError(err.message || tr('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।')); }
    finally { setLoading(false); }
  };

  const doSendOtp = go(async () => {
    if (!/^\d{10}$/.test(mobile.trim())) throw new Error(tr('Please enter a valid 10-digit mobile number', 'कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें'));
    await sendOtp(mobile.trim());
    setStep('otp');
    setCooldown(30);
  });

  const doResend = go(async () => { await retryOtp(null); setCooldown(30); });

  const doVerifyOtp = go(async () => {
    if (otp.trim().length < 4) throw new Error(tr('Please enter the OTP you received', 'कृपया प्राप्त ओटीपी दर्ज करें'));
    const { verificationToken: token } = await verifyOtp(mobile.trim(), otp.trim());
    setVerificationToken(token);
    setStep('details');
  });

  const doDetails = go(async () => {
    if (!fullName.trim()) throw new Error(tr('Please enter your full name', 'कृपया अपना पूरा नाम दर्ज करें'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error(tr('Please enter a valid email address', 'कृपया एक मान्य ईमेल पता दर्ज करें'));
    if (password.length < 6) throw new Error(tr('Password must be at least 6 characters', 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'));
    if (password !== confirm) throw new Error(tr('Passwords do not match', 'पासवर्ड मेल नहीं खाते'));
    setStep('photo');
  });

  const doComplete = go(async () => {
    if (!facePhoto) throw new Error(tr('Please capture your live photo to continue', 'आगे बढ़ने के लिए कृपया अपनी लाइव फ़ोटो कैप्चर करें'));
    if (profile.date_of_birth && !isValidPastDate(profile.date_of_birth)) throw new Error(tr('Please enter a valid date of birth', 'कृपया मान्य जन्म तिथि दर्ज करें'));
    if (profile.pincode && !isValidPincode(profile.pincode)) throw new Error(tr('PIN code must be 6 digits', 'पिन कोड 6 अंकों का होना चाहिए'));
    const session = await register({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      verificationToken,
      photoBase64: facePhoto,
      profile: {
        state: profile.state || null,
        gender: profile.gender || null,
        social_category: profile.social_category || null,
        date_of_birth: profile.date_of_birth || null,
        age: profile.age || null,
        spouse_name: profile.spouse_name?.trim() || null,
        address: profile.address?.trim() || null,
        pincode: profile.pincode || null,
        education_level: profile.education_level || null,
      },
    });
    // Fresh registration → App shows the "create a profile for future use" page.
    onAuthed?.(session, { justRegistered: true });
  });

  const steps = ['mobile', 'otp', 'details', 'photo'];
  const stepIndex = steps.indexOf(step);
  const onBack = () => (stepIndex === 0 ? onBackToLogin() : setStep(steps[stepIndex - 1]));

  const titles = {
    mobile: [tr('Create your account', 'अपना खाता बनाएँ'), tr('We’ll send a one-time OTP to verify your number', 'आपके नंबर को सत्यापित करने के लिए हम एक ओटीपी भेजेंगे')],
    otp: [tr('Verify your mobile', 'अपना मोबाइल सत्यापित करें'), `${tr('Enter the code sent to', 'इस नंबर पर भेजा गया कोड दर्ज करें')} +91 ${mobile}`],
    details: [tr('Set up your account', 'अपना खाता सेट करें'), tr('Create a secure account to access your personalized dashboard.', 'अपने व्यक्तिगत डैशबोर्ड तक पहुँचने के लिए एक सुरक्षित खाता बनाएँ।')],
    photo: [tr('Add your photo & details', 'अपनी फ़ोटो और विवरण जोड़ें'), tr('A live photo is required; other details are optional.', 'एक लाइव फ़ोटो आवश्यक है; अन्य विवरण वैकल्पिक हैं।')],
  };

  return (
    <>
      <StepHeader stepIndex={stepIndex} total={4} onBack={onBack} />

      <div className="mb-6">
        <h3 className="text-[32px] font-extrabold tracking-tight leading-tight" style={{ color: NAVY }}>{titles[step][0]}</h3>
        <p className="mt-1.5 text-slate-500 text-[15px]">{titles[step][1]}</p>
      </div>

      <ErrorBanner message={error} />
      <div className="mt-4 space-y-4">
        {step === 'mobile' && (
          <form onSubmit={doSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Mobile Number', 'मोबाइल नंबर')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={tr('Enter your mobile number', 'अपना मोबाइल नंबर दर्ज करें')} className={inputCls + ' pl-11'} />
              </div>
            </div>
            <div id="msg91-captcha" />
            <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Sending OTP…', 'ओटीपी भेजा जा रहा है…') : tr('Send OTP', 'ओटीपी भेजें')}</PrimaryBtn>
            <SecureNote />
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={doVerifyOtp} className="space-y-4">
            <input type="text" inputMode="numeric" maxLength={4} value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" className={inputCls + ' tracking-[0.5em] text-center text-lg'} />
            <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Verifying…', 'सत्यापित हो रहा है…') : tr('Verify & Continue', 'सत्यापित करें और आगे बढ़ें')}</PrimaryBtn>
            <div className="text-center text-sm">
              {cooldown > 0
                ? <span className="text-slate-400">{tr('Resend OTP in', 'ओटीपी पुनः भेजें')} {cooldown}s</span>
                : <button type="button" onClick={doResend} className="font-semibold hover:underline" style={{ color: BLUE }}>{tr('Resend OTP', 'ओटीपी पुनः भेजें')}</button>}
            </div>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={doDetails} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Full Name', 'पूरा नाम')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder={tr('Enter your full name', 'अपना पूरा नाम दर्ज करें')} className={inputCls + ' pl-11'} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Email Address', 'ईमेल पता')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className={inputCls + ' pl-11'} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Password', 'पासवर्ड')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={tr('Create a password (min. 6 characters)', 'पासवर्ड बनाएँ (कम से कम 6 अक्षर)')} className={inputCls + ' pl-11 pr-11'} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Confirm Password', 'पासवर्ड पुष्टि करें')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder={tr('Re-enter your password', 'अपना पासवर्ड पुनः दर्ज करें')} className={inputCls + ' pl-11'} />
              </div>
            </div>
            <PrimaryBtn type="submit" loading={loading} withArrow>{tr('Continue', 'आगे बढ़ें')}</PrimaryBtn>
            <SecureNote />
          </form>
        )}

        {step === 'photo' && (
          <form onSubmit={doComplete} className="space-y-4">
            <FaceCapture onCapture={(_blob, dataUrl) => setFacePhoto(dataUrl || '')} />
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('State', 'राज्य')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
              <select value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))} className={inputCls}>
                <option value="">{tr('Select your state', 'अपना राज्य चुनें')}</option>
                {INDIAN_STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Gender', 'लिंग')}</label>
                <select value={profile.gender} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))} className={inputCls}>
                  <option value="">{tr('Select', 'चुनें')}</option>
                  {GENDERS.map((g) => <option key={g.v} value={g.v}>{tr(g.en, g.hi)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Category', 'श्रेणी')}</label>
                <select value={profile.social_category} onChange={(e) => setProfile((p) => ({ ...p, social_category: e.target.value }))} className={inputCls}>
                  <option value="">{tr('Select', 'चुनें')}</option>
                  {SOCIAL.map((s) => <option key={s.v} value={s.v}>{tr(s.en, s.hi)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Date of Birth', 'जन्म तिथि')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
                <input type="date" value={profile.date_of_birth}
                  onChange={(e) => setProfile((p) => ({ ...p, date_of_birth: e.target.value, age: ageFromDob(e.target.value) }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Age', 'आयु')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
                <select value={profile.age} onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))} className={inputCls}>
                  <option value="">{tr('Select', 'चुनें')}</option>
                  {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr("Spouse's Name", 'पति/पत्नी का नाम')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
              <input type="text" value={profile.spouse_name} onChange={(e) => setProfile((p) => ({ ...p, spouse_name: e.target.value }))}
                placeholder={tr("Spouse's full name", 'पति/पत्नी का पूरा नाम')} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Address', 'पता')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
              <input type="text" value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder={tr('House no., street, locality', 'मकान नंबर, गली, मोहल्ला')} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('PIN Code', 'पिन कोड')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
                <input type="text" inputMode="numeric" maxLength={6} value={profile.pincode}
                  onChange={(e) => setProfile((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                  placeholder={tr('6-digit PIN code', '6-अंकीय पिन कोड')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{tr('Qualification', 'शैक्षणिक योग्यता')} <span className="text-slate-400 font-normal">({tr('optional', 'वैकल्पिक')})</span></label>
                <select value={profile.education_level} onChange={(e) => setProfile((p) => ({ ...p, education_level: e.target.value }))} className={inputCls}>
                  <option value="">{tr('Select', 'चुनें')}</option>
                  {EDUCATION_LEVELS.map((e) => <option key={e.v} value={e.v}>{tr(e.en, e.hi)}</option>)}
                </select>
              </div>
            </div>

            <ErrorBanner message={error} />
            <PrimaryBtn type="submit" loading={loading} withArrow>{loading ? tr('Creating account…', 'खाता बनाया जा रहा है…') : tr('Create Account', 'खाता बनाएँ')}</PrimaryBtn>
            <SecureNote />
          </form>
        )}
      </div>
    </>
  );
}
