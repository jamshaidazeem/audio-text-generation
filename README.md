# Audio Text Generation

A Next.js app for uploading MP3 audio and transcribing it to text entirely in the browser using OpenAI Whisper Tiny via [Transformers.js](https://huggingface.co/docs/transformers.js).

## Features

- MP3 file picker with `accept="audio/mpeg,.mp3"`
- Client-side validation for file type and size (max **5 MB**)
- Displays file name, extension, and size (human-readable and bytes)
- **Background model preload** — Whisper Tiny downloads as soon as the page loads
- Progress bars for model download, audio decode, and transcription
- On-device transcription with **`Xenova/whisper-tiny`**
- Web Worker inference so the UI stays responsive
- Clear button to reset file selection and transcript (keeps the loaded model in memory)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) with React Compiler enabled
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Whisper Tiny in-browser)
- [ESLint](https://eslint.org)

## Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- This repo pins **v22.12.0** in [`.nvmrc`](.nvmrc)

```bash
nvm use
```

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

If the worker fails to bundle under Turbopack, use webpack instead:

```bash
npm run dev:webpack
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start dev server (Turbopack)  |
| `npm run dev:webpack` | Start dev server with Webpack |
| `npm run build`       | Production build              |
| `npm run start`       | Serve production build        |
| `npm run lint`        | Run ESLint                    |

## Project structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout and metadata
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles (Tailwind)
├── components/
│   └── UploadMp3.tsx           # Upload UI, progress bars, transcript
├── hooks/
│   └── useWhisperTranscription.ts  # Worker lifecycle and transcription state
├── lib/
│   ├── audio.ts                # MP3 decode and 16 kHz resampling
│   ├── upload-constants.ts     # Max upload size (5 MB)
│   └── whisper-types.ts        # Worker message types
└── workers/
    └── whisper.worker.ts       # Whisper Tiny preload and inference
```

## How it works

```text
Page load ──► Web Worker preloads Xenova/whisper-tiny (background download)
                    │
User selects MP3 ──► Client validation (type + 5 MB limit)
                    │
User clicks Transcribe ──► Decode MP3 to 16 kHz mono (main thread)
                    │
                    ├── Model still loading? ──► Show model download progress
                    │
                    └── Model ready ──► Transcribe in 30 s chunks (worker)
                                              │
                                              └── Transcript shown in UI
```

## Upload validation

Validation runs in the browser when a file is selected:

1. **Type** — filename must end with `.mp3` (case-insensitive), or MIME type must be `audio/mpeg` when provided by the browser
2. **Size** — file must be 5 MB or smaller (`src/lib/upload-constants.ts`)

Invalid files show an error message and the selection is cleared so the same file can be chosen again.

## Transcription flow

1. **Page load** — Whisper Tiny begins downloading in the background; a progress bar is shown until the model is ready.
2. **Select file** — choose a valid MP3 (up to 5 MB).
3. **Transcribe** — click the button to start.
4. **Decode** — the app decodes the MP3 to 16 kHz mono on the main thread.
5. **Model check** — if the model is still downloading, model progress is shown first.
6. **Transcribe** — audio is processed in 30-second chunks in a Web Worker; a transcription progress bar updates per chunk.
7. **Result** — the transcript appears below the file details.

## Privacy and performance

- **Audio never leaves your device** — only model weights are fetched from Hugging Face on first use (~40 MB).
- The model is cached by the browser after the first download; subsequent visits load much faster.
- Whisper Tiny is the fastest Whisper variant; longer MP3s still take noticeable time to transcribe.
- Keep the tab open while transcription runs.

## Configuration notes

[`next.config.ts`](next.config.ts) includes:

- `turbopack: {}` — required for Next.js 16 builds when a custom `webpack` config is present
- `webpack` aliases — excludes Node-only packages (`sharp`, `onnxruntime-node`) from browser bundles
- `serverExternalPackages` — keeps `@huggingface/transformers` external on the server

## License

Private project.
