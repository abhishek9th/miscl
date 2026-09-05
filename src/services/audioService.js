/**
 * Text-to-Speech (TTS) and Speech-to-Text (STT) Service
 */

let synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let currentUtterance = null;

export function readTextAloud(text, langCode = 'hi-IN', onEnd = () => {}) {
  if (!synth) {
    alert("Audio speech output is not supported in this browser.");
    return false;
  }

  // Cancel any ongoing speech
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode === 'hi' ? 'hi-IN' : langCode === 'en' ? 'en-IN' : 'hi-IN';
  utterance.rate = 0.9; // Slightly slower for rural clarity
  utterance.pitch = 1.0;

  utterance.onend = () => {
    currentUtterance = null;
    onEnd();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    onEnd();
  };

  currentUtterance = utterance;
  synth.speak(utterance);
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
  recognition.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN';
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
