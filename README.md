# Audio Text Generation

A Next.js app for uploading audio and (eventually) generating text from it. The current UI lets you select an MP3 file, validates it client-side, and displays file metadata before any processing step.

## Features

- MP3 file picker with `accept="audio/mpeg,.mp3"`
- Client-side validation for file type and size
- Max upload size: **25 MB**
- Displays file name, extension, and size (human-readable and bytes)
- Clear button to reset the selection

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) with React Compiler enabled
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Serve production build   |
| `npm run lint` | Run ESLint               |

## Project structure

```
src/
├── app/
│   ├── layout.tsx    # Root layout and metadata
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles (Tailwind)
└── components/
    └── UploadMp3.tsx # MP3 upload UI and validation
```

## Upload validation

Validation runs in the browser when a file is selected:

1. **Type** — filename must end with `.mp3` (case-insensitive), or MIME type must be `audio/mpeg` when provided by the browser
2. **Size** — file must be 25 MB or smaller

Invalid files show an error message and the selection is cleared so the same file can be chosen again.

## License

Private project.
