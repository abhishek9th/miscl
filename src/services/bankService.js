// Logos are self-hosted (public/bank-logos/) from Wikimedia Commons rather than
// hotlinked, so they keep working regardless of Commons' own availability.
const COMMON_BANKS = [
  { name: 'State Bank of India', shortName: 'SBI', searchName: 'State Bank of India', logo: '/bank-logos/sbi.svg' },
  { name: 'Punjab National Bank', shortName: 'PNB', searchName: 'Punjab National Bank', logo: '/bank-logos/pnb.svg' },
  { name: 'Bank of Baroda', shortName: 'BOB', searchName: 'Bank of Baroda', logo: '/bank-logos/bob.png' },
  { name: 'Canara Bank', shortName: 'Canara Bank', searchName: 'Canara Bank', logo: '/bank-logos/canara.svg' },
  { name: 'Union Bank of India', shortName: 'Union Bank', searchName: 'Union Bank of India', logo: '/bank-logos/union.svg' }
];

const SCHEME_PROVIDERS = {
  scheme_pmegp: {
    type: 'participating commercial banks, regional rural banks and cooperative banks',
    type_hi: 'भाग लेने वाले वाणिज्यिक बैंक, क्षेत्रीय ग्रामीण बैंक और सहकारी बैंक',
    banks: COMMON_BANKS
  },
  scheme_mudra_shishu: {
    type: 'commercial banks, regional rural banks, small finance banks and NBFCs',
    type_hi: 'वाणिज्यिक बैंक, क्षेत्रीय ग्रामीण बैंक, स्मॉल फाइनेंस बैंक और NBFC',
    banks: COMMON_BANKS
  },
  scheme_mudra_kishore: {
    type: 'commercial banks, regional rural banks, small finance banks and NBFCs',
    type_hi: 'वाणिज्यिक बैंक, क्षेत्रीय ग्रामीण बैंक, स्मॉल फाइनेंस बैंक और NBFC',
    banks: COMMON_BANKS
  },
  scheme_standup_india: {
    type: 'scheduled commercial bank branches',
    type_hi: 'अनुसूचित वाणिज्यिक बैंक शाखाएँ',
    banks: COMMON_BANKS
  },
  scheme_pm_vishwakarma: {
    type: 'participating bank branches and regional rural banks',
    type_hi: 'भाग लेने वाली बैंक शाखाएँ और क्षेत्रीय ग्रामीण बैंक',
    banks: COMMON_BANKS
  },
  scheme_pmfme: {
    type: 'scheduled commercial banks, regional rural banks and cooperative banks',
    type_hi: 'अनुसूचित वाणिज्यिक बैंक, क्षेत्रीय ग्रामीण बैंक और सहकारी बैंक',
    banks: COMMON_BANKS
  },
  scheme_vidya_lakshmi: {
    type: 'registered education-loan banks on the Vidya Lakshmi portal',
    type_hi: 'विद्या लक्ष्मी पोर्टल पर पंजीकृत शिक्षा ऋण बैंक',
    banks: COMMON_BANKS
  }
};

const DEFAULT_PROVIDERS = {
  type: 'the implementing department or a participating bank branch',
  type_hi: 'संबंधित विभाग या भाग लेने वाली बैंक शाखा'
};

export function getSchemeProviders(scheme) {
  return scheme.provider_banks || SCHEME_PROVIDERS[scheme.id] || DEFAULT_PROVIDERS;
}

export function getBankNavigationUrl(provider, location = {}) {
  const query = location.lat && location.lon
    ? `${provider.searchName || provider.name} near ${location.lat},${location.lon}`
    : `${provider.searchName || provider.name}, ${location.state || 'India'}`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query }).toString()}`;
}

export function getGeneralBankNavigationUrl(location = {}) {
  const query = location.lat && location.lon
    ? `government bank near ${location.lat},${location.lon}`
    : `government bank, ${location.state || 'India'}`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query }).toString()}`;
}
