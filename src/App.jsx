import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import Header from './components/Header';
import LocationModal from './components/LocationModal';
import HomeScreen from './components/HomeScreen';
import BusinessFlow from './components/BusinessFlow';
import StudentFlow from './components/StudentFlow';
import AiAssistantModal from './components/AiAssistantModal';
import NoSchemesScreen from './components/NoSchemesScreen';
import ResultsScreen from './components/ResultsScreen';
import SchemeDetailScreen from './components/SchemeDetailScreen';
import OfficialSchemesDirectory from './components/OfficialSchemesDirectory';
import { filterBusinessSchemes, filterSkillSchemes, filterStudentSchemes } from './services/filterService';
import { SCHEMES } from './data/schemes';
import { getTranslation } from './data/translations';

export default function App() {
  // App Navigation State
  const [currentScreen, setCurrentScreen] = useState('home'); // home | business_flow | student_flow | results | detail | no_schemes
  const [currentLang, setCurrentLang] = useState('hi');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // User Selection Context
  const [userState, setUserState] = useState('Uttar Pradesh');
  const [userCriteria, setUserCriteria] = useState({});
  const [matchingSchemes, setMatchingSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [noSchemesReason, setNoSchemesReason] = useState(null);

  const t = (key) => getTranslation(currentLang, key);
  const isHindi = currentLang === 'hi';

  // Location Modal Handlers
  const handleLocationGranted = (locData) => {
    setUserState(locData.state);
    if (locData.suggestedLang) {
      setCurrentLang(locData.suggestedLang);
    }
    setShowLocationModal(false);
  };

  const handleLocationDenied = () => {
    setShowLocationModal(false);
  };

  // Flow Navigation Handlers
  const handleSelectFlow = (flowType) => {
    if (flowType === 'business') {
      setCurrentScreen('business_flow');
    } else if (flowType === 'student') {
      setCurrentScreen('student_flow');
    } else if (flowType === 'skills') {
      const { pool } = filterSkillSchemes(SCHEMES, { state: userState });
      setMatchingSchemes(pool);
      setCurrentScreen('results');
    }
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

  // Apply AI Query intent
  const handleApplyAiCriteria = (aiIntent) => {
    if (aiIntent.user_type === 'student') {
      setCurrentScreen('student_flow');
    } else if (aiIntent.user_type === 'skill_employment') {
      const { pool } = filterSkillSchemes(SCHEMES, { state: userState });
      setMatchingSchemes(pool);
      setCurrentScreen('results');
    } else {
      setCurrentScreen('business_flow');
    }
  };

  // Voice data is normalized into the same criteria shape used by the buttons/forms.
  const handleVoiceProfileReady = (profile) => {
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
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-hindi relative">
      {/* Header Bar */}
      <Header
        currentLang={currentLang}
        onLanguageChange={(newLang) => setCurrentLang(newLang)}
        onGoHome={handleRestart}
        onOpenDirectory={handleBrowseAllSchemes}
      />

      {/* Main Content Area */}
      <main className="official-portal flex-1 pb-12">
        {currentScreen === 'home' && (
          <HomeScreen
            currentLang={currentLang}
            userState={userState}
            onSelectFlow={handleSelectFlow}
            onBrowseAllSchemes={handleBrowseAllSchemes}
            onChangeStateClick={() => setShowLocationModal(true)}
          />
        )}

        {currentScreen === 'business_flow' && (
          <BusinessFlow
            userState={userState}
            onComplete={handleFlowComplete}
            onNoSchemesFound={handleNoSchemesFound}
            onBackToHome={() => setCurrentScreen('home')}
            currentLang={currentLang}
          />
        )}

        {currentScreen === 'student_flow' && (
          <StudentFlow
            userState={userState}
            onComplete={handleFlowComplete}
            onNoSchemesFound={handleNoSchemesFound}
            onBackToHome={() => setCurrentScreen('home')}
            currentLang={currentLang}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            schemes={matchingSchemes}
            userCriteria={userCriteria}
            onSelectScheme={handleSelectScheme}
            onRestart={handleRestart}
            currentLang={currentLang}
          />
        )}

        {currentScreen === 'detail' && selectedScheme && (
          <SchemeDetailScreen
            scheme={selectedScheme}
            userCriteria={userCriteria}
            onBack={() => setCurrentScreen('results')}
            currentLang={currentLang}
          />
        )}

        {currentScreen === 'directory' && (
          <OfficialSchemesDirectory currentLang={currentLang} onBack={handleRestart} />
        )}

        {currentScreen === 'no_schemes' && (
          <NoSchemesScreen
            lastReason={noSchemesReason}
            userCriteria={userCriteria}
            onEditInfo={handleEditInfo}
            onRestart={handleRestart}
            onSelectScheme={handleSelectScheme}
            currentLang={currentLang}
          />
        )}
      </main>

      {/* Persistent help control */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button
          onClick={() => setShowAiModal(true)}
          className="group relative w-[58px] h-[58px] rounded-full bg-gov-navy hover:bg-gov-navydark text-white border-2 border-gov-saffron flex items-center justify-center transition-colors shadow-lg"
          aria-label="Open SchemeSetu voice assistant"
          title={t('card_ai_title')}
        >
          <Bot className="w-7 h-7" aria-hidden="true" />
        </button>
      </div>

      {/* Location Permission Modal */}
      {showLocationModal && (
        <LocationModal
          currentLang={currentLang}
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />
      )}

      {/* AI Assistant Modal */}
      {showAiModal && (
        <AiAssistantModal
          currentLang={currentLang}
          onClose={() => setShowAiModal(false)}
          onVoiceProfileReady={handleVoiceProfileReady}
        />
      )}

      {/* COMPREHENSIVE OFFICIAL GOVERNMENT FOOTER (Matching Screenshot) */}
      <footer className="bg-[#0b2341] text-slate-300 border-t-4 border-gov-saffron no-print">
        
        {/* Top Footer Section */}
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Ministry & Emblem */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏛️</span>
              <div>
                <div className="text-sm font-extrabold text-white">
                  {isHindi ? "भारत सरकार" : "Government of India"}
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {isHindi ? "सामाजिक न्याय और अधिकारिता मंत्रालय" : "Ministry of Social Justice & Empowerment"}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {isHindi 
                ? "सभी के लिए न्याय, सबके लिए अवसर। भारत सरकार का सुगम योजना मंच।" 
                : "Justice for all, opportunities for everyone. Accessible scheme discovery portal."}
            </p>
          </div>

          {/* Column 2: Important Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider border-l-3 border-gov-saffron pl-2">
              {isHindi ? "महत्वपूर्ण लिंक" : "Important Links"}
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold text-slate-400">
              <li><button onClick={handleBrowseAllSchemes} className="hover:text-white transition-colors">{isHindi ? "योजनाओं की सूची" : "Schemes Directory"}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "आधिकारिक पोर्टल" : "Official Portals"}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "सहायता केंद्र" : "Helpdesk"}</button></li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider border-l-3 border-gov-saffron pl-2">
              {isHindi ? "नीतियां" : "Policies"}
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold text-slate-400">
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "गोपनीयता नीति" : "Privacy Policy"}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "उपयोग की शर्तें" : "Terms of Use"}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "अस्वीकरण" : "Disclaimer"}</button></li>
              <li><button onClick={handleRestart} className="hover:text-white transition-colors">{isHindi ? "साइट मैप" : "Sitemap"}</button></li>
            </ul>
          </div>

          {/* Column 4: Follow Us & Digital India */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider border-l-3 border-gov-saffron pl-2">
              {isHindi ? "हमें फॉलो करें" : "Follow Us"}
            </h4>
            <div className="flex items-center gap-2 text-lg">
              <span className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-80">YT</span>
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-80">FB</span>
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-80">X</span>
              <span className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-80">IG</span>
            </div>

            <div className="pt-2">
              <div className="inline-block bg-white/10 border border-white/20 p-2 rounded-xl text-center">
                <span className="text-xs font-black text-amber-300">Digital India</span>
                <div className="text-[10px] text-slate-300 font-medium">Power To Empower</div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Dark Strip */}
        <div className="bg-[#071629] py-3 px-4 text-[11px] text-slate-400 border-t border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              © 2024 SchemeSetu India. {isHindi ? "भारत सरकार. सभी अधिकार सुरक्षित।" : "Government of India. All rights reserved."}
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <button onClick={handleRestart} className="hover:text-white">{isHindi ? "सुलभता" : "Accessibility"}</button>
              <span>|</span>
              <button onClick={handleRestart} className="hover:text-white">{isHindi ? "प्रतिक्रिया दें" : "Feedback"}</button>
              <span>|</span>
              <span>{isHindi ? "અંતિમ અપડેટ: ઓગસ્ટ 2024" : "Last Updated: August 2024"}</span>
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}
