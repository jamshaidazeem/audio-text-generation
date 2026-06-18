# Audio Text Generation

A Next.js app for turning audio into text. Upload audio files or use a YouTube link to preview a video, download the file, or generate a transcript. Supports **on-device** transcription with Whisper Tiny ([Transformers.js](https://huggingface.co/docs/transformers.js)) or **server** transcription via the OpenAI Audio API — choose between **Whisper 1** and **GPT-4o Transcribe** for server-side jobs.

## Features

- **Model explorer home page** — choose between transcription backends before uploading
- **YouTube → Text** — preview a video, download the file, or transcribe to text (local dev; max **15 min** for download and transcribe)
- **Per-model pages** — capabilities, pros/cons, and model comparison table for each backend, plus a dedicated upload UI
- **In-app documentation** — full README rendered at `/docs`, linked from the home page
- Audio file picker (mp3, mp4, mpeg, mpga, m4a, wav, webm)
- Client-side validation for file type and size
- **Three transcription backends:**
  - **On device** — Whisper Tiny in the browser (private, max **25 MB**)
  - **Server — Whisper 1** — upload to API route, transcribed by OpenAI `whisper-1` (max **25 MB**)
  - **Server — GPT-4o Transcribe** — same pipeline using `gpt-4o-transcribe` for higher accuracy (max **25 MB**)
- Model selector on server transcription and YouTube pages — choose between Whisper 1 and GPT-4o Transcribe per job
- Background model preload in on-device mode
- Progress bars for model download, upload, decode, and transcription
- Web Worker inference for on-device mode
- Clear button resets file and transcript (keeps loaded browser model in memory)
- Reusable UI primitives (`Card`, `Button`, `ProgressBar`, etc.) shared across pages

## Routes

| Route | Description |
| ----- | ----------- |
| `/` | Home — model explorer, YouTube → Text, and Docs entry points |
| `/transcribe/on-device` | Whisper Tiny in-browser transcription |
| `/transcribe/server` | OpenAI server transcription — model selector for Whisper 1 or GPT-4o Transcribe |
| `/youtube-text` | YouTube URL input, preview, download, and transcription UI with model selector |
| `/docs` | In-app documentation — README rendered as styled markdown |
| `POST /api/transcribe` | Server API route — accepts `file` and optional `model` field in FormData |
| `POST /api/youtube-info` | Fetch YouTube video duration (metadata only) |
| `POST /api/download-youtube` | Download YouTube media via yt-dlp and return the file |
| `POST /api/transcribe-youtube` | Download YouTube audio with yt-dlp and transcribe via OpenAI — accepts optional `model` in JSON body |

Invalid model routes (e.g. `/transcribe/invalid`) return a 404.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) with React Compiler enabled
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Whisper Tiny in-browser)
- [OpenAI Node SDK](https://github.com/openai/openai-node) (server mode)
- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec) (YouTube audio download via yt-dlp)
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) (in-app docs renderer)
- [ESLint](https://eslint.org)

## Setup

### Prerequisites

| Requirement | Details |
| ----------- | ------- |
| Node.js | **20.9+** (this repo pins **v22.12.0** — see [`.nvmrc`](.nvmrc)) |
| Python | **3.9+** as `python3` on PATH — needed for YouTube preview, download, and transcription (yt-dlp runs inside the Next.js server process) |
| OpenAI API key | Required only for **server transcription** and **YouTube → Text transcription** (see below) |

Switch to the pinned Node version:

```bash
nvm use
```

### Install dependencies

```bash
npm install
```

### Environment variables

Copy the template:

```bash
cp env.example .env.local
```

Open `.env.local` and fill in your key:

```env
# Required for server (OpenAI) transcription mode and YouTube → Text transcription
OPENAI_API_KEY=sk-...
```

> Leave `OPENAI_API_KEY` blank or omit `.env.local` entirely if you only plan to use **on-device** transcription or YouTube **preview / download**.

### Creating an OpenAI API key

1. Go to [platform.openai.com](https://platform.openai.com) and sign in (or create a free account).
2. Open **Dashboard → API keys** (`platform.openai.com/api-keys`).
3. Click **Create new secret key**, give it a name, and copy the value — it starts with `sk-`.
4. Paste it into `.env.local` as `OPENAI_API_KEY=sk-...`.
5. Make sure your account has a positive credit balance (**Settings → Billing**). Audio API calls are pay-per-use; free-tier accounts must add a payment method.

The key is used server-side only (`POST /api/transcribe` and `POST /api/transcribe-youtube`). It is never sent to the browser.

### Enabling models in your OpenAI project

API keys belong to a **project**. Projects have an **allowed-models** list that controls which models the key can call. Both transcription models must be enabled.

1. Open [platform.openai.com/settings](https://platform.openai.com/settings) and select your project from the left sidebar.
2. Go to **Settings → Limits**.
3. Under **Model usage → Allowed models**, click **Edit**.
4. Search for and enable both:
   - `whisper-1`
   - `gpt-4o-transcribe`
5. Save. Changes take effect immediately.

> If `gpt-4o-transcribe` does not appear in the list, your organization tier may not have access yet. You can still use the app with `whisper-1` — the model selector on the server transcription and YouTube pages defaults to Whisper 1.

### What works with and without the key

| Feature | No API key | With API key |
| ------- | ---------- | ------------ |
| On-device transcription (`/transcribe/on-device`) | Works — Whisper Tiny runs entirely in your browser | Works (key is ignored) |
| YouTube preview | Works | Works |
| YouTube download | Works | Works |
| Server transcription (`/transcribe/server`) | Error — key required | Works |
| YouTube transcription | Error — key required | Works |

**Short version:** on-device transcription and YouTube preview/download need no key. A key is only required when audio is sent to OpenAI.

### Estimated API cost

OpenAI charges for audio transcription by the minute of audio processed (rounded up to the nearest second).

| Model | Rate |
| ----- | ---- |
| `whisper-1` | **$0.006 / minute** |
| `gpt-4o-transcribe` | **$0.006 / minute** |

Typical examples at current pricing:

| Audio length | Estimated cost (either model) |
| ------------ | ----------------------------- |
| 1 minute | ~$0.006 |
| 5 minutes | ~$0.03 |
| 10 minutes | ~$0.06 |
| 15 minutes (YouTube max) | ~$0.09 |

Costs are per transcription call. Check [OpenAI pricing](https://openai.com/api/pricing) for the latest rates — the figures above are approximate and may change.

On-device mode (Whisper Tiny in the browser) has **zero API cost**.

### Run the development server

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
│   ├── api/transcribe/route.ts         # OpenAI transcription — reads model from FormData
│   ├── api/download-youtube/route.ts   # YouTube media download
│   ├── api/transcribe-youtube/route.ts # YouTube audio download + OpenAI transcription (model from JSON body)
│   ├── api/youtube-info/route.ts       # YouTube video metadata (duration)
│   ├── docs/page.tsx                   # In-app docs — reads README.md and renders via MarkdownRenderer
│   ├── transcribe/[mode]/page.tsx      # Per-model info + upload UI
│   ├── youtube-text/page.tsx           # YouTube preview, download, and transcription UI
│   ├── layout.tsx
│   ├── page.tsx                        # Home — model explorer, YouTube → Text, Docs
│   └── globals.css
├── components/
│   ├── ui/                             # Shared primitives (Card, Button, ProgressBar, …)
│   ├── BackLink.tsx
│   ├── FeatureCard.tsx                 # Home-page feature card
│   ├── MarkdownRenderer.tsx            # Client component — renders markdown with styled elements
│   ├── ModelCard.tsx                   # Home-page model card
│   ├── ModelInfo.tsx                   # Capabilities, pros, cons + server model comparison table
│   ├── TranscriptionUploader.tsx       # Upload UI, model selector (server mode only), and progress
│   └── YouTubeUrlInput.tsx             # YouTube URL validation, preview, download, and transcription UI with model selector
├── hooks/
│   ├── useWhisperTranscription.ts      # On-device worker transcription
│   ├── useServerTranscription.ts       # Server upload + API call (accepts model param)
│   ├── useYouTubeDownload.ts           # YouTube download via API
│   └── useYouTubeTranscription.ts      # YouTube URL transcription via API (accepts model param)
├── lib/
│   ├── audio.ts
│   ├── download-youtube-media.ts       # yt-dlp raw media download (server only)
│   ├── extract-youtube-audio.ts        # yt-dlp native audio download for transcription (server only)
│   ├── get-youtube-video-info.ts       # yt-dlp metadata (duration)
│   ├── format-bytes.ts
│   ├── models.ts                       # Model metadata, OPENAI_TRANSCRIPTION_MODELS, routes, and config
│   ├── transcribe-openai.ts            # Shared OpenAI Audio API helper (accepts model param)
│   ├── upload-constants.ts             # Upload limits per mode
│   ├── validate-audio-upload.ts        # Shared audio format validation
│   ├── validate-youtube-url.ts         # YouTube URL parsing and validation
│   ├── youtube-constants.ts            # YouTube duration and file size limits
│   ├── youtube-errors.ts               # Step-based YouTube pipeline errors
│   └── whisper-types.ts
└── workers/
    └── whisper.worker.ts
```

Model metadata (titles, capabilities, pros, cons, and route mapping) lives in [`src/lib/models.ts`](src/lib/models.ts). The OpenAI model list (`OPENAI_TRANSCRIPTION_MODELS`) is also defined there — adding a third server-side model means updating that constant and the selector picks it up automatically.

## YouTube → Text (`/youtube-text`)

Preview a YouTube video, download the file, or generate a text transcript. **Local dev only** for now — yt-dlp runs inside the Next.js server process.

These are standalone actions on the same page: preview, download, and transcribe do not depend on one another.

**Preview**

1. Enter a YouTube URL (`watch`, `youtu.be`, `shorts`, `embed`, and `m.youtube.com` links)
2. Client-side validation via [`src/lib/validate-youtube-url.ts`](src/lib/validate-youtube-url.ts)
3. Confirm the video to load an embedded preview
4. `POST /api/youtube-info` fetches duration via yt-dlp ([`src/lib/get-youtube-video-info.ts`](src/lib/get-youtube-video-info.ts))
5. Videos longer than **15 minutes** show a warning; download and transcribe are disabled

**Download**

1. Confirm a video that is **15 minutes or shorter**
2. `POST /api/download-youtube` downloads media with yt-dlp ([`src/lib/download-youtube-media.ts`](src/lib/download-youtube-media.ts)) and returns the file to the browser
3. Does not require `OPENAI_API_KEY`

**Transcribe**

1. Confirm a video that is **15 minutes or shorter**
2. Choose a transcription model — **Whisper 1** or **GPT-4o Transcribe** — using the selector above the action buttons (defaults to Whisper 1)
3. `POST /api/transcribe-youtube` downloads native audio with yt-dlp ([`src/lib/extract-youtube-audio.ts`](src/lib/extract-youtube-audio.ts)) — typically `.m4a` or `.webm`, without re-encoding to MP3
4. Downloaded audio is validated against the same [OpenAI-supported formats](https://platform.openai.com/docs/guides/speech-to-text) as file upload, then transcribed via [`src/lib/transcribe-openai.ts`](src/lib/transcribe-openai.ts) using the selected model
5. Requires `OPENAI_API_KEY` and both models enabled in your OpenAI project

**Limits:**

| Action | Max duration | Max file size |
| ------ | ------------ | ------------- |
| Preview | — | — |
| Download | 15 minutes | 500 MB |
| Transcribe | 15 minutes | 25 MB (downloaded audio; OpenAI Audio API limit) |

Step-specific error messages cover URL validation, download, file read, and transcription failures.

**Not supported yet:** on-device browser Whisper for YouTube (audio cannot be downloaded in the browser). Vercel/serverless deployment requires a separate media-extraction service.

## Transcription models

### On device (`/transcribe/on-device`)

- Uses `Xenova/whisper-tiny` in a Web Worker
- Model preloads on page load
- Audio stays in the browser; only model weights are downloaded from Hugging Face (~40 MB, cached after first use)
- Accepts the same formats as server upload (mp3, mp4, mpeg, mpga, m4a, wav, webm); decoding uses the browser's `AudioContext` — **mp3** and **wav** are the most reliable if another format fails
- Max file size: **25 MB**

### OpenAI model comparison

| | `whisper-1` | `gpt-4o-transcribe` |
|--|-------------|---------------------|
| **Architecture** | Whisper (encoder-decoder) | GPT-4o audio |
| **Accuracy** | Good | Higher — better on accents, background noise, and technical vocabulary |
| **Punctuation & formatting** | Basic | More natural, better capitalisation |
| **Language support** | 57+ languages | 57+ languages |
| **Price** | $0.006 / min | $0.006 / min |
| **Project access** | Must be enabled in OpenAI project settings | Must be enabled in OpenAI project settings |
| **Best for** | General use, wide compatibility | Higher-quality transcripts where accuracy matters |

### Server / OpenAI (`/transcribe/server`)

- Uploads audio to `POST /api/transcribe`
- A pill-style model selector lets you choose **Whisper 1** (`whisper-1`) or **GPT-4o Transcribe** (`gpt-4o-transcribe`) before transcribing; defaults to Whisper 1
- A side-by-side comparison table on the page covers architecture, accuracy, punctuation, price, and access requirements to help you pick
- Accepts [OpenAI audio input formats](https://platform.openai.com/docs/guides/speech-to-text): mp3, mp4, mpeg, mpga, m4a, wav, webm
- Requires `OPENAI_API_KEY` in environment (local: `.env.local`, Vercel: Project Settings → Environment Variables)
- Both models must be enabled in your OpenAI project (see [Enabling models](#enabling-models-in-your-openai-project))
- File is sent to your server, then to OpenAI
- Max file size: **25 MB**

## In-app documentation (`/docs`)

The full contents of this README are rendered as styled markdown at `/docs`. It is linked from the home page under the **More** section. The page is a Next.js server component that reads `README.md` from disk at render time — no build step required. Updating this file is sufficient to keep the in-app docs in sync.

## Validation

### File upload

Shared rules live in [`src/lib/validate-audio-upload.ts`](src/lib/validate-audio-upload.ts). Validation runs when a file is selected (client) and again on the API route (server):

1. **Type** — extension in `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm` or matching MIME type (`audio/mpeg`, `audio/mp4`, `video/mp4`, `audio/x-m4a`, `audio/wav`, `audio/wave`, `audio/x-wav`, `audio/webm`, `video/webm`)
2. **Size** — 25 MB (on device and server mode)

### YouTube URL

Client validation runs when the user confirms the video:

1. **Non-empty** — a URL must be provided
2. **Recognized host/path** — `youtube.com`, `youtu.be`, and common variants
3. **Video ID** — 11-character YouTube video ID extracted from the link
4. **Duration** — fetched from `POST /api/youtube-info`; download and transcribe are blocked when the video is longer than 15 minutes

Server validation runs on YouTube API routes:

1. **Video ID format** — must match the 11-character pattern
2. **Download size** — downloaded media must be ≤ 500 MB
3. **Transcription audio size** — downloaded audio must be ≤ 25 MB and in an OpenAI-supported format

## Privacy and performance

| | On device | Server (OpenAI) |
|--|-----------|-----------------|
| Audio leaves browser | No | Yes |
| API key required | No | Yes |
| Model download | ~40 MB to browser (once) | None on client |
| Best for | Privacy, no API cost | Weaker devices, faster setup |

Keep the tab open while transcription runs.

## Deployment

### Why Vercel is not suitable for this app

Vercel's serverless architecture has several hard constraints that conflict with this app's requirements:

| Constraint | Vercel Hobby | Impact |
|---|---|---|
| **Execution time limit** | 300 seconds hard cap | YouTube audio extraction + OpenAI transcription can take 30–120 s; no headroom for retries or slow networks |
| **System binaries** | Cannot install arbitrary binaries | `yt-dlp` requires a real OS environment with Python 3.9+ on PATH — not available in Vercel's sandbox |
| **Python runtime** | Separate function type, 500 MB bundle limit | `yt-dlp` + `ffmpeg` dependencies push against bundle limits and inflate cold-start time |
| **Ephemeral filesystem** | Writable `/tmp` with constrained space | `yt-dlp` downloads audio to disk before passing it to OpenAI; tight `/tmp` space risks failures on larger files |
| **Cold starts** | Every function invocation can cold-start | Long-running downloads are especially sensitive to startup overhead |

**Bottom line:** on-device transcription (`/transcribe/on-device`) would work on Vercel since it runs entirely in the browser. Everything that touches `yt-dlp` — YouTube preview, download, and transcription — requires a persistent server process with a real OS, and is **not deployable on Vercel**.

---

### Recommended platforms

#### 1. AWS Lightsail — best for budget simplicity

A flat-rate virtual private server (VPS). You get full OS access, install Node, Python, and yt-dlp yourself, and there are no execution time limits.

**Minimum recommended plan:** `$10/month` — 2 GB RAM, 2 vCPUs, 60 GB SSD, 3 TB transfer

> The $5/month plan (1 GB RAM) can run the app at runtime but may struggle during `npm run build`. Build on the $10 plan and downgrade after, or build locally and deploy the output.

**Why it fits this app:**
- Full control over the OS — install `python3`, `yt-dlp`, `ffmpeg` with `apt`
- No execution time limits — a 90-second YouTube extraction + transcription job completes without issue
- Predictable flat monthly cost — no per-request billing surprises
- Persistent filesystem — yt-dlp can write temp audio files without constraint

**Trade-off:** You manage OS updates, Node version, and process management (e.g. PM2) yourself.

**Quick setup sketch:**
```bash
# On the Lightsail instance
sudo apt update && sudo apt install -y python3 python3-pip ffmpeg
pip3 install yt-dlp
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
# clone repo, npm install, npm run build, pm2 start
```

---

#### 2. Fly.io — best for container-native production

Fly runs Docker containers on persistent micro-VMs globally. No execution time limits, full system dependency support via Dockerfile, and pay-per-use pricing.

**Minimum realistic cost:** ~$10–15/month (1 shared vCPU, 1 GB RAM, 10 GB volume, dedicated IPv4)

**Why it fits this app:**
- Dockerfile installs `python3`, `yt-dlp`, and `ffmpeg` — no platform restrictions
- No execution time limits on running containers
- Persistent volumes for `/tmp` staging of yt-dlp downloads
- Global regions — lower latency for international users

**Trade-off:** Requires Docker knowledge. Root filesystem resets on redeploy — yt-dlp updates must go in the Dockerfile, not installed ad hoc.

**Dockerfile addition needed:**
```dockerfile
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg \
  && pip3 install yt-dlp
```

---

#### 3. Render — best managed middle ground

Render runs Docker-based web services with a simple Git-push deploy workflow. No execution time limits, full system dependency support, and no infrastructure management.

**Minimum cost:** $7/month (Starter web service — 512 MB RAM, 0.5 CPU)

> For comfortable operation use the **$25/month Standard plan** (2 GB RAM, 1 CPU) — the Starter plan may be tight under concurrent requests.

**Why it fits this app:**
- Docker support means yt-dlp + Python install exactly as on Lightsail
- No execution time limits on standard services
- Git-push deploys — simpler than managing a VPS
- Built-in environment variable management, health checks, and auto-deploys

**Trade-off:** More expensive than Lightsail for equivalent RAM. Free tier for static sites only — dynamic services require a paid plan.

---

### Platform comparison

| | AWS Lightsail | Fly.io | Render |
|---|---|---|---|
| **Starting cost** | $10/month (recommended) | ~$10–15/month | $7–25/month |
| **yt-dlp support** | ✅ Full (install via apt) | ✅ Full (Dockerfile) | ✅ Full (Dockerfile) |
| **Execution time limit** | None | None | None |
| **OS/binary access** | Full (SSH to server) | Full (via Dockerfile) | Full (via Dockerfile) |
| **Deployment model** | Manual VPS (SSH + PM2) | Docker + `flyctl` CLI | Git push or Docker |
| **Infra management** | You manage it | Minimal | None |
| **Best for** | Budget, full control | Production, global edge | Simplest managed deploy |

### Environment variables

Whichever platform you use, set `OPENAI_API_KEY` as an environment variable (not in a committed file):

```env
OPENAI_API_KEY=sk-...
```

### Upload size

Ensure your reverse proxy or load balancer allows at least **25 MB** request bodies. For nginx:

```nginx
client_max_body_size 30M;
```

## Configuration notes

[`next.config.ts`](next.config.ts) includes:

- `turbopack: {}` — required for Next.js 16 builds when a custom `webpack` config is present
- `webpack` aliases — excludes Node-only packages from browser bundles
- `serverExternalPackages` — keeps `@huggingface/transformers` and `youtube-dl-exec` external on the server

## License

Private project.
