import {
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";

import type { WhisperWorkerRequest } from "@/lib/whisper-types";

const MODEL_ID = "Xenova/whisper-tiny";
const SAMPLE_RATE = 16_000;
const CHUNK_DURATION_S = 30;
const CHUNK_SAMPLES = SAMPLE_RATE * CHUNK_DURATION_S;

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let loading: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function extractText(result: unknown): string {
  if (typeof result === "object" && result !== null && "text" in result) {
    return String(result.text).trim();
  }

  return "";
}

async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) {
    return transcriber;
  }

  if (!loading) {
    loading = pipeline("automatic-speech-recognition", MODEL_ID, {
      progress_callback: (progress) => {
        const file = "file" in progress ? progress.file : undefined;

        if (progress.status === "progress" && progress.total) {
          self.postMessage({
            type: "progress",
            status: progress.status,
            progress: progress.progress,
            total: progress.total,
            file,
          });
        } else {
          self.postMessage({
            type: "progress",
            status: progress.status,
            file,
          });
        }
      },
    }) as unknown as Promise<AutomaticSpeechRecognitionPipeline>;
  }

  transcriber = await loading;
  return transcriber;
}

async function preloadModel() {
  await getTranscriber();
  self.postMessage({ type: "model_ready" });
}

async function transcribeAudio(
  audio: Float32Array,
  language?: string,
) {
  const model = await getTranscriber();
  const totalChunks = Math.max(1, Math.ceil(audio.length / CHUNK_SAMPLES));

  self.postMessage({ type: "transcribing", totalChunks });

  const parts: string[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SAMPLES;
    const end = Math.min(start + CHUNK_SAMPLES, audio.length);
    const chunk = audio.subarray(start, end);

    const result = await model(chunk, {
      language: language ?? "en",
      task: "transcribe",
    });

    const text = extractText(result);
    if (text) {
      parts.push(text);
    }

    self.postMessage({
      type: "transcription_progress",
      progress: Math.round(((i + 1) / totalChunks) * 100),
      chunk: i + 1,
      totalChunks,
    });
  }

  self.postMessage({ type: "result", text: parts.join(" ").trim() });
}

self.onmessage = async (event: MessageEvent<WhisperWorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === "preload") {
      await preloadModel();
      return;
    }

    if (message.type === "transcribe") {
      await transcribeAudio(message.audio, message.language);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error instanceof Error ? error.message : "Transcription failed.",
    });
  }
};
