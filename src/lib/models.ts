import {
  MAX_SERVER_UPLOAD_LABEL,
  MAX_UPLOAD_LABEL,
  type TranscriptionMode,
} from "@/lib/upload-constants";
import { getSupportedFormatsLabel } from "@/lib/validate-audio-upload";

export type ModelId = "on-device" | "server";

export type ModelConfig = {
  id: ModelId;
  transcriptionMode: TranscriptionMode;
  title: string;
  subtitle: string;
  summary: string;
  modelName: string;
  maxUploadLabel: string;
  capabilities: string[];
  pros: string[];
  cons: string[];
  href: string;
};

export const MODELS: ModelConfig[] = [
  {
    id: "on-device",
    transcriptionMode: "browser",
    title: "Whisper Tiny (On device)",
    subtitle: "Run Whisper Tiny entirely in your browser via Transformers.js.",
    summary: "Private, no API key — audio never leaves your device.",
    modelName: "Xenova/whisper-tiny",
    maxUploadLabel: MAX_UPLOAD_LABEL,
    capabilities: [
      `Audio upload with client-side validation (${getSupportedFormatsLabel()}; max ${MAX_UPLOAD_LABEL})`,
      "Speech-to-text transcription in a Web Worker",
      "Background model preload on page load (~40 MB, cached after first use)",
      "Progress tracking for model download, decode, and transcription",
    ],
    pros: [
      "Audio stays on your device — no server upload",
      "No API key or per-request cost",
      "Works offline after the model is cached",
      "Larger file limit (5 MB)",
    ],
    cons: [
      "Initial model download (~40 MB) on first visit",
      "Slower on low-end devices",
      "Lower accuracy than larger Whisper models",
      "Requires keeping the tab open during transcription",
    ],
    href: "/transcribe/on-device",
  },
  {
    id: "server",
    transcriptionMode: "server",
    title: "OpenAI Whisper (Server)",
    subtitle: "Upload audio to your server, transcribed by OpenAI's Whisper API.",
    summary: "Faster setup on weak devices — requires an OpenAI API key.",
    modelName: "whisper-1",
    maxUploadLabel: MAX_SERVER_UPLOAD_LABEL,
    capabilities: [
      `Audio upload with client-side validation (${getSupportedFormatsLabel()}; max ${MAX_SERVER_UPLOAD_LABEL})`,
      "Server-side transcription via OpenAI Audio API",
      "Upload progress tracking with XHR",
      "Returns plain-text transcript",
    ],
    pros: [
      "No model download in the browser",
      "Offloads inference to OpenAI's infrastructure",
      "Generally higher accuracy than Whisper Tiny",
      "Works well on weaker client devices",
    ],
    cons: [
      "Audio is sent to your server, then to OpenAI",
      "Requires OPENAI_API_KEY in environment",
      "Per-request API cost",
      "Smaller file limit (1 MB) for serverless compatibility",
    ],
    href: "/transcribe/server",
  },
];

const MODEL_BY_ID = new Map(MODELS.map((model) => [model.id, model]));

export function isValidModelId(id: string): id is ModelId {
  return MODEL_BY_ID.has(id as ModelId);
}

export function getModelById(id: string): ModelConfig | undefined {
  if (!isValidModelId(id)) return undefined;
  return MODEL_BY_ID.get(id);
}
