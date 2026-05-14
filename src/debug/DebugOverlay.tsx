import React from 'react';
import { BookPage, BookObject } from '../book/types';

interface DebugOverlayProps {
  currentPage: BookPage | null;
  hitObject: BookObject | null;
  fingerPoint: [number, number] | null;
  pagePoint: [number, number] | null;
  isDetecting: boolean;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({
  currentPage,
  hitObject,
  fingerPoint,
  pagePoint,
  isDetecting
}) => {
  return (
    <div className="debug-overlay">
      <p>Page: {currentPage?.pageId || 'None'}</p>
      <p>Detecting: {isDetecting ? 'Yes' : 'No'}</p>
      {fingerPoint && <p>Finger: {fingerPoint[0].toFixed(0)}, {fingerPoint[1].toFixed(0)}</p>}
      {pagePoint && <p>Page: {pagePoint[0].toFixed(0)}, {pagePoint[1].toFixed(0)}</p>}
      {hitObject && <p>Hit: {hitObject.id} / {hitObject.nameZh}</p>}
    </div>
  );
};

export default DebugOverlay;
