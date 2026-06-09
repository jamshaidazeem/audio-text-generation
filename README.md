# Audio Text Generation

A Next.js app for turning audio into text. Upload audio files or use a YouTube link to preview a video, download the file, or generate a transcript. Supports **on-device** transcription with Whisper Tiny ([Transformers.js](https://huggingface.co/docs/transformers.js)) or **server** transcription via the [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text).

## Features

- **Model explorer home page** — choose between transcription backends before uploading
- **YouTube → Text** — preview a video, download the file, or transcribe to text (local dev; max **1 min** for download and transcribe)
- **Per-model pages** — capabilities, pros, and cons for each backend, plus a dedicated upload UI
- Audio file picker (mp3, mp4, mpeg, mpga, m4a, wav, webm)
- Client-side validation for file type and size
- **Two transcription models:**
  - **On device** — Whisper Tiny in the browser (private, max **5 MB**)
  - **Server (OpenAI)** — upload to API route, transcribed by OpenAI (max **1 MB**)
- Background model preload in on-device mode
- Progress bars for model download, upload, decode, and transcription
- Web Worker inference for on-device mode
- Clear button resets file and transcript (keeps loaded browser model in memory)
- Reusable UI primitives (`Card`, `Button`, `ProgressBar`, etc.) shared across pages

## Routes

| Route | Description |
| ----- | ----------- |
| `/` | Home — model explorer and YouTube → Text entry point |
| `/transcribe/on-device` | Whisper Tiny in-browser transcription |
| `/transcribe/server` | OpenAI Whisper API transcription |
| `/youtube-text` | YouTube URL input, preview, download, and transcription UI |
| `POST /api/transcribe` | Server API route (used by server upload mode) |
| `POST /api/youtube-info` | Fetch YouTube video duration (metadata only) |
| `POST /api/download-youtube` | Download YouTube media via yt-dlp and return the file |
| `POST /api/transcribe-youtube` | Download YouTube audio with yt-dlp and transcribe via OpenAI |

Invalid model routes (e.g. `/transcribe/invalid`) return a 404.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) with React Compiler enabled
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Whisper Tiny in-browser)
- [OpenAI Node SDK](https://github.com/openai/openai-node) (server mode)
- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec) (YouTube audio download via yt-dlp)
- [ESLint](https://eslint.org)

## Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- This repo pins **v22.12.0** in [`.nvmrc`](.nvmrc)
- **Server mode and YouTube transcription:** an OpenAI API key with access to the Audio API
- **YouTube preview, download, and transcription (local dev):** Python **3.9+** as `python3` on your PATH (`youtube-dl-exec` uses it to run yt-dlp)

```bash
nvm use
```

## Getting started

Install dependencies:

```bash
npm install
```

Copy the environment template and add your OpenAI key (required for server mode and YouTube transcription):

```bash
cp env.example .env.local
```

Set in `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

Run the development server:

```bash
npm run dev
```

If the worker fails to bundle under Turbopack, use webpack instead:

```bash
npm run dev:webpack
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Pick a transcription model and upload an audio file, or open **YouTube → Text** to preview a video, download it, or transcribe it.

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
│   ├── api/transcribe/route.ts         # OpenAI Whisper API (server upload mode)
│   ├── api/download-youtube/route.ts   # YouTube media download
│   ├── api/transcribe-youtube/route.ts # YouTube audio download + OpenAI transcription
│   ├── api/youtube-info/route.ts       # YouTube video metadata (duration)
│   ├── transcribe/[mode]/page.tsx      # Per-model info + upload UI
│   ├── youtube-text/page.tsx           # YouTube preview, download, and transcription UI
│   ├── layout.tsx
│   ├── page.tsx                    # Home — model explorer + YouTube → Text
│   └── globals.css
├── components/
│   ├── ui/                         # Shared primitives (Card, Button, ProgressBar, …)
│   ├── BackLink.tsx
│   ├── FeatureCard.tsx             # Home-page feature card (YouTube → Text)
│   ├── ModelCard.tsx               # Home-page model card
│   ├── ModelInfo.tsx               # Capabilities, pros, cons
│   ├── TranscriptionUploader.tsx   # Upload UI and progress (mode prop)
│   └── YouTubeUrlInput.tsx             # YouTube URL validation, preview, download, and transcription UI
├── hooks/
│   ├── useWhisperTranscription.ts      # On-device worker transcription
│   ├── useServerTranscription.ts       # Server upload + API call
│   ├── useYouTubeDownload.ts           # YouTube download via API
│   └── useYouTubeTranscription.ts      # YouTube URL transcription via API
├── lib/
│   ├── audio.ts
│   ├── download-youtube-media.ts       # yt-dlp raw media download (server only)
│   ├── extract-youtube-audio.ts        # yt-dlp native audio download for transcription (server only)
│   ├── get-youtube-video-info.ts       # yt-dlp metadata (duration)
│   ├── format-bytes.ts
│   ├── models.ts                       # Model metadata, routes, and config
│   ├── transcribe-openai.ts            # Shared OpenAI Whisper helper
│   ├── upload-constants.ts             # Upload limits per mode
│   ├── validate-audio-upload.ts        # Shared audio format validation
│   ├── validate-youtube-url.ts         # YouTube URL parsing and validation
│   ├── youtube-constants.ts            # YouTube duration and file size limits
│   ├── youtube-errors.ts               # Step-based YouTube pipeline errors
│   └── whisper-types.ts
└── workers/
    └── whisper.worker.ts
```

Model metadata (titles, capabilities, pros, cons, and route mapping) lives in [`src/lib/models.ts`](src/lib/models.ts). Adding a third model is config-driven: extend `MODELS` and the corresponding hook/uploader wiring.

## YouTube → Text (`/youtube-text`)

Preview a YouTube video, download the file, or generate a text transcript. **Local dev only** for now — yt-dlp runs inside the Next.js server process.

These are standalone actions on the same page: preview, download, and transcribe do not depend on one another.

**Preview**

1. Enter a YouTube URL (`watch`, `youtu.be`, `shorts`, `embed`, and `m.youtube.com` links)
2. Client-side validation via [`src/lib/validate-youtube-url.ts`](src/lib/validate-youtube-url.ts)
3. Confirm the video to load an embedded preview
4. `POST /api/youtube-info` fetches duration via yt-dlp ([`src/lib/get-youtube-video-info.ts`](src/lib/get-youtube-video-info.ts))
5. Videos longer than **1 minute** show a warning; download and transcribe are disabled

**Download**

1. Confirm a video that is **1 minute or shorter**
2. `POST /api/download-youtube` downloads media with yt-dlp ([`src/lib/download-youtube-media.ts`](src/lib/download-youtube-media.ts)) and returns the file to the browser
3. Does not require `OPENAI_API_KEY`

**Transcribe**

1. Confirm a video that is **1 minute or shorter**
2. `POST /api/transcribe-youtube` downloads native audio with yt-dlp ([`src/lib/extract-youtube-audio.ts`](src/lib/extract-youtube-audio.ts)) — typically `.m4a` or `.webm`, without re-encoding to MP3
3. Downloaded audio is validated against the same [OpenAI-supported formats](https://platform.openai.com/docs/guides/speech-to-text) as file upload, then transcribed via [`src/lib/transcribe-openai.ts`](src/lib/transcribe-openai.ts)
4. Requires `OPENAI_API_KEY`

**Limits:**

| Action | Max duration | Max file size |
| ------ | ------------ | ------------- |
| Preview | — | — |
| Download | 1 minute | 100 MB |
| Transcribe | 1 minute | 25 MB (downloaded audio; OpenAI Whisper API limit) |

Step-specific error messages cover URL validation, download, file read, and transcription failures.

**Not supported yet:** on-device browser Whisper for YouTube (audio cannot be downloaded in the browser). Vercel/serverless deployment requires a separate media-extraction service.

## Transcription models

### On device (`/transcribe/on-device`)

- Uses `Xenova/whisper-tiny` in a Web Worker
- Model preloads on page load
- Audio stays in the browser; only model weights are downloaded from Hugging Face (~40 MB, cached after first use)
- Accepts the same formats as server upload (mp3, mp4, mpeg, mpga, m4a, wav, webm); decoding uses the browser's `AudioContext` — **mp3** and **wav** are the most reliable if another format fails
- Max file size: **5 MB**

### Server / OpenAI (`/transcribe/server`)

- Uploads audio to `POST /api/transcribe`
- Server calls OpenAI `whisper-1` and returns `{ text }`
- Accepts [OpenAI Whisper input formats](https://platform.openai.com/docs/guides/speech-to-text): mp3, mp4, mpeg, mpga, m4a, wav, webm
- Requires `OPENAI_API_KEY` in environment (local: `.env.local`, Vercel: Project Settings → Environment Variables)
- Audio is sent to your server, then to OpenAI
- Max file size: **1 MB** (suitable for Vercel serverless limits)

## Validation

### Audio upload

Shared rules live in [`src/lib/validate-audio-upload.ts`](src/lib/validate-audio-upload.ts). Validation runs when a file is selected (client) and again on the API route (server):

1. **Type** — extension in `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm` or matching MIME type (`audio/mpeg`, `audio/mp4`, `video/mp4`, `audio/x-m4a`, `audio/wav`, `audio/wave`, `audio/x-wav`, `audio/webm`, `video/webm`)
2. **Size** — 5 MB (on device) or 1 MB (server mode)

### YouTube URL

Client validation runs when the user confirms the video:

1. **Non-empty** — a URL must be provided
2. **Recognized host/path** — `youtube.com`, `youtu.be`, and common variants
3. **Video ID** — 11-character YouTube video ID extracted from the link
4. **Duration** — fetched from `POST /api/youtube-info`; download and transcribe are blocked when the video is longer than 1 minute

Server validation runs on YouTube API routes:

1. **Video ID format** — must match the 11-character pattern
2. **Download size** — downloaded media must be ≤ 100 MB
3. **Transcription audio size** — downloaded audio must be ≤ 25 MB and in an OpenAI-supported format

## Privacy and performance

| | On device | Server (OpenAI) |
|--|-----------|-----------------|
| Audio leaves browser | No | Yes |
| API key required | No | Yes |
| Model download | ~40 MB to browser (once) | None on client |
| Best for | Privacy, no API cost | Weaker devices, faster setup |

Keep the tab open while transcription runs.

## Deploying to Vercel

1. Deploy the Next.js app as usual.
2. Add `OPENAI_API_KEY` in Vercel environment variables.
3. On-device mode works without any server configuration.
4. Server mode uses the API route; ensure the **1 MB** upload limit is respected.

## Configuration notes

[`next.config.ts`](next.config.ts) includes:

- `turbopack: {}` — required for Next.js 16 builds when a custom `webpack` config is present
- `webpack` aliases — excludes Node-only packages from browser bundles
- `serverExternalPackages` — keeps `@huggingface/transformers` and `youtube-dl-exec` external on the server

## License

Private project.
