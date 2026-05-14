import React, { useEffect, useRef, useState } from 'react';
import { useCamera } from './useCamera';
import { initHandDetector, detectHands, getIndexFingerTip, hasHandDetector } from '../hand/handDetector';
import { loadBook, loadPage } from '../book/bookLoader';
import { findHitObject } from '../book/hitTest';
import { playAudio, shouldPlay } from '../audio/audioPlayer';
import { BookPage, BookObject, Book } from '../book/types';
import DebugOverlay from '../debug/DebugOverlay';

interface CameraPreviewProps {
  onPageLoad: (page: BookPage | null) => void;
  onHitObject: (obj: BookObject | null) => void;
  onFingerPoint: (point: [number, number] | null) => void;
  onPagePoint: (point: [number, number] | null) => void;
  onDetecting: (detecting: boolean) => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  onPageLoad,
  onHitObject,
  onFingerPoint,
  onPagePoint,
  onDetecting
}) => {
  const { videoRef, error, status, startCamera } = useCamera();
  const pointerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<BookPage | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [lastHitObject, setLastHitObject] = useState<BookObject | null>(null);
  const [handAvailable, setHandAvailable] = useState(false);
  const [handError, setHandError] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pagePoint, setPagePoint] = useState<[number, number] | null>(null);

  useEffect(() => {
    const init = async () => {
      const handOk = await initHandDetector();
      if (!handOk) {
        setHandError('Hand detection model failed to load. Please provide a valid local hand_landmarker.task in public/models.');
      }
      setHandAvailable(handOk && hasHandDetector());
      const bookData = await loadBook();
      setBook(bookData);
      const pageData = await loadPage(bookData.pages[0].data);
      setCurrentPage(pageData);
      onPageLoad(pageData);
    };
    init();
  }, [onPageLoad]);

  const changePage = async (index: number) => {
    if (!book || index < 0 || index >= book.pages.length) return;
    const pageData = await loadPage(book.pages[index].data);
    setCurrentPage(pageData);
    setCurrentPageIndex(index);
    setPagePoint(null);
    setLastHitObject(null);
    onPageLoad(pageData);
    onHitObject(null);
    onPagePoint(null);
    onFingerPoint(null);
  };

  useEffect(() => {
    if (!videoRef.current || !currentPage) return;

    const video = videoRef.current;

    const detect = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // use video dimensions for mapping, no canvas rendering required

        const handResult = handAvailable ? detectHands(video) : null;
        onDetecting(handAvailable && !!handResult);

        if (handResult) {
          const fingerPoint = getIndexFingerTip(handResult.landmarks);
          onFingerPoint(fingerPoint);

          if (fingerPoint && pointerRef.current) {
            const [fx, fy] = fingerPoint;
            const width = video.clientWidth;
            const height = video.clientHeight;
            const x = width * (1 - fx);
            const y = height * fy;
            pointerRef.current.style.left = `${x}px`;
            pointerRef.current.style.top = `${y}px`;
            pointerRef.current.style.display = 'block';
          }

          if (fingerPoint) {
            const mappedPagePoint: [number, number] = [
              (1 - fingerPoint[0]) * currentPage.width,
              fingerPoint[1] * currentPage.height
            ];
            setPagePoint(mappedPagePoint);
            onPagePoint(mappedPagePoint);

            const hitObject = findHitObject(currentPage, mappedPagePoint);
            onHitObject(hitObject);

            if (hitObject && hitObject !== lastHitObject && shouldPlay(hitObject.id)) {
              playAudio(hitObject.audio, hitObject.textZh || hitObject.nameZh);
              setLastHitObject(hitObject);
            }
          }
        } else if (handAvailable) {
          onFingerPoint(null);
          onPagePoint(null);
          onHitObject(null);
          setLastHitObject(null);
          setPagePoint(null);
          if (pointerRef.current) {
            pointerRef.current.style.display = 'none';
          }
        }
      }

      requestAnimationFrame(detect);
    };

    detect();
  }, [videoRef, currentPage, lastHitObject, onDetecting, onFingerPoint, onPagePoint, onHitObject, handAvailable]);

  if (handError) {
    return <div className="error">{handError}</div>;
  }

  return (
    <div className="camera-container">
      <div className="page-controls">
        <button type="button" onClick={() => changePage(currentPageIndex - 1)} disabled={!book || currentPageIndex === 0}>Prev</button>
        <span>{book ? `${book.pages[currentPageIndex]?.title || 'Page'} (${currentPageIndex + 1}/${book.pages.length})` : 'Loading pages...'}</span>
        <button type="button" onClick={() => changePage(currentPageIndex + 1)} disabled={!book || currentPageIndex === (book?.pages.length ?? 1) - 1}>Next</button>
      </div>
      <DebugOverlay
        currentPage={currentPage}
        hitObject={lastHitObject}
        fingerPoint={null}
        pagePoint={pagePoint}
        isDetecting={handAvailable}
      />
      <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
      {status !== 'active' && (
        <div className="camera-start-panel">
          {error && <p>{error}</p>}
          {!error && <p>{status === 'starting' ? 'Starting camera...' : 'Camera is ready to start'}</p>}
          <button type="button" onClick={startCamera} disabled={status === 'starting'}>
            {status === 'starting' ? 'Starting...' : 'Activate Camera'}
          </button>
        </div>
      )}
      <div ref={pointerRef} className="point-highlight" />
    </div>
  );
};

export default CameraPreview;
