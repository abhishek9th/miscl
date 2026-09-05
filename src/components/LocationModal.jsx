import React, { useState } from 'react';
import { MapPin, Navigation, Search, Check, ChevronDown, Building } from 'lucide-react';
import { detectUserLocation, INDIAN_STATES } from '../services/locationService';

export default function LocationModal({ onLocationGranted, onLocationDenied, currentLang }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showManualDropdown, setShowManualDropdown] = useState(false);
  const [selectedManualState, setSelectedManualState] = useState('Uttar Pradesh');
  const [searchStateQuery, setSearchStateQuery] = useState('');

  const isHindi = currentLang === 'hi';

  const handleGrantPermission = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const locData = await detectUserLocation();
      onLocationGranted(locData);
    } catch (err) {
      console.warn("Location permission denied or failed:", err);
      setErrorMsg(isHindi ? "स्थान का पता नहीं चल सका। कृपया नीचे से अपना राज्य चुनें।" : "Could not detect location. Please select your state manually below.");
      setShowManualDropdown(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmManualState = () => {
    const matchedState = INDIAN_STATES.find(s => s.name === selectedManualState) || INDIAN_STATES[0];
    onLocationGranted({
      state: matchedState.name,
      state_hi: matchedState.name_hi,
      suggestedLang: matchedState.lang
    });
  };

  const filteredStates = INDIAN_STATES.filter(s => 
    s.name.toLowerCase().includes(searchStateQuery.toLowerCase()) || 
    s.name_hi.includes(searchStateQuery)
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-4 border-gov-navy overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Header Strip */}
        <div className="bg-gov-navy text-white p-5 text-center border-b-4 border-gov-saffron relative">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-400/50">
            <MapPin className="w-9 h-9 text-amber-400 animate-bounce" />
          </div>
          <h2 className="text-2xl font-extrabold font-sans">
            {isHindi ? "राज्य एवं स्थान का चयन" : "Select Location & State"}
          </h2>
          <p className="text-xs text-amber-200 mt-1">Location Preference</p>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-center space-y-4">
          <p className="text-lg font-bold text-slate-900 leading-relaxed">
            {isHindi 
              ? "“हम आपके राज्य के अनुसार उपलब्ध सरकारी योजनाएँ दिखाना चाहते हैं।”"
              : "“We want to show government schemes available according to your state.”"}
          </p>
          <p className="text-xs text-slate-600">
            {isHindi 
              ? "स्थान की अनुमति देने या राज्य चुनने से आपके राज्य की विशेष योजनाएं दिखाई जाएंगी।"
              : "Allowing location or selecting your state ensures you see state-specific government benefits."}
          </p>

          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Automatic Location Button */}
          {!showManualDropdown ? (
            <div className="space-y-3 pt-1">
              <button
                onClick={handleGrantPermission}
                disabled={loading}
                className="gov-btn-accent w-full py-4 text-xl flex items-center justify-center gap-3 shadow-lg hover:bg-orange-700"
              >
                {loading ? (
                  <span>{isHindi ? "स्थान खोजा जा रहा है..." : "Detecting Location..."}</span>
                ) : (
                  <>
                    <Navigation className="w-6 h-6" />
                    <span>{isHindi ? "स्थान की अनुमति दें" : "Allow Location Permission"}</span>
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink mx-3 text-xs text-slate-400 font-bold uppercase">
                  {isHindi ? "अथवा" : "OR"}
                </span>
                <div className="flex-grow border-t border-slate-300"></div>
              </div>

              <button
                onClick={() => setShowManualDropdown(true)}
                disabled={loading}
                className="gov-btn-secondary w-full py-3.5 text-lg border-slate-400 text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-2"
              >
                <Building className="w-5 h-5 text-gov-navy" />
                <span>{isHindi ? "मैन्युअल रूप से राज्य चुनें" : "Select State Manually"}</span>
              </button>
            </div>
          ) : (
            /* Manual Dropdown Selector View */
            <div className="space-y-3 pt-1 text-left animate-in fade-in duration-150">
              <label className="text-sm font-extrabold text-gov-navy flex items-center gap-1.5">
                <Building className="w-4 h-4 text-gov-saffron" />
                <span>{isHindi ? "अपना राज्य चुनें (Select State):" : "Select Your State:"}</span>
              </label>

              {/* State Search Input inside dropdown */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isHindi ? "राज्य खोजें (Filter states)..." : "Search state..."}
                  value={searchStateQuery}
                  onChange={(e) => setSearchStateQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-slate-300 rounded-lg text-sm font-bold focus:border-gov-navy focus:outline-none"
                />
              </div>

              {/* State Dropdown Select Box */}
              <div className="max-h-[180px] overflow-y-auto border-2 border-slate-200 rounded-xl p-1 bg-slate-50 space-y-1">
                {filteredStates.map((s) => {
                  const isSelected = selectedManualState === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => setSelectedManualState(s.name)}
                      className={`w-full p-2.5 rounded-lg text-left text-sm font-bold flex items-center justify-between transition-colors ${
                        isSelected 
                          ? 'bg-gov-navy text-white shadow' 
                          : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span>{s.name} ({s.name_hi})</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleConfirmManualState}
                  className="gov-btn-accent w-full py-3.5 text-lg flex items-center justify-center gap-2 shadow"
                >
                  <Check className="w-5 h-5" />
                  <span>{isHindi ? "चयनित राज्य की पुष्टि करें" : "Confirm State Selection"}</span>
                </button>

                <button
                  onClick={() => setShowManualDropdown(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold underline w-full text-center py-1"
                >
                  ← {isHindi ? "वापस ऑटो-लोकेशन पर जाएँ" : "Back to Auto-Location"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center text-xs text-slate-500">
          🔒 {isHindi ? "आपकी गोपनीयता सुरक्षित है। हम कोई व्यक्तिगत डेटा रिकॉर्ड नहीं करते।" : "Your privacy is safe. We do not store personal data."}
        </div>
      </div>
    </div>
  );
}
