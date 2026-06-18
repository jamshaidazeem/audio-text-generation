# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
nvm use                  # switch to pinned Node v22.12.0 (see .nvmrc)
npm install              # install dependencies
npm run dev              # start dev server with Turbopack
npm run dev:webpack      # start dev server with Webpack (use if Turbopack fails to bundle the worker)
npm run build            # production build
npm run lint             # run ESLint
```

There are no automated tests. Verification is manual — run the dev server and exercise the feature in a browser.

## Architecture

### Transcription modes

The app has three independent transcription paths:

1. **On-device** (`/transcribe/on-device`) — audio decoded in-browser via `AudioContext`, then sent to a Web Worker (`src/workers/whisper.worker.ts`) which runs `Xenova/whisper-tiny` via `@huggingface/transformers`. The worker is long-lived: the model is preloaded on page mount and stays in memory across files. Audio is chunked at 30-second intervals and processed sequentially.

2. **Server / OpenAI** (`/transcribe/server`) — file uploaded via XHR to `POST /api/transcribe`. The route reads a `model` field from FormData, validates it against `OPENAI_TRANSCRIPTION_MODELS` in `src/lib/models.ts`, and calls `transcribeWithOpenAI()` in `src/lib/transcribe-openai.ts`. The UI shows a pill-style model selector (Whisper 1 / GPT-4o Transcribe).

3. **YouTube → Text** (`/youtube-text`) — `POST /api/transcribe-youtube` runs `yt-dlp` (via `youtube-dl-exec`) server-side to extract audio, then passes the file to `transcribeWithOpenAI()`. The same model selector appears on this page. **Requires Python 3.9+ and yt-dlp on PATH — does not work in serverless environments.**

### Data flow per path

```
On-device:  File → AudioContext.decodeAudioData → Float32Array → Worker → Transformers.js
Server:     File → XHR FormData (+ model field) → /api/transcribe → OpenAI Audio API
YouTube:    videoId + model → /api/transcribe-youtube → yt-dlp → OpenAI Audio API
```

### Key config locations

- **Model list** (`src/lib/models.ts`) — `MODELS` array drives the home page cards and per-model pages. `OPENAI_TRANSCRIPTION_MODELS` drives the server-side model selector; adding a new OpenAI model here is sufficient to surface it in the UI.
- **Limits** (`src/lib/upload-constants.ts`) — all upload and YouTube duration caps in one place.
- **OpenAI wrapper** (`src/lib/transcribe-openai.ts`) — single function called by both server routes; accepts an optional `model` param (defaults to `whisper-1`).

### Hooks

Each transcription path has a dedicated hook that owns status state:

| Hook | States |
|---|---|
| `useWhisperTranscription` | `idle → loading_model → decoding → transcribing → done / error` |
| `useServerTranscription` | `idle → uploading → transcribing → done / error` |
| `useYouTubeTranscription` | `idle → extracting → transcribing → done / error` |

`useServerTranscription.transcribe(file, model?)` and `useYouTubeTranscription.transcribe(videoId, model?)` both accept an optional model string that is forwarded to the API.

### next.config.ts notes

- `serverExternalPackages` keeps `@huggingface/transformers` and `youtube-dl-exec` out of the Next.js server bundle (they must run as real Node modules).
- `webpack.resolve.alias` stubs `sharp` and `onnxruntime-node` to prevent them from being bundled client-side.
- `turbopack: {}` is required alongside the custom `webpack` config in Next.js 16.

### In-app docs

`/docs` is a server component that reads `README.md` from disk at render time (`fs.readFileSync(process.cwd(), 'README.md')`) and passes it to `MarkdownRenderer`. Keep README.md in sync with code changes — it is the single source of truth shown to users.
