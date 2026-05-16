import type { PageCorners, Point } from './calibrationTypes';

type MarkerKey = keyof PageCorners;

interface MarkerDefinition {
  key: MarkerKey;
  minHue: number;
  maxHue: number;
}

interface Component {
  area: number;
  sumX: number;
  sumY: number;
}

const markers: MarkerDefinition[] = [
  { key: 'topLeft', minHue: 345, maxHue: 20 },
  { key: 'topRight', minHue: 90, maxHue: 155 },
  { key: 'bottomRight', minHue: 190, maxHue: 250 },
  { key: 'bottomLeft', minHue: 45, maxHue: 75 }
];

const scanWidth = 320;
const minComponentArea = 18;

export function detectColorPageMarkers(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): PageCorners | null {
  if (!video.videoWidth || !video.videoHeight) return null;

  const width = scanWidth;
  const height = Math.round((video.videoHeight / video.videoWidth) * width);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(video, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  const scaleX = video.videoWidth / width;
  const scaleY = video.videoHeight / height;

  const detected = {} as Partial<PageCorners>;

  for (const marker of markers) {
    const component = findLargestColorComponent(data, width, height, marker);
    if (!component) return null;

    detected[marker.key] = [
      (component.sumX / component.area) * scaleX,
      (component.sumY / component.area) * scaleY
    ];
  }

  if (!detected.topLeft || !detected.topRight || !detected.bottomRight || !detected.bottomLeft) {
    return null;
  }

  return detected as PageCorners;
}

function findLargestColorComponent(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  marker: MarkerDefinition
): Component | null {
  const visited = new Uint8Array(width * height);
  let largest: Component | null = null;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (visited[index] || !matchesMarker(data, index * 4, marker)) continue;

      const component = floodFillColor(data, visited, width, height, x, y, marker);
      if (component.area >= minComponentArea && (!largest || component.area > largest.area)) {
        largest = component;
      }
    }
  }

  return largest;
}

function floodFillColor(
  data: Uint8ClampedArray,
  visited: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  marker: MarkerDefinition
): Component {
  const stack: Point[] = [[startX, startY]];
  const component: Component = { area: 0, sumX: 0, sumY: 0 };

  while (stack.length > 0) {
    const [x, y] = stack.pop() as Point;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) continue;
    visited[pixelIndex] = 1;

    if (!matchesMarker(data, pixelIndex * 4, marker)) continue;

    component.area += 1;
    component.sumX += x;
    component.sumY += y;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return component;
}

function matchesMarker(data: Uint8ClampedArray, index: number, marker: MarkerDefinition): boolean {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const { hue, saturation, value } = rgbToHsv(r, g, b);

  return saturation > 0.42 && value > 0.32 && hueInRange(hue, marker.minHue, marker.maxHue);
}

function hueInRange(hue: number, minHue: number, maxHue: number): boolean {
  if (minHue <= maxHue) return hue >= minHue && hue <= maxHue;
  return hue >= minHue || hue <= maxHue;
}

function rgbToHsv(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  if (hue < 0) hue += 360;

  return {
    hue,
    saturation: max === 0 ? 0 : delta / max,
    value: max
  };
}
