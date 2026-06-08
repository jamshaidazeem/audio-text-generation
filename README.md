# Audio Text Generation

A Next.js app for uploading MP3 audio and transcribing it to text. Supports **on-device** transcription with Whisper Tiny ([Transformers.js](https://huggingface.co/docs/transformers.js)) or **server** transcription via the [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text).

## Features

- MP3 file picker with `accept="audio/mpeg,.mp3"`
- Client-side validation for file type and size
- **Two transcription modes:**
  - **On device** — Whisper Tiny in the browser (private, max **5 MB**)
  - **Server (OpenAI)** — upload to API route, transcribed by OpenAI (max **1 MB**)
- Background model preload in on-device mode
- Progress bars for model download, upload, decode, and transcription
- Web Worker inference for on-device mode
- Clear button resets file and transcript (keeps loaded browser model in memory)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) with React Compiler enabled
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Whisper Tiny in-browser)
- [OpenAI Node SDK](https://github.com/openai/openai-node) (server mode)
- [ESLint](https://eslint.org)

## Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- This repo pins **v22.12.0** in [`.nvmrc`](.nvmrc)
- **Server mode only:** an OpenAI API key with access to the Audio API

```bash
nvm use
```

## Getting started

Install dependencies:

```bash
npm install
```

Copy the environment template and add your OpenAI key (required for server mode):

```bash
cp .env.example .env.local
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
│   ├── api/transcribe/route.ts # OpenAI Whisper API (server mode)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── UploadMp3.tsx           # Upload UI, mode toggle, progress bars
├── hooks/
│   ├── useWhisperTranscription.ts  # On-device worker transcription
│   └── useServerTranscription.ts   # Server upload + API call
├── lib/
│   ├── audio.ts
│   ├── upload-constants.ts     # Upload limits per mode
│   ├── validate-mp3.ts         # Shared MP3 validation
│   └── whisper-types.ts
└── workers/
    └── whisper.worker.ts
```

## Transcription modes

### On device (default)

- Uses `Xenova/whisper-tiny` in a Web Worker
- Model preloads on page load
- Audio stays in the browser; only model weights are downloaded from Hugging Face (~40 MB, cached after first use)
- Max file size: **5 MB**

### Server (OpenAI)

- Uploads MP3 to `POST /api/transcribe`
- Server calls OpenAI `whisper-1` and returns `{ text }`
- Requires `OPENAI_API_KEY` in environment (local: `.env.local`, Vercel: Project Settings → Environment Variables)
- Audio is sent to your server, then to OpenAI
- Max file size: **1 MB** (suitable for Vercel serverless limits)

## Upload validation

Validation runs when a file is selected (client) and again on the API route (server):

1. **Type** — `.mp3` extension or `audio/mpeg` MIME type
2. **Size** — 5 MB (on device) or 1 MB (server mode)

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
- `serverExternalPackages` — keeps `@huggingface/transformers` external on the server

## License

Private project.
