import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandResult } from './types';

let handLandmarker: HandLandmarker | null = null;

export async function initHandDetector(): Promise<boolean> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );

  try {
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: new URL('/models/hand_landmarker.task', import.meta.url).href,
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 1
    });
    return true;
  } catch (error) {
    console.error('HandLandmarker initialization failed:', error);
    handLandmarker = null;
    return false;
  }
}

export function hasHandDetector(): boolean {
  return handLandmarker !== null;
}

export function detectHands(video: HTMLVideoElement): HandResult | null {
  if (!handLandmarker) return null;

  const result = handLandmarker.detectForVideo(video, Date.now());
  return result.landmarks.length > 0 ? { landmarks: result.landmarks[0] } : null;
}

export function getIndexFingerTip(landmarks: any[]): [number, number] | null {
  if (!landmarks || landmarks.length < 9) return null;
  const tip = landmarks[8];
  return [tip.x, tip.y];
}
