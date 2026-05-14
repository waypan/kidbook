import React, { useState } from 'react';
import CameraPreview from './camera/CameraPreview';
import { BookPage, BookObject } from './book/types';

function App() {
  const [currentPage, setCurrentPage] = useState<BookPage | null>(null);
  const [hitObject, setHitObject] = useState<BookObject | null>(null);
  const [fingerPoint, setFingerPoint] = useState<[number, number] | null>(null);
  const [pagePoint, setPagePoint] = useState<[number, number] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  return (
    <div className="app">
      <CameraPreview
        onPageLoad={setCurrentPage}
        onHitObject={setHitObject}
        onFingerPoint={setFingerPoint}
        onPagePoint={setPagePoint}
        onDetecting={setIsDetecting}
      />
    </div>
  );
}

export default App;