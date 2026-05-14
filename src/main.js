const pageImage = document.getElementById('page-image');
const pageText = document.getElementById('page-text');
const pageLabel = document.getElementById('page-label');
const pageAuthor = document.getElementById('page-author');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playBtn = document.getElementById('play-btn');
const bookTitle = document.getElementById('book-title');
const audioElement = document.getElementById('page-audio');

let book = null;
let currentPageIndex = 0;
let pages = [];

function formatPageNumber(index) {
  return String(index + 1).padStart(3, '0');
}

function updateNavigation() {
  prevBtn.disabled = currentPageIndex === 0;
  nextBtn.disabled = currentPageIndex === pages.length - 1;
  pageLabel.textContent = `Page ${currentPageIndex + 1} of ${pages.length}`;
}

function updatePage(pageData) {
  const pageInfo = pages[currentPageIndex];
  pageText.textContent = pageData.text || 'Tap on objects to hear stories.';
  pageAuthor.textContent = pageData.author ? `Author: ${pageData.author}` : '';
  pageImage.src = pageData.image || pageInfo.image;
  pageImage.alt = pageData.alt || pageInfo.title || `Page ${currentPageIndex + 1}`;
  audioElement.src = pageData.audio || '';
  playBtn.textContent = 'Play Audio';
}

async function loadPage(pageRef) {
  const response = await fetch(pageRef);
  const pageData = await response.json();
  updatePage(pageData);
  updateNavigation();
}

async function initBook() {
  const response = await fetch('../public/book.json');
  book = await response.json();
  pages = book.pages || [];

  bookTitle.textContent = book.title || 'Children Book Reader';
  document.getElementById('book-subtitle').textContent = book.subtitle || 'A gentle story for early readers.';

  if (pages.length === 0) {
    pageText.textContent = 'No pages are available. Please check the book data in public/book.json.';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    playBtn.disabled = true;
    return;
  }

  await loadPage(pages[currentPageIndex].data);
}

prevBtn.addEventListener('click', async () => {
  if (currentPageIndex === 0) return;
  currentPageIndex -= 1;
  await loadPage(pages[currentPageIndex].data);
});

nextBtn.addEventListener('click', async () => {
  if (currentPageIndex === pages.length - 1) return;
  currentPageIndex += 1;
  await loadPage(pages[currentPageIndex].data);
});

playBtn.addEventListener('click', async () => {
  if (!audioElement.src) return;
  if (audioElement.paused) {
    await audioElement.play();
    playBtn.textContent = 'Pause Audio';
  } else {
    audioElement.pause();
    playBtn.textContent = 'Play Audio';
  }
});

audioElement.addEventListener('ended', () => {
  playBtn.textContent = 'Play Audio';
});

window.addEventListener('DOMContentLoaded', initBook);
