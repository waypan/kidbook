import React from 'react';
import type { CalibrationCorners, CalibrationStep, Point } from './calibrationTypes';
import { calibrationStepToLabel } from './calibrationStore';

interface CalibrationOverlayProps {
  step: CalibrationStep;
  corners: CalibrationCorners;
  onTap: (point: Point) => void;
  onStart: () => void;
  onReset: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({
  step,
  corners,
  onTap,
  onStart,
  onReset,
  videoRef
}) => {
  const renderPoint = (point: Point | undefined, label: string) => {
    if (!point || !videoRef.current) return null;
    const [x, y] = point;
    const left = `${(x / videoRef.current.videoWidth) * 100}%`;
    const top = `${(y / videoRef.current.videoHeight) * 100}%`;

    return (
      <div className="calibration-point" style={{ left, top }}>
        <span>{label}</span>
      </div>
    );
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const point: Point = [event.clientX, event.clientY];
    onTap(point);
  };

  return (
    <div className="calibration-overlay" onClick={handleClick}>
      <div className="calibration-status">
        {step === 'idle'
          ? 'Tap Calibrate Page to begin.'
          : step === 'complete'
          ? 'Calibration complete.'
          : `Please tap ${calibrationStepToLabel(step)}.`}
      </div>
      <div className="calibration-buttons">
        <button type="button" onClick={onStart}>Calibrate Page</button>
        <button type="button" onClick={onReset}>Reset Calibration</button>
      </div>
      {renderPoint(corners.topLeft, 'TL')}
      {renderPoint(corners.topRight, 'TR')}
      {renderPoint(corners.bottomRight, 'BR')}
      {renderPoint(corners.bottomLeft, 'BL')}
    </div>
  );
};

export default CalibrationOverlay;
