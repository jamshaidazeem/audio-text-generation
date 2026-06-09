# Audio Text Generation

A Next.js app for turning audio into text. Upload MP3 files or paste a YouTube link to transcribe video audio. Supports **on-device** transcription with Whisper Tiny ([Transformers.js](https://huggingface.co/docs/transformers.js)) or **server** transcription via the [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text).

## Features

- **Model explorer home page** — choose between transcription backends before uploading
- **YouTube → Text** — paste a YouTube URL, confirm the video, and transcribe its audio via OpenAI (local dev, max **1 min**)
- **Per-model pages** — capabilities, pros, and cons for each backend, plus a dedicated upload UI
- MP3 file picker with `accept="audio/mpeg,.mp3"`
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
| `/youtube-text` | YouTube URL input, video confirmation, and transcription UI |
| `POST /api/transcribe` | Server API route (used by server MP3 mode) |
| `POST /api/transcribe-youtube` | Extract YouTube audio with yt-dlp and transcribe via OpenAI |

Invalid model routes (e.g. `/transcribe/invalid`) return a 404.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) with React Compiler enabled
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Whisper Tiny in-browser)
- [OpenAI Node SDK](https://github.com/openai/openai-node) (server mode)
- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec) (YouTube audio extraction via yt-dlp)
- [ESLint](https://eslint.org)

## Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- This repo pins **v22.12.0** in [`.nvmrc`](.nvmrc)
- **Server mode and YouTube → Text:** an OpenAI API key with access to the Audio API
- **YouTube → Text (local dev):** Python **3.9+** as `python3` on your PATH (`youtube-dl-exec` uses it to run yt-dlp)

```bash
nvm use
```

## Getting started

Install dependencies:

```bash
npm install
```

Copy the environment template and add your OpenAI key (required for server mode and YouTube → Text):

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

Open [http://localhost:3000](http://localhost:3000) in your browser. Pick a transcription model and upload an MP3, or open **YouTube → Text** to paste a link, confirm the video, and transcribe.

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
│   ├── api/transcribe/route.ts         # OpenAI Whisper API (server MP3 mode)
│   ├── api/transcribe-youtube/route.ts # YouTube audio extraction + OpenAI transcription
│   ├── transcribe/[mode]/page.tsx      # Per-model info + upload UI
│   ├── youtube-text/page.tsx           # YouTube URL input and transcription UI
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
│   └── YouTubeUrlInput.tsx             # YouTube URL validation, preview, and transcription UI
├── hooks/
│   ├── useWhisperTranscription.ts      # On-device worker transcription
│   ├── useServerTranscription.ts       # Server upload + API call
│   └── useYouTubeTranscription.ts      # YouTube URL transcription via API
├── lib/
│   ├── audio.ts
│   ├── extract-youtube-audio.ts        # yt-dlp audio extraction (server only)
│   ├── format-bytes.ts
│   ├── models.ts                       # Model metadata, routes, and config
│   ├── transcribe-openai.ts            # Shared OpenAI Whisper helper
│   ├── upload-constants.ts             # Upload limits per mode
│   ├── validate-mp3.ts                 # Shared MP3 validation
│   ├── validate-youtube-url.ts         # YouTube URL parsing and validation
│   ├── youtube-constants.ts            # YouTube duration and audio size limits
│   ├── youtube-errors.ts               # Step-based YouTube pipeline errors
│   └── whisper-types.ts
└── workers/
    └── whisper.worker.ts
```

Model metadata (titles, capabilities, pros, cons, and route mapping) lives in [`src/lib/models.ts`](src/lib/models.ts). Adding a third model is config-driven: extend `MODELS` and the corresponding hook/uploader wiring.

## YouTube → Text (`/youtube-text`)

Paste a YouTube URL, confirm the video, and transcribe its audio into text via OpenAI Whisper. **Local dev only** for now — yt-dlp runs inside the Next.js server process.

**Flow:**

1. Enter a YouTube URL (`watch`, `youtu.be`, `shorts`, `embed`, and `m.youtube.com` links)
2. Client-side validation via [`src/lib/validate-youtube-url.ts`](src/lib/validate-youtube-url.ts)
3. Embedded player confirms the video you intend to transcribe
4. `POST /api/transcribe-youtube` extracts audio with yt-dlp ([`src/lib/extract-youtube-audio.ts`](src/lib/extract-youtube-audio.ts)) and transcribes via [`src/lib/transcribe-openai.ts`](src/lib/transcribe-openai.ts)

**Limits:**

- Max video duration: **1 minute**
- Max extracted audio size: **25 MB** (OpenAI Whisper API limit)
- Requires `OPENAI_API_KEY`
- Step-specific error messages for URL validation, download, file read, and transcription failures

**Not supported yet:** on-device browser Whisper for YouTube (audio cannot be downloaded in the browser). Vercel/serverless deployment requires a separate audio-extraction service.

## Transcription models

### On device (`/transcribe/on-device`)

- Uses `Xenova/whisper-tiny` in a Web Worker
- Model preloads on page load
- Audio stays in the browser; only model weights are downloaded from Hugging Face (~40 MB, cached after first use)
- Max file size: **5 MB**

### Server / OpenAI (`/transcribe/server`)

- Uploads MP3 to `POST /api/transcribe`
- Server calls OpenAI `whisper-1` and returns `{ text }`
- Requires `OPENAI_API_KEY` in environment (local: `.env.local`, Vercel: Project Settings → Environment Variables)
- Audio is sent to your server, then to OpenAI
- Max file size: **1 MB** (suitable for Vercel serverless limits)

## Validation

### MP3 upload

Validation runs when a file is selected (client) and again on the API route (server):

1. **Type** — `.mp3` extension or `audio/mpeg` MIME type
2. **Size** — 5 MB (on device) or 1 MB (server mode)

### YouTube URL

Client validation runs when the user confirms the video:

1. **Non-empty** — a URL must be provided
2. **Recognized host/path** — `youtube.com`, `youtu.be`, and common variants
3. **Video ID** — 11-character YouTube video ID extracted from the link

Server validation runs on `POST /api/transcribe-youtube`:

1. **Video ID format** — must match the 11-character pattern
2. **Duration** — yt-dlp `--match-filter` rejects videos over 1 minute
3. **Audio size** — extracted MP3 must be ≤ 25 MB

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
