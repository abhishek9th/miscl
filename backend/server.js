import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import userProfileService from './services/userProfileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to understand natural language or partial profile using Groq
app.post('/api/analyze-user', async (req, res) => {
  try {
    const { query, currentProfile, language } = req.body;
    const profile = await userProfileService.analyzeProfile(query, currentProfile, language);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze user profile' });
  }
});

// Audio stays in memory only long enough to send it to Groq Whisper.
app.post('/api/voice/transcribe', express.raw({ type: ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg'], limit: '12mb' }), async (req, res) => {
  try {
    if (!req.body?.length) return res.status(400).json({ error: 'No audio received' });
    const groq = new (await import('groq-sdk')).default({ apiKey: process.env.GROQ_API_KEY });
    const extension = req.headers['content-type']?.includes('ogg') ? 'ogg' : 'webm';
    const audioFile = new File([req.body], `schemesetu-recording.${extension}`, { type: req.headers['content-type'] || 'audio/webm' });
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'json'
    });
    res.json({ text: transcription.text || '' });
  } catch {
    res.status(502).json({ error: 'Voice transcription unavailable' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Secure AI Backend API running on port ${PORT}`);
});
