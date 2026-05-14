# Children Book Reader

Offline children picture book point-and-read demo.

## Project layout

- `src/` – React app with camera, hand detection, hit testing
- `public/book.json` – book metadata
- `public/book-data/` – page JSON with object polygons
- `public/pages/` – page images
- `public/audio/` – audio files
- `public/models/` – MediaPipe hand detection model
- `capacitor.config.ts` – Capacitor config

## Development

```bash
npm install
npm run dev
```

## Build for Android

```bash
npm run build
npm run cap:sync
npm run cap:open:android
```

## MVP Features

- Camera preview with rear camera
- Local MediaPipe hand detection
- Index fingertip tracking
- Polygon hit testing on book pages
- Local audio playback
- Debug overlay

Works fully offline after installation.
