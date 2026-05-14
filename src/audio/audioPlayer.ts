let lastObjectId = '';
let lastPlayTime = 0;
let isPlaying = false;

export function shouldPlay(objectId: string): boolean {
  if (isPlaying) {
    return false;
  }

  const now = Date.now();
  if (objectId === lastObjectId && now - lastPlayTime < 1500) {
    return false;
  }

  lastObjectId = objectId;
  lastPlayTime = now;
  return true;
}

export function playAudio(src: string, fallbackText = ''): void {
  if (isPlaying) {
    return;
  }

  isPlaying = true;
  const audio = new Audio(src);
  let didFallback = false;
  const startFallback = () => {
    if (didFallback) {
      return;
    }

    didFallback = true;
    speakFallback(fallbackText);
  };

  audio.addEventListener('ended', finishPlayback, { once: true });
  audio.addEventListener('error', startFallback, { once: true });
  audio.play().catch(error => {
    console.warn(`Audio failed to play: ${src}`, error);
    startFallback();
  });
}

function speakFallback(text: string): void {
  if (!text.trim() || !('speechSynthesis' in window)) {
    finishPlayback();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.addEventListener('end', finishPlayback, { once: true });
  utterance.addEventListener('error', finishPlayback, { once: true });
  window.speechSynthesis.speak(utterance);
}

function finishPlayback(): void {
  isPlaying = false;
}
