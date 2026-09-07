/**
 * Text-to-Speech (TTS) and Speech-to-Text (STT) Service
 */

let synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let currentUtterance = null;
let utteranceQueue = [];

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
    utterance.lang = langCode === 'hi' ? 'hi-IN' : langCode === 'en' ? 'en-IN' : langCode;
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
