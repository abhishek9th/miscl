import React, { useEffect, useRef, useState } from 'react';
import { Mic, Pause, Send, Square, Volume2, X } from 'lucide-react';
import { processNaturalLanguageQuery } from '../services/aiService';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { cleanupRecording, startBrowserFallback, startGroqRecording, stopGroqRecording } from '../services/voiceService';

export default function AiAssistantModal({ onClose, onVoiceProfileReady, currentLang }) {
  const [inputText, setInputText] = useState('');
  const [profile, setProfile] = useState({});
  const [voiceState, setVoiceState] = useState('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nextQuestion, setNextQuestion] = useState('');
  const fallbackRef = useRef(null);
  const isHindi = currentLang !== 'en';

  const speak = (text) => {
    if (!text) return;
    setIsSpeaking(true);
    readTextAloud(text, currentLang, () => setIsSpeaking(false));
  };

  useEffect(() => {
    speak(isHindi
      ? 'नमस्ते। मैं सरकारी योजनाएँ खोजने में मदद करूँगा। बताइए, आपको व्यवसाय, पढ़ाई, या रोजगार से संबंधित सहायता चाहिए?'
      : 'Hello. I can help find government schemes. Tell me whether you need support for business, education, or employment.');
    return () => { stopTextAloud(); cleanupRecording(); fallbackRef.current?.abort?.(); };
  }, []);

  const beginFallback = (message = '') => {
    setErrorMsg(message);
    setVoiceState('listening');
    fallbackRef.current = startBrowserFallback(
      (text) => { setInputText(text); setVoiceState('idle'); },
      () => { setVoiceState('error'); setErrorMsg(isHindi ? 'आवाज़ समझने में समस्या हुई। कृपया दोबारा बोलें या जानकारी टाइप करें।' : 'We could not understand the audio. Please try again or type your details.'); },
      currentLang
    );
  };

  const toggleRecording = async () => {
    setErrorMsg('');
    stopTextAloud();
    if (voiceState === 'recording') {
      setVoiceState('transcribing');
      try { setInputText(await stopGroqRecording()); setVoiceState('idle'); }
      catch { beginFallback(isHindi ? 'Groq ट्रांसक्रिप्शन उपलब्ध नहीं है। कृपया दोबारा बोलें।' : 'Groq transcription is unavailable. Please speak again using the browser fallback.'); }
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      beginFallback(isHindi ? 'इस ब्राउज़र में रिकॉर्डिंग उपलब्ध नहीं है। ब्राउज़र वॉइस इनपुट का उपयोग किया जा रहा है।' : 'Recording is unavailable in this browser. Using browser voice input.');
      return;
    }
    try { setVoiceState('requesting_permission'); await startGroqRecording(); setVoiceState('recording'); }
    catch (error) {
      setVoiceState('error');
      setErrorMsg(error?.name === 'NotAllowedError'
        ? (isHindi ? 'माइक्रोफोन की अनुमति नहीं मिली। आप जानकारी टाइप करके भी दे सकते हैं।' : 'Microphone permission was not granted. You can type your information instead.')
        : (isHindi ? 'माइक्रोफोन उपलब्ध नहीं है। आप जानकारी टाइप करके भी दे सकते हैं।' : 'No microphone is available. You can type your information instead.'));
    }
  };

  const processInput = async () => {
    if (!inputText.trim()) return;
    setVoiceState('processing'); setErrorMsg('');
    try {
      const result = await processNaturalLanguageQuery(inputText, profile, currentLang);
      const merged = { ...profile, ...Object.fromEntries(Object.entries(result.extractedData || {}).filter(([, value]) => value !== null && value !== '')) };
      setProfile(merged); setNextQuestion(result.nextQuestion || ''); setInputText('');
      if (result.shouldFilterSchemes) {
        speak(isHindi ? 'आपकी जानकारी समझ ली गई है। अब आपके लिए योजनाएँ खोज रहा हूँ।' : 'Your details are understood. I am now finding suitable schemes.');
        onVoiceProfileReady(merged); onClose();
      } else {
        const question = result.nextQuestion || (isHindi ? 'कृपया अपनी जरूरत के बारे में थोड़ा और बताइए।' : 'Please tell me a little more about what you need.');
        setVoiceState('waiting_for_answer'); speak(question);
      }
    } catch {
      setVoiceState('error'); setErrorMsg(isHindi ? 'जानकारी समझने में समस्या हुई। कृपया दोबारा बोलें या टाइप करें।' : 'We could not process those details. Please try again or type them.');
    }
  };

  const stateLabel = {
    recording: isHindi ? '● सुन रहा हूँ... बोलिए, फिर रोकें दबाएँ' : '● Listening… speak, then press stop',
    requesting_permission: isHindi ? 'माइक्रोफोन की अनुमति माँगी जा रही है...' : 'Requesting microphone permission…',
    transcribing: isHindi ? 'आपकी आवाज़ को लिखा जा रहा है...' : 'Transcribing your voice…',
    processing: isHindi ? 'आपकी जानकारी समझी जा रही है...' : 'Understanding your information…',
    waiting_for_answer: nextQuestion,
  }[voiceState];

  return <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-4 border-gov-navy overflow-hidden">
      <div className="bg-gov-navy text-white p-4 flex items-center justify-between border-b-4 border-gov-saffron">
        <div><h2 className="text-xl font-bold">{isHindi ? 'SchemeSetu वॉइस सहायता' : 'SchemeSetu Voice Assistance'}</h2><p className="text-xs text-amber-200">{isHindi ? 'बोलकर या टाइप करके जानकारी दें' : 'Speak or type your details'}</p></div>
        <button onClick={onClose} className="text-white hover:text-amber-300" aria-label="Close"><X /></button>
      </div>
      <div className="p-5 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-gov-navy font-semibold">{nextQuestion || (isHindi ? 'अपनी जरूरत एक बार में बताइए—जैसे राज्य, आय, काम और जरूरी सहायता राशि।' : 'Tell us your need in one go—such as state, income, work, and support amount.')}</div>
        <textarea rows={4} value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder={isHindi ? 'आपने कहा… (आप यहाँ सुधार भी कर सकते हैं)' : 'What you said… (you can edit it here)'} className="w-full p-3 border-2 border-slate-300 rounded-xl font-semibold focus:border-gov-navy focus:outline-none resize-none" />
        {stateLabel && <p className="text-sm text-gov-navy font-bold text-center">{stateLabel}</p>}
        {errorMsg && <p className="text-sm bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 font-semibold">{errorMsg}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={toggleRecording} disabled={['requesting_permission', 'transcribing', 'processing'].includes(voiceState)} className={`font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 ${voiceState === 'recording' ? 'bg-red-600 text-white' : 'bg-gov-navy text-white'} disabled:opacity-50`}>
            {voiceState === 'recording' ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}{voiceState === 'recording' ? (isHindi ? 'रोकें' : 'Stop') : (isHindi ? 'बोलकर बताएं' : 'Speak')}
          </button>
          <button onClick={() => { stopTextAloud(); setIsSpeaking(false); }} disabled={!isSpeaking} className="border-2 border-gov-navy text-gov-navy font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"><Pause className="w-5 h-5" />{isHindi ? 'रोकें' : 'Stop audio'}</button>
        </div>
        <button onClick={processInput} disabled={!inputText.trim() || ['processing', 'transcribing'].includes(voiceState)} className="gov-btn-accent w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"><Send className="w-5 h-5" />{isHindi ? '✓ सही है, आगे बढ़ें' : '✓ Correct, continue'}</button>
        <button onClick={() => speak(nextQuestion || (isHindi ? 'कृपया अपनी जरूरत बताइए।' : 'Please tell me what you need.'))} className="w-full text-gov-navy font-bold text-sm flex items-center justify-center gap-1.5"><Volume2 className="w-4 h-4" />{isHindi ? 'सुनें' : 'Listen'}</button>
      </div>
    </div>
  </div>;
}
