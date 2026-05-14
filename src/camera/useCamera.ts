import { useCallback, useEffect, useRef, useState } from 'react';

type CameraStatus = 'idle' | 'starting' | 'active' | 'error';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not available in this browser or WebView');
      setStatus('error');
      return;
    }

    setStatus('starting');
    setError(null);
    stopCamera();
    const requestId = requestIdRef.current;

    try {
      let mediaStream: MediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (preferredCameraError) {
        if (preferredCameraError instanceof DOMException && preferredCameraError.name === 'NotAllowedError') {
          throw preferredCameraError;
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (requestId !== requestIdRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access and try again.'
          : 'Camera access is not available. Check camera permissions and try again.'
      );
      console.error('Camera error:', err);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  return { videoRef, stream, error, status, startCamera, stopCamera };
}
