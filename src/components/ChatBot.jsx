import React, { useEffect, useRef, useState } from 'react';
import { Mic, Send, ChevronDown, Volume2, Volume1 } from 'lucide-react';
import { processNaturalLanguageQuery } from '../services/aiService';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { cleanupRecording, startBrowserFallback, startGroqRecording, stopGroqRecording } from '../services/voiceService';

export default function ChatBot({ currentLang, onVoiceProfileReady }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [profile, setProfile] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fallbackRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isHindi = currentLang === 'hi';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speak function
  const speak = (text) => {
    if (!text) return;
    setIsSpeaking(true);
    readTextAloud(text, isHindi ? 'hi-IN' : 'en-IN', () => {
      setIsSpeaking(false);
    });
  };

  // Stop speaking
  const stopSpeaking = () => {
    stopTextAloud();
    setIsSpeaking(false);
  };

  // Initialize chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = isHindi
        ? 'नमस्ते! मैं SchemeSetu हूँ। आपको किस प्रकार की सरकारी योजना की जानकारी चाहिए?'
        : "Hello! I'm SchemeSetu. What kind of government scheme are you looking for?";
      
      setMessages([{ id: 1, type: 'bot', text: greeting }]);
      speak(greeting);
    }
    return () => { stopTextAloud(); cleanupRecording(); fallbackRef.current?.abort?.(); };
  }, [isOpen]);

  // Speak bot messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'bot') {
        speak(lastMessage.text);
      }
    }
  }, [messages]);

  const toggleRecording = async () => {
    if (voiceState === 'recording') {
      setVoiceState('transcribing');
      try {
        const text = await stopGroqRecording();
        setInputText(text);
        setVoiceState('idle');
      } catch (error) {
        setVoiceState('error');
        const errorMsg = isHindi 
          ? 'आवाज़ समझने में समस्या। कृपया दोबारा कोशिश करें।'
          : 'Could not understand audio. Please try again.';
        setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: errorMsg }]);
      }
      return;
    }

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: isHindi ? 'माइक्रोफोन उपलब्ध नहीं। कृपया टाइप करके बताएं।' : 'Microphone unavailable. Please type instead.' 
      }]);
      return;
    }

    try {
      setVoiceState('requesting_permission');
      await startGroqRecording();
      setVoiceState('recording');
    } catch (error) {
      setVoiceState('error');
      const errorMsg = error?.name === 'NotAllowedError'
        ? (isHindi ? 'माइक्रोफोन की अनुमति नहीं मिली।' : 'Microphone permission denied.')
        : (isHindi ? 'माइक्रोफोन उपलब्ध नहीं है।' : 'Microphone not available.');
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: errorMsg }]);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), type: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const result = await processNaturalLanguageQuery(inputText, profile, currentLang);
      
      // Update profile
      const extracted = result.extractedData || {};
      const newProfileData = Object.fromEntries(
        Object.entries(extracted).filter(([, value]) => value !== null && value !== '')
      );
      const updatedProfile = { ...profile, ...newProfileData };
      setProfile(updatedProfile);

      // Add bot response
      const nextQuestion = result.nextQuestion || (isHindi 
        ? 'अपनी जानकारी दें।' 
        : 'Please provide more details.');
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: nextQuestion 
      }]);

      // If schemes ready, trigger callback
      if (result.shouldFilterSchemes) {
        setTimeout(() => {
          onVoiceProfileReady?.(updatedProfile);
        }, 500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = isHindi
        ? 'जानकारी समझने में समस्या। कृपया दोबारा कोशिश करें।'
        : 'Error processing your message. Please try again.';
      setMessages(prev => [...prev, { id: Date.now() + 2, type: 'bot', text: errorMsg }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#0B75C9] to-[#075C9C] text-white shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center"
        aria-label="Open chat"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-full bg-white rounded-2xl shadow-2xl border-2 border-[#BFDBFE] overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B75C9] to-[#075C9C] text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg">{isHindi ? 'SchemeSetu सहायता' : 'SchemeSetu Help'}</h3>
          <p className="text-xs text-blue-100">{isHindi ? 'बोलकर या लिखकर पूछें' : 'Ask by voice or text'}</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="text-white hover:bg-white/20 p-1 rounded-lg transition"
          aria-label="Close"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-semibold leading-relaxed ${
                msg.type === 'user'
                  ? 'bg-[#0B75C9] text-white rounded-br-none'
                  : 'bg-white border-2 border-[#BFDBFE] text-slate-800 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
            {msg.type === 'bot' && (
              <button
                onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text)}
                className={`p-1 transition self-center ${
                  isSpeaking && msg.id === messages[messages.length - 1].id
                    ? 'text-red-500 hover:text-red-700 animate-pulse'
                    : 'text-[#0B75C9] hover:text-[#075C9C]'
                }`}
                title={isSpeaking ? (isHindi ? 'सुनना बंद करें' : 'Stop') : (isHindi ? 'फिर से सुनें' : 'Listen again')}
              >
                {isSpeaking && msg.id === messages[messages.length - 1].id ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-[#BFDBFE] text-slate-600 rounded-2xl rounded-bl-none px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-[#BFDBFE] p-3 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isProcessing && sendMessage()}
            placeholder={isHindi ? 'संदेश भेजें...' : 'Type message...'}
            className="flex-1 px-4 py-2.5 border-2 border-[#BFDBFE] rounded-xl focus:outline-none focus:border-[#0B75C9] focus:ring-2 focus:ring-[#60A5FA] font-semibold text-slate-800"
            disabled={isProcessing}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="bg-[#0B75C9] hover:bg-[#075C9C] text-white p-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={toggleRecording}
          disabled={isProcessing || ['requesting_permission', 'transcribing'].includes(voiceState)}
          className={`w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition ${
            voiceState === 'recording'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Mic className="w-4 h-4" />
          {voiceState === 'recording'
            ? (isHindi ? 'रिकॉर्डिंग... (क्लिक करके रोकें)' : 'Recording... (click to stop)')
            : (isHindi ? 'माइक से बोलें' : 'Speak')}
        </button>
      </div>
    </div>
  );
}
