import { startVoiceRecognition } from './audioService';

let recorder;
let stream;
let chunks = [];

export async function startGroqRecording() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  recorder.start();
}

export function stopGroqRecording() {
  return new Promise((resolve, reject) => {
    if (!recorder || recorder.state === 'inactive') return reject(new Error('No active recording'));
    recorder.onstop = async () => {
      try {
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) throw new Error('Empty recording');
        const response = await fetch('/api/voice/transcribe', { method: 'POST', headers: { 'Content-Type': audio.type || 'audio/webm' }, body: audio });
        if (!response.ok) throw new Error('Transcription unavailable');
        const { text } = await response.json();
        if (!text?.trim()) throw new Error('Empty transcription');
        resolve(text.trim());
      } catch (error) { reject(error); }
      finally { cleanupRecording(); }
    };
    recorder.stop();
  });
}

export function cleanupRecording() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  recorder = null;
  chunks = [];
}

export function startBrowserFallback(onResult, onError, language) {
  return startVoiceRecognition(onResult, onError, language);
}
