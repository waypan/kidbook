import type { PageCorners, Point } from './calibrationTypes';

type MarkerKey = keyof PageCorners;

interface ComlinkApi {
  proxy<T extends (...args: unknown[]) => unknown>(value: T): T;
  wrap<T>(endpoint: Worker): T;
}

type AprilTagWorkerConstructor = new (onReady: () => void) => Promise<AprilTagDetectorProxy>;

interface AprilTagDetectorProxy {
  detect(grayscale: Uint8ClampedArray, width: number, height: number): Promise<RawAprilTagDetection[]>;
  set_max_detections(maxDetections: number): Promise<void>;
  set_return_pose(returnPose: 0 | 1): Promise<void>;
  set_return_solutions(returnSolutions: 0 | 1): Promise<void>;
}

interface RawAprilTagDetection {
  id?: number;
  tag_id?: number;
  center?: unknown;
  c?: unknown;
  corners?: unknown[];
  p?: unknown[];
}

export interface AprilTagDetection {
  id: number;
  center: Point;
  corners: Point[];
}

export interface AprilTagPageMarkerResult {
  pageCorners: PageCorners | null;
  detections: AprilTagDetection[];
}

interface MarkerDefinition {
  id: number;
  key: MarkerKey;
}

const tagWorkerUrl = '/vendor/apriltag/apriltag.js';
const comlinkUrl = '/vendor/apriltag/comlink.js';
const scanWidth = 480;
const detectorReadyTimeoutMs = 8000;
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
): Promise<AprilTagPageMarkerResult> {
  if (!video.videoWidth || !video.videoHeight) {
    return { pageCorners: null, detections: [] };
  }

  const detector = await getDetector();
  const { grayscale, width, height, scaleX, scaleY } = videoFrameToGrayscale(video, canvas);
  const rawDetections = await detector.detect(grayscale, width, height);
  const detections = rawDetections
    .map((detection) => normalizeDetection(detection, scaleX, scaleY))
    .filter((detection): detection is AprilTagDetection => detection !== null);

  const corners = {} as Partial<PageCorners>;
  for (const marker of bookMarkers) {
    const detection = detections.find((candidate) => candidate.id === marker.id);
    if (!detection) {
      return { pageCorners: null, detections };
    }
    corners[marker.key] = detection.center;
  }

  return { pageCorners: corners as PageCorners, detections };
}

async function getDetector(): Promise<AprilTagDetectorProxy> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const Comlink = await loadComlink();
      const worker = new Worker(tagWorkerUrl);
      const RemoteApriltag = Comlink.wrap<AprilTagWorkerConstructor>(worker);
      let resolveReady: () => void = () => undefined;
      const readyPromise = new Promise<void>((resolve) => {
        resolveReady = resolve;
      });
      const detector = await new RemoteApriltag(
        Comlink.proxy(() => {
          resolveReady();
        })
      );

      await withTimeout(readyPromise, detectorReadyTimeoutMs, 'AprilTag detector did not finish loading');
      await detector.set_return_pose(0);
      await detector.set_return_solutions(0);
      await detector.set_max_detections(bookMarkers.length);
      return detector;
    })();
  }

  return detectorPromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
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

function normalizeDetection(
  detection: RawAprilTagDetection,
  scaleX: number,
  scaleY: number
): AprilTagDetection | null {
  const id = getDetectionId(detection);
  const center = getDetectionCenter(detection);
  const rawCorners = detection.corners ?? detection.p ?? [];
  if (id === null || !center) return null;

  return {
    id,
    center: scalePoint(center, scaleX, scaleY),
    corners: rawCorners
      .map(pointFromUnknown)
      .filter((point): point is Point => point !== null)
      .map((point) => scalePoint(point, scaleX, scaleY))
  };
}

function getDetectionCenter(detection: RawAprilTagDetection): Point | null {
  const center = pointFromUnknown(detection.center);
  if (center) return center;

  const shortCenter = pointFromUnknown(detection.c);
  if (shortCenter) return shortCenter;

  const corners = detection.corners ?? detection.p;
  if (!corners || corners.length === 0) return null;
  const points = corners
    .map(pointFromUnknown)
    .filter((point): point is Point => point !== null);
  if (points.length === 0) return null;

  const sum = points.reduce<Point>(
    (total, corner) => [total[0] + corner[0], total[1] + corner[1]],
    [0, 0]
  );
  return [sum[0] / points.length, sum[1] / points.length];
}

function scalePoint(point: Point, scaleX: number, scaleY: number): Point {
  return [point[0] * scaleX, point[1] * scaleY];
}

function pointFromUnknown(value: unknown): Point | null {
  if (Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === 'number'
    && typeof value[1] === 'number') {
    return [value[0], value[1]];
  }

  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const point = value as { x: unknown; y: unknown };
    if (typeof point.x === 'number' && typeof point.y === 'number') {
      return [point.x, point.y];
    }
  }

  return null;
}
