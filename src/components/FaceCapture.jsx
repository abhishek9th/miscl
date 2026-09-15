import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Check, CameraOff, Loader2 } from 'lucide-react';

/**
 * Face photo capture using the browser camera.
 * - Camera is NOT started automatically; the user taps "Enable Camera" first.
 * - Shows a live preview, "Capture Photo", then "Retake".
 * - Emits the captured image as a JPEG Blob via onCapture(blob, dataUrl).
 */
export default function FaceCapture({ onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | live | captured | error
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Always release the camera when this component goes away.
  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser.');
      setStatus('error');
      return;
    }
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('live');
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setError('Camera permission was denied. Please allow camera access and try again.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera was found on this device.');
      } else {
        setError('Could not start the camera. Please try again.');
      }
      setStatus('error');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Center-crop to a square, un-mirror so the saved image is natural.
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    canvas.toBlob(
      (blob) => { if (blob) onCapture?.(blob, dataUrl); },
      'image/jpeg',
      0.9
    );
    stopCamera();
    setStatus('captured');
  };

  const retake = () => {
    setPreview('');
    onCapture?.(null, '');
    startCamera();
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Profile Photo <span className="text-slate-400 font-normal">(optional)</span>
      </label>

      <div className="rounded-xl border border-slate-300 bg-slate-50 overflow-hidden">
        <div className="relative aspect-square w-full bg-slate-900/90 flex items-center justify-center">
          {/* Live video (mirrored for a natural selfie view) */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${status === 'live' ? 'block' : 'hidden'}`}
            style={{ transform: 'scaleX(-1)' }}
          />

          {status === 'captured' && preview && (
            <img src={preview} alt="Captured face" className="w-full h-full object-cover" />
          )}

          {(status === 'idle' || status === 'starting' || status === 'error') && (
            <div className="flex flex-col items-center gap-2 text-slate-300 px-4 text-center">
              {status === 'starting' ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : status === 'error' ? (
                <CameraOff className="w-8 h-8" />
              ) : (
                <Camera className="w-8 h-8" />
              )}
              <span className="text-xs">
                {status === 'starting' ? 'Starting camera…' : 'Camera is off'}
              </span>
            </div>
          )}
        </div>

        <div className="p-2.5 bg-white border-t border-slate-200">
          {(status === 'idle' || status === 'error') && (
            <button type="button" onClick={startCamera}
              className="w-full h-11 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> Enable Camera
            </button>
          )}
          {status === 'starting' && (
            <button type="button" disabled className="w-full h-11 rounded-lg bg-slate-100 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Please allow camera access…
            </button>
          )}
          {status === 'live' && (
            <button type="button" onClick={capture}
              className="w-full h-11 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-sm flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> Capture Photo
            </button>
          )}
          {status === 'captured' && (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm font-semibold text-[#1d4ed8] flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Photo captured
              </span>
              <button type="button" onClick={retake}
                className="h-10 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
