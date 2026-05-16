import type { PageCorners, Point } from './calibrationTypes';

type MarkerKey = keyof PageCorners;

interface ComlinkApi {
  proxy<T extends (...args: unknown[]) => unknown>(value: T): T;
  wrap<T>(endpoint: Worker): T;
}

interface AprilTagWorkerModule {
  Apriltag: new (onReady: () => void) => Promise<AprilTagDetectorProxy>;
}

interface AprilTagDetectorProxy {
  detect(grayscale: Uint8ClampedArray, width: number, height: number): Promise<RawAprilTagDetection[]>;
  set_max_detections(maxDetections: number): Promise<void>;
  set_return_pose(returnPose: 0 | 1): Promise<void>;
  set_return_solutions(returnSolutions: 0 | 1): Promise<void>;
}

interface RawAprilTagDetection {
  id?: number;
  tag_id?: number;
  center?: Point;
  c?: Point;
  corners?: Point[];
  p?: Point[];
}

interface MarkerDefinition {
  id: number;
  key: MarkerKey;
}

const tagWorkerUrl = '/vendor/apriltag/apriltag.js';
const comlinkUrl = '/vendor/apriltag/comlink.js';
const scanWidth = 480;
const bookMarkers: MarkerDefinition[] = [
  { id: 0, key: 'topLeft' },
  { id: 1, key: 'topRight' },
  { id: 2, key: 'bottomRight' },
  { id: 3, key: 'bottomLeft' }
];

let comlinkPromise: Promise<ComlinkApi> | null = null;
let detectorPromise: Promise<AprilTagDetectorProxy> | null = null;

declare global {
  interface Window {
    Comlink?: ComlinkApi;
  }
}

export async function detectAprilTagPageMarkers(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<PageCorners | null> {
  if (!video.videoWidth || !video.videoHeight) return null;

  const detector = await getDetector();
  const { grayscale, width, height, scaleX, scaleY } = videoFrameToGrayscale(video, canvas);
  const detections = await detector.detect(grayscale, width, height);

  const corners = {} as Partial<PageCorners>;
  for (const marker of bookMarkers) {
    const detection = detections.find((candidate) => getDetectionId(candidate) === marker.id);
    const center = detection ? getDetectionCenter(detection) : null;
    if (!center) return null;
    corners[marker.key] = [center[0] * scaleX, center[1] * scaleY];
  }

  return corners as PageCorners;
}

async function getDetector(): Promise<AprilTagDetectorProxy> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const Comlink = await loadComlink();
      const worker = new Worker(tagWorkerUrl);
      const workerModule = Comlink.wrap<AprilTagWorkerModule>(worker);
      let resolveReady: () => void = () => undefined;
      const readyPromise = new Promise<void>((resolve) => {
        resolveReady = resolve;
      });
      const detector = await new workerModule.Apriltag(
        Comlink.proxy(() => {
          resolveReady();
        })
      );

      await readyPromise;
      await detector.set_return_pose(0);
      await detector.set_return_solutions(0);
      await detector.set_max_detections(bookMarkers.length);
      return detector;
    })();
  }

  return detectorPromise;
}

function loadComlink(): Promise<ComlinkApi> {
  if (!comlinkPromise) {
    comlinkPromise = new Promise((resolve, reject) => {
      if (window.Comlink) {
        resolve(window.Comlink);
        return;
      }

      const script = document.createElement('script');
      script.src = comlinkUrl;
      script.async = true;
      script.onload = () => {
        if (window.Comlink) {
          resolve(window.Comlink);
        } else {
          reject(new Error('Comlink loaded without exposing window.Comlink'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Comlink for AprilTag detection'));
      document.head.appendChild(script);
    });
  }

  return comlinkPromise;
}

function videoFrameToGrayscale(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const width = Math.min(scanWidth, video.videoWidth);
  const height = Math.round((video.videoHeight / video.videoWidth) * width);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Could not get AprilTag scan canvas context');
  }

  context.drawImage(video, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const grayscale = new Uint8ClampedArray(width * height);

  for (let source = 0, target = 0; source < imageData.data.length; source += 4, target += 1) {
    const r = imageData.data[source];
    const g = imageData.data[source + 1];
    const b = imageData.data[source + 2];
    grayscale[target] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return {
    grayscale,
    width,
    height,
    scaleX: video.videoWidth / width,
    scaleY: video.videoHeight / height
  };
}

function getDetectionId(detection: RawAprilTagDetection): number | null {
  if (typeof detection.id === 'number') return detection.id;
  if (typeof detection.tag_id === 'number') return detection.tag_id;
  return null;
}

function getDetectionCenter(detection: RawAprilTagDetection): Point | null {
  if (isPoint(detection.center)) return detection.center;
  if (isPoint(detection.c)) return detection.c;

  const corners = detection.corners ?? detection.p;
  if (!corners || corners.length === 0) return null;

  const sum = corners.reduce<Point>(
    (total, corner) => [total[0] + corner[0], total[1] + corner[1]],
    [0, 0]
  );
  return [sum[0] / corners.length, sum[1] / corners.length];
}

function isPoint(value: unknown): value is Point {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === 'number'
    && typeof value[1] === 'number';
}
