export type WhisperWorkerRequest =
  | { type: "preload" }
  | {
      type: "transcribe";
      audio: Float32Array;
      language?: string;
    };

export type ModelStatus = "loading" | "ready" | "error";

export type WhisperWorkerResponse =
  | {
      type: "progress";
      status: string;
      progress?: number;
      total?: number;
      file?: string;
    }
  | { type: "model_ready" }
  | { type: "transcribing"; totalChunks: number }
  | {
      type: "transcription_progress";
      progress: number;
      chunk: number;
      totalChunks: number;
    }
  | { type: "result"; text: string }
  | { type: "error"; message: string };
