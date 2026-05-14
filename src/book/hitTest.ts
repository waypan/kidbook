import { BookPage, BookObject, Point } from './types';
import { pointInPolygon } from './geometry';

export function findHitObject(page: BookPage, point: Point): BookObject | null {
  return page.objects.find((obj) => pointInPolygon(point, obj.polygon)) ?? null;
}