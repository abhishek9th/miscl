import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LocationModal from './components/LocationModal';
import HomeScreen from './components/HomeScreen';
import BusinessFlow from './components/BusinessFlow';
import StudentFlow from './components/StudentFlow';
import ChatBot from './components/ChatBot';
import NoSchemesScreen from './components/NoSchemesScreen';
import ResultsScreen from './components/ResultsScreen';
import SchemeDetailScreen from './components/SchemeDetailScreen';
import OfficialSchemesDirectory from './components/OfficialSchemesDirectory';
import EligibilityDashboard from './components/EligibilityDashboard';
import LoginScreen from './components/LoginScreen';
import ProfilePanel from './components/ProfilePanel';
import ProfileDocumentsSetup from './components/ProfileDocumentsSetup';
import { getSession, onAuthChange, getProfile, signOut } from './services/authService';
import { getSignedUrl, registerScheme } from './services/profileService';
import { saveUserLocation } from './services/onboardingService';
import { filterBusinessSchemes, filterSkillSchemes, filterStudentSchemes } from './services/filterService';
import { SCHEMES } from './data/schemes';
import { useI18n } from './i18n';

function readSavedState() {
  try {
    const s = localStorage.getItem('schemesetu_state');
    return s || 'Uttar Pradesh';
  } catch {
    return 'Uttar Pradesh';
  }
}

export default function App() {
  const { tr, isHindi, setLang } = useI18n();

  // Authentication gate — the login/signup page shows first on load, backed by
  // the Supabase session. The saved profile is loaded once signed in.
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [openProfileInEdit, setOpenProfileInEdit] = useState(false);
  // Shown once right after a fresh registration: "Create a profile for future use".
  const [showDocSetup, setShowDocSetup] = useState(false);

  useEffect(() => {
    let active = true;
    getSession().then((s) => {
      if (!active) return;
      setSession(s);
      setAuthChecked(true);
    });
    const unsub = onAuthChange((s) => {
      if (active) setSession(s);
    });
    return () => { active = false; unsub(); };
  }, []);

  // Once signed in, load the saved profile and seed the user's state/context so
  // recommendations and form auto-fill start from what they told us.
  useEffect(() => {
    if (!session) { setUserProfile(null); setPhotoUrl(null); return; }
    let active = true;
    getProfile().then(async (p) => {
      if (!active || !p) return;
      setUserProfile(p);
      if (p.state) {
        setUserState(p.state);
        setUserLocation((prev) => ({ ...prev, state: p.state }));
      }
      if (p.live_photo_url) {
        const url = await getSignedUrl('faces', p.live_photo_url);
        if (active) setPhotoUrl(url);
      }
    });
    return () => { active = false; };
  }, [session]);

  const handleSignOut = async () => {
    await signOut();
    setShowProfile(false);
    setSession(null);
    setCurrentScreen('home');
  };

  // Auth is optional for browsing (home + full schemes directory). It's only
  // required to check personal eligibility, since that needs the user's own
  // saved profile data. requireAuth() runs `action` immediately if already
  // signed in, otherwise it parks `action` and sends the user to the login
  // screen; onAuthed resumes it right after a successful sign-in/registration
  // so the user lands exactly where they were headed, not back at square one.
  const pendingActionRef = useRef(null);
  const requireAuth = (action) => {
    if (session) { action(); return; }
    pendingActionRef.current = action;
    setCurrentScreen('login');
  };

  const handleAuthed = (s, opts) => {
    setSession(s);
    if (opts?.justRegistered) {
      setShowDocSetup(true);
      pendingActionRef.current = null;
      return;
    }
    const resume = pendingActionRef.current;
    pendingActionRef.current = null;
    if (resume) resume();
    else setCurrentScreen('home');
  };

  // App Navigation State
  const [currentScreen, setCurrentScreen] = useState('home'); // home | business_flow | student_flow | results | detail | no_schemes
  // Prompt for location/state once per browser session. The login page may have
  // already handled it (it sets this flag), so we don't ask again after sign-in.
  const [showLocationModal, setShowLocationModal] = useState(() => {
    try { return !sessionStorage.getItem('schemesetu_loc_done'); } catch { return true; }
  });
  const [userLocation, setUserLocation] = useState({ state: readSavedState() });

  // User Selection Context
  const [userState, setUserState] = useState(readSavedState());
  const [userCriteria, setUserCriteria] = useState({});
  const [matchingSchemes, setMatchingSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [noSchemesReason, setNoSchemesReason] = useState(null);

  // Location Modal Handlers
  const handleLocationGranted = (locData) => {
    setUserState(locData.state);
    setUserLocation(locData);
    try {
      localStorage.setItem('schemesetu_state', locData.state);
      sessionStorage.setItem('schemesetu_loc_done', '1');
    } catch {
      /* ignore */
    }
    // Auto-select the language for the detected/selected state.
    if (locData.suggestedLang) {
      setLang(locData.suggestedLang);
    }
    // Persist the granted location to the signed-in user's profile (state +
    // coordinates when the browser provided them) — powers nearby-assistance
    // search later without asking for location again.
    saveUserLocation({ state: locData.state, lat: locData.lat, lon: locData.lon }).catch(() => {});
    setShowLocationModal(false);
  };

  const handleLocationDenied = () => {
    try { sessionStorage.setItem('schemesetu_loc_done', '1'); } catch { /* ignore */ }
    setShowLocationModal(false);
  };

  // Flow Navigation Handlers — checking eligibility needs the user's saved
  // profile data, so these require sign-in; browsing (home, directory) does not.
  const handleSelectFlow = (flowType) => {
    requireAuth(() => {
      if (flowType === 'business') {
        setCurrentScreen('business_flow');
      } else if (flowType === 'student') {
        setCurrentScreen('student_flow');
      } else if (flowType === 'skills') {
        const { pool } = filterSkillSchemes(SCHEMES, { state: userState });
        setMatchingSchemes(pool);
        setCurrentScreen('results');
      }
    });
  };

  const handleBrowseAllSchemes = () => {
    setSelectedScheme(null);
    setCurrentScreen('directory');
  };

  // Flow Completion Handler
  const handleFlowComplete = (foundSchemes, finalCriteria) => {
    setMatchingSchemes(foundSchemes);
    setUserCriteria(finalCriteria);
    setCurrentScreen('results');
  };

  // Zero-Matches Handler
  const handleNoSchemesFound = (reason, failedCriteria) => {
    setNoSchemesReason(reason);
    setUserCriteria(failedCriteria);
    setCurrentScreen('no_schemes');
  };

  // Select Scheme Detail
  const handleSelectScheme = (scheme) => {
    setSelectedScheme(scheme);
    setCurrentScreen('detail');
  };

  // Open a curated scheme by its id (from the proactive eligibility dashboard).
  const handleOpenSchemeById = (schemeId) => {
    const scheme = SCHEMES.find((s) => s.id === schemeId);
    if (scheme) handleSelectScheme(scheme);
  };

  // Restart / Edit Info Handlers
  const handleRestart = () => {
    setUserCriteria({});
    setMatchingSchemes([]);
    setSelectedScheme(null);
    setNoSchemesReason(null);
    setCurrentScreen('home');
  };

  const handleEditInfo = () => {
    if (userCriteria.student_type) {
      setCurrentScreen('student_flow');
    } else {
      setCurrentScreen('business_flow');
    }
  };

  // Apply AI Query intent — also gated: it leads straight into a personalized
  // flow/result set, same as the button-driven flows above.
  const handleApplyAiCriteria = (aiIntent) => {
    requireAuth(() => {
      if (aiIntent.user_type === 'student') {
        setCurrentScreen('student_flow');
      } else if (aiIntent.user_type === 'skill_employment') {
        const { pool } = filterSkillSchemes(SCHEMES, { state: userState });
        setMatchingSchemes(pool);
        setCurrentScreen('results');
      } else {
        setCurrentScreen('business_flow');
      }
    });
  };

  // Voice data is normalized into the same criteria shape used by the buttons/forms.
  const handleVoiceProfileReady = (profile) => {
    requireAuth(() => {
      const category = profile.category || 'business';
      const common = {
        state: profile.state || userState,
        income: profile.annualFamilyIncome ?? '',
        gender: profile.gender || '',
      };
      let result;
      let criteria;
      if (category === 'student') {
        criteria = { ...common, student_type: profile.studentType || '', education_level: profile.educationLevel || '', course_field: profile.course || '', social_category: profile.socialCategory || '', voiceMode: true };
        result = filterStudentSchemes(SCHEMES, criteria);
      } else if (category === 'skill_employment') {
        criteria = { ...common, voiceMode: true };
        result = filterSkillSchemes(SCHEMES, criteria);
      } else {
        criteria = { ...common, field: profile.businessField || '', business_status: profile.businessStatus || '', financial_need: profile.fundingRequirement || '', voiceMode: true };
        result = filterBusinessSchemes(SCHEMES, criteria);
      }
      setUserCriteria(criteria);
      if (result.pool.length) {
        setMatchingSchemes(result.pool);
        setCurrentScreen('results');
      } else {
        setNoSchemesReason(result.lastFilteredFactor || (isHindi ? 'आपकी जानकारी के लिए अभी कोई सत्यापित योजना नहीं मिली।' : 'No verified scheme was found for these details.'));
        setCurrentScreen('no_schemes');
      }
    });
  };

  // Browsing (home + full schemes directory) never requires a session. Login
  // is only reached via requireAuth(), when the user asks for something that
  // needs their own profile data — see requireAuth above.
  if (!authChecked) {
    return <div className="min-h-screen bg-[#f5efe3]" />;
  }
  if (currentScreen === 'login') {
    return <LoginScreen onAuthed={handleAuthed} onBackToHome={() => { pendingActionRef.current = null; setCurrentScreen('home'); }} />;
  }

  // Right after registration: offer to build a document profile for future use.
  if (showDocSetup) {
    return <ProfileDocumentsSetup onDone={() => setShowDocSetup(false)} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-hindi relative">
      {/* Header Bar */}
      <Header
        onGoHome={handleRestart}
        onOpenDirectory={handleBrowseAllSchemes}
        onOpenProfile={() => requireAuth(() => setShowProfile(true))}
        session={session}
        userProfile={userProfile}
        photoUrl={photoUrl}
      />

      {/* Main Content Area */}
      <main className="official-portal flex-1 pb-12">
        {currentScreen === 'home' && (
          <HomeScreen
            userState={userState}
            onSelectFlow={handleSelectFlow}
            onBrowseAllSchemes={handleBrowseAllSchemes}
            onChangeStateClick={() => setShowLocationModal(true)}
            session={session}
            onOpenScheme={handleOpenSchemeById}
            onOpenProfile={() => { setOpenProfileInEdit(true); setShowProfile(true); }}
            onOpenEligibility={() => setCurrentScreen('eligibility')}
          />
        )}

        {currentScreen === 'business_flow' && (
          <BusinessFlow
            userState={userState}
            userProfile={userProfile}
            onComplete={handleFlowComplete}
            onNoSchemesFound={handleNoSchemesFound}
            onBackToHome={() => setCurrentScreen('home')}
            onOpenProfile={() => { setOpenProfileInEdit(true); setShowProfile(true); }}
          />
        )}

        {currentScreen === 'student_flow' && (
          <StudentFlow
            userState={userState}
            userProfile={userProfile}
            onComplete={handleFlowComplete}
            onNoSchemesFound={handleNoSchemesFound}
            onBackToHome={() => setCurrentScreen('home')}
            onOpenProfile={() => { setOpenProfileInEdit(true); setShowProfile(true); }}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            schemes={matchingSchemes}
            userCriteria={userCriteria}
            onSelectScheme={handleSelectScheme}
            onRestart={handleRestart}
          />
        )}

        {currentScreen === 'detail' && selectedScheme && (
          <SchemeDetailScreen
            scheme={selectedScheme}
            userCriteria={userCriteria}
            userLocation={userLocation}
            onBack={() => setCurrentScreen('results')}
            onRegisterScheme={registerScheme}
          />
        )}

        {currentScreen === 'directory' && (
          <OfficialSchemesDirectory onBack={handleRestart} session={session} onOpenScheme={handleOpenSchemeById} />
        )}

        {currentScreen === 'eligibility' && (
          <EligibilityDashboard
            variant="full"
            onBack={handleRestart}
            onOpenScheme={handleOpenSchemeById}
            onOpenProfile={() => { setOpenProfileInEdit(true); setShowProfile(true); }}
          />
        )}

        {currentScreen === 'no_schemes' && (
          <NoSchemesScreen
            lastReason={noSchemesReason}
            userCriteria={userCriteria}
            onEditInfo={handleEditInfo}
            onRestart={handleRestart}
            onSelectScheme={handleSelectScheme}
          />
        )}
      </main>

      {/* Profile slide-over */}
      {showProfile && (
        <ProfilePanel
          profile={userProfile}
          photoUrl={photoUrl}
          startInEdit={openProfileInEdit}
          onClose={() => { setShowProfile(false); setOpenProfileInEdit(false); }}
          onSignOut={handleSignOut}
          onOpenScheme={(scheme) => { setShowProfile(false); handleSelectScheme(scheme); }}
          onProfileUpdated={(updated) => updated && setUserProfile(updated)}
        />
      )}

      {/* Persistent help control */}
      <ChatBot onVoiceProfileReady={handleVoiceProfileReady} />

      {/* Location Permission Modal */}
      {showLocationModal && (
        <LocationModal
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />
      )}

      {/* COMPREHENSIVE OFFICIAL GOVERNMENT FOOTER */}
      <footer className="bg-[#0b2341] text-slate-300 border-t-4 border-gov-saffron no-print">

        {/* Top Footer Section */}
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Column 1: Ministry & Emblem */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏛️</span>
              <div>
                <div className="text-sm font-extrabold text-white">
                  {tr('Government of India', 'भारत सरकार')}
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {tr('Ministry of Social Justice & Empowerment', 'सामाजिक न्याय और अधिकारिता मंत्रालय')}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {tr('Justice for all, opportunities for everyone. Accessible scheme discovery portal.', 'सभी के लिए न्याय, सबके लिए अवसर। भारत सरकार का सुगम योजना मंच।')}
            </p>
          </div>

          {/* Column 2: Important Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider border-l-3 border-gov-saffron pl-2">
              {tr('Important Links', 'महत्वपूर्ण लिंक')}
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold text-slate-400">
              <li><button onClick={handleBrowseAllSchemes} className="hover:text-white transition-colors">{tr('Schemes Directory', 'योजनाओं की सूची')}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Official Portals', 'आधिकारिक पोर्टल')}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Helpdesk', 'सहायता केंद्र')}</button></li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider border-l-3 border-gov-saffron pl-2">
              {tr('Policies', 'नीतियां')}
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold text-slate-400">
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Privacy Policy', 'गोपनीयता नीति')}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Terms of Use', 'उपयोग की शर्तें')}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Disclaimer', 'अस्वीकरण')}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{tr('Sitemap', 'साइट मैप')}</button></li>
            </ul>
          </div>

        </div>

        {/* Bottom Dark Strip */}
        <div className="bg-[#071629] py-3 px-4 text-[11px] text-slate-400 border-t border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              © 2024 SchemeSetu India. {tr('Government of India. All rights reserved.', 'भारत सरकार. सभी अधिकार सुरक्षित।')}
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <button onClick={handleRestart} className="hover:text-white">{tr('Accessibility', 'सुलभता')}</button>
              <span>|</span>
              <button onClick={handleRestart} className="hover:text-white">{tr('Feedback', 'प्रतिक्रिया दें')}</button>
              <span>|</span>
              <span>{tr('Last Updated: August 2024', 'अंतिम अपडेट: अगस्त 2024')}</span>
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}
