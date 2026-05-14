import { Point } from './types';

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function screenToPagePoint(
  screenX: number,
  screenY: number,
  imageRect: DOMRect,
  pageWidth: number,
  pageHeight: number
): Point {
  const relativeX = screenX - imageRect.left;
  const relativeY = screenY - imageRect.top;

  const pageX = (relativeX / imageRect.width) * pageWidth;
  const pageY = (relativeY / imageRect.height) * pageHeight;

  return [pageX, pageY];
}