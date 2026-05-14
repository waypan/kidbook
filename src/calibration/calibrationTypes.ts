export type Point = [number, number];

export type CalibrationStep =
  | 'idle'
  | 'topLeft'
  | 'topRight'
  | 'bottomRight'
  | 'bottomLeft'
  | 'complete';

export interface CalibrationCorners {
  topLeft?: Point;
  topRight?: Point;
  bottomRight?: Point;
  bottomLeft?: Point;
}

export interface PageCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface PageCalibration {
  pageId: string;
  cameraCorners: PageCorners;
  pageCorners: PageCorners;
  homography: number[];
}
