import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';

// Lightweight informational modal for the footer's Privacy / Terms / Disclaimer /
// Accessibility links, so they are functional (not dead) without needing full
// standalone legal pages. Content is honest and MVP-appropriate — SchemeSetu is
// an informational aggregator over official Government of India sources.
const CONTENT = {
  privacy: {
    en: 'Privacy Policy', hi: 'गोपनीयता नीति',
    bodyEn: [
      'SchemeSetu collects only the profile details you provide (such as name, state, income category and documents) to match you with government schemes and to auto-fill applications on your behalf.',
      'Your documents and identity details are stored securely and are visible only to you. Sensitive fields are encrypted, and we never sell or share your personal data with third parties.',
      'You can view, edit or delete your profile and documents at any time from the Profile section.',
    ],
    bodyHi: [
      'SchemeSetu केवल वही प्रोफ़ाइल जानकारी एकत्र करता है जो आप देते हैं (जैसे नाम, राज्य, आय श्रेणी और दस्तावेज़) ताकि आपको उपयुक्त सरकारी योजनाओं से जोड़ा जा सके।',
      'आपके दस्तावेज़ और पहचान विवरण सुरक्षित रूप से संग्रहीत होते हैं और केवल आपको दिखाई देते हैं। संवेदनशील जानकारी एन्क्रिप्ट की जाती है, और हम आपका व्यक्तिगत डेटा कभी साझा या बेचते नहीं हैं।',
      'आप कभी भी अपनी प्रोफ़ाइल और दस्तावेज़ प्रोफ़ाइल अनुभाग से देख, संपादित या हटा सकते हैं।',
    ],
  },
  terms: {
    en: 'Terms of Use', hi: 'उपयोग की शर्तें',
    bodyEn: [
      'SchemeSetu is an informational platform that helps citizens discover and apply for Government of India schemes. Scheme information is sourced from official government portals such as myScheme.gov.in.',
      'Final eligibility and approval for any scheme is decided solely by the concerned government department. SchemeSetu does not guarantee approval and is not a government body.',
      'By using this platform you agree to provide accurate information and to verify scheme details on the official portal before applying.',
    ],
    bodyHi: [
      'SchemeSetu एक सूचनात्मक मंच है जो नागरिकों को भारत सरकार की योजनाओं को खोजने और आवेदन करने में मदद करता है। योजना जानकारी myScheme.gov.in जैसे आधिकारिक पोर्टलों से ली जाती है।',
      'किसी भी योजना के लिए अंतिम पात्रता और स्वीकृति संबंधित सरकारी विभाग द्वारा ही तय की जाती है। SchemeSetu स्वीकृति की गारंटी नहीं देता और यह कोई सरकारी संस्था नहीं है।',
      'इस मंच का उपयोग करके आप सही जानकारी देने और आवेदन से पहले आधिकारिक पोर्टल पर विवरण सत्यापित करने के लिए सहमत होते हैं।',
    ],
  },
  disclaimer: {
    en: 'Disclaimer', hi: 'अस्वीकरण',
    bodyEn: [
      'All scheme details shown on SchemeSetu are compiled from official Government of India sources and are provided for informational purposes only.',
      'While we strive to keep information accurate and up to date, scheme rules can change. Always confirm the latest eligibility, benefits and documents on the official scheme portal before applying.',
    ],
    bodyHi: [
      'SchemeSetu पर दिखाई गई सभी योजना जानकारी भारत सरकार के आधिकारिक स्रोतों से संकलित है और केवल सूचना के उद्देश्य से दी गई है।',
      'हम जानकारी को सटीक और अद्यतन रखने का प्रयास करते हैं, फिर भी योजना नियम बदल सकते हैं। आवेदन से पहले हमेशा आधिकारिक योजना पोर्टल पर नवीनतम पात्रता, लाभ और दस्तावेज़ की पुष्टि करें।',
    ],
  },
  accessibility: {
    en: 'Accessibility', hi: 'सुलभता',
    bodyEn: [
      'SchemeSetu is designed to be usable by everyone. You can change the text size from the top bar, switch to your preferred language, and use the "Listen" option to have scheme details read aloud.',
      'The platform works with screen readers and keyboard navigation. If you face any accessibility difficulty, please use the in-app assistant for help.',
    ],
    bodyHi: [
      'SchemeSetu को सभी के लिए उपयोगी बनाने के लिए डिज़ाइन किया गया है। आप ऊपर की पट्टी से टेक्स्ट का आकार बदल सकते हैं, अपनी पसंदीदा भाषा चुन सकते हैं, और "सुनें" विकल्प से योजना विवरण सुन सकते हैं।',
      'यह मंच स्क्रीन रीडर और कीबोर्ड नेविगेशन के साथ काम करता है। किसी भी सुलभता कठिनाई में कृपया इन-ऐप सहायक का उपयोग करें।',
    ],
  },
};

export default function PolicyModal({ type, onClose }) {
  const { tr, isHindi } = useI18n();
  const c = CONTENT[type];
  if (!c) return null;
  const body = isHindi ? c.bodyHi : c.bodyEn;
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gov-navy text-white p-4 flex items-center justify-between border-b-4 border-gov-saffron">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black">{tr(c.en, c.hi)}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-amber-400 p-1" aria-label={tr('Close', 'बंद करें')}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {body.map((p, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
          ))}
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            {tr('Source: Government of India — myScheme.gov.in', 'स्रोत: भारत सरकार — myScheme.gov.in')}
          </p>
        </div>
      </div>
    </div>
  );
}
