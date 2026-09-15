/**
 * Text-to-Speech (TTS) and Speech-to-Text (STT) Service
 *
 * Covers all 12 languages SchemeSetu's UI supports (src/data/translations.js /
 * translationService.js LANG_NAMES) — not just Hindi/English — for both
 * reading pages aloud and the chatbot's voice replies.
 */

let synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let currentUtterance = null;
let utteranceQueue = [];

// 2-letter app language code -> BCP-47 locale tag for speechSynthesis/SpeechRecognition.
const LANG_LOCALE = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  ur: 'ur-IN',
};

function localeFor(langCode) {
  return LANG_LOCALE[langCode] || (langCode?.includes('-') ? langCode : `${langCode}-IN`);
}

// Not every OS/browser ships a voice for every Indian language. If the exact
// locale has no installed voice, fall back to any voice sharing the language
// prefix, then to Hindi (broadly available), rather than silently speaking
// with the wrong voice's default language.
function resolveVoice(locale) {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const langPrefix = locale.split('-')[0];
  return (
    voices.find((v) => v.lang === locale) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('hi')) ||
    null
  );
}

// Split text into chunks for long texts
function splitTextIntoChunks(text, maxLength = 200) {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  let currentChunk = '';
  
  // Split by sentences (periods, exclamation, question marks)
  const sentences = text.split(/(?<=[।!?])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export function readTextAloud(text, langCode = 'hi-IN', onEnd = () => {}) {
  if (!synth) {
    console.warn("Audio speech output is not supported in this browser.");
    return false;
  }

  // Cancel any ongoing speech
  synth.cancel();
  utteranceQueue = [];

  const chunks = splitTextIntoChunks(text, 200);
  let currentChunkIndex = 0;

  const speakNextChunk = () => {
    if (currentChunkIndex >= chunks.length) {
      currentUtterance = null;
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
    const locale = localeFor(langCode);
    const voice = resolveVoice(locale);
    utterance.lang = voice?.lang || locale;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9; // Slightly slower for rural clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      currentChunkIndex++;
      speakNextChunk();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      currentChunkIndex++;
      speakNextChunk();
    };

    try {
      currentUtterance = utterance;
      synth.speak(utterance);
    } catch (error) {
      console.error('Error starting speech:', error);
      currentChunkIndex++;
      speakNextChunk();
    }
  };

  speakNextChunk();
  return true;
}

export function stopTextAloud() {
  if (synth) {
    synth.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking() {
  return synth ? synth.speaking : false;
}

/**
 * Speech Recognition (Speech-to-Text) wrapper
 */
export function startVoiceRecognition(onResult, onError, langCode = 'hi-IN') {
  const SpeechRecognition = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!SpeechRecognition) {
    onError("Voice typing is not supported in this browser. Please type your query.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = localeFor(langCode);
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    onError(event.error || "Voice recognition failed.");
  };

  recognition.start();
  return recognition;
}
