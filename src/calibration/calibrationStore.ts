import type { CalibrationCorners, CalibrationStep, PageCorners, Point } from './calibrationTypes';

export const calibrationSteps: CalibrationStep[] = [
  'topLeft',
  'topRight',
  'bottomRight',
  'bottomLeft'
];

export const calibrationLabels: Record<CalibrationStep, string> = {
  idle: 'Idle',
  topLeft: 'top-left corner',
  topRight: 'top-right corner',
  bottomRight: 'bottom-right corner',
  bottomLeft: 'bottom-left corner',
  complete: 'Calibration complete'
};

export function getNextCalibrationStep(step: CalibrationStep): CalibrationStep {
  const index = calibrationSteps.indexOf(step);
  if (index === -1 || index === calibrationSteps.length - 1) {
    return 'complete';
  }
  return calibrationSteps[index + 1];
}

export function pageCornersForPage(pageWidth: number, pageHeight: number): PageCorners {
  return {
    topLeft: [0, 0],
    topRight: [pageWidth, 0],
    bottomRight: [pageWidth, pageHeight],
    bottomLeft: [0, pageHeight]
  };
}

export function calibrationStepToLabel(step: CalibrationStep): string {
  return calibrationLabels[step] ?? 'Unknown step';
}

export function cornersAsArray(corners: CalibrationCorners): Point[] {
  return [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft] as Point[];
}
