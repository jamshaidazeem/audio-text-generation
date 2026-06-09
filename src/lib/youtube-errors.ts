import {
  MAX_YOUTUBE_DURATION_LABEL,
} from "@/lib/youtube-constants";

export type YouTubePipelineStep =
  | "url_validation"
  | "request"
  | "config"
  | "extraction_setup"
  | "extraction_download"
  | "extraction_read"
  | "transcription"
  | "network";

export class YouTubePipelineError extends Error {
  step: YouTubePipelineStep;

  constructor(step: YouTubePipelineStep, message: string) {
    super(message);
    this.name = "YouTubePipelineError";
    this.step = step;
  }
}

const STEP_LABELS: Record<YouTubePipelineStep, string> = {
  url_validation: "URL validation",
  request: "Request",
  config: "Server configuration",
  extraction_setup: "Audio extraction setup",
  extraction_download: "YouTube download",
  extraction_read: "Audio file read",
  transcription: "Transcription",
  network: "Network",
};

export function getYouTubeStepLabel(step: YouTubePipelineStep): string {
  return STEP_LABELS[step];
}

function getYtDlpStderr(error: unknown): string {
  if (error instanceof Error) {
    const withStderr = error as Error & { stderr?: string };
    return [error.message, withStderr.stderr].filter(Boolean).join("\n");
  }

  return String(error);
}

export function mapYtDlpError(error: unknown): YouTubePipelineError {
  const message = getYtDlpStderr(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("match filter") ||
    lower.includes("does not pass filter") ||
    lower.includes("duration")
  ) {
    return new YouTubePipelineError(
      "extraction_download",
      `Video is too long. Maximum duration is ${MAX_YOUTUBE_DURATION_LABEL}.`,
    );
  }

  if (
    lower.includes("unavailable") ||
    lower.includes("private video") ||
    lower.includes("video unavailable")
  ) {
    return new YouTubePipelineError(
      "extraction_download",
      "This video is unavailable or private.",
    );
  }

  if (
    lower.includes("geo") ||
    lower.includes("country") ||
    lower.includes("not made this video available")
  ) {
    return new YouTubePipelineError(
      "extraction_download",
      "This video is not available in your region.",
    );
  }

  if (
    lower.includes("sign in") ||
    lower.includes("login") ||
    lower.includes("age-restricted") ||
    lower.includes("members only")
  ) {
    return new YouTubePipelineError(
      "extraction_download",
      "This video requires sign-in or is restricted and cannot be downloaded.",
    );
  }

  if (
    lower.includes("python") ||
    lower.includes("no such file") ||
    lower.includes("enoent")
  ) {
    return new YouTubePipelineError(
      "extraction_download",
      "Audio extraction failed. Ensure Python 3.9+ is installed and available as python3.",
    );
  }

  if (lower.includes("ffmpeg") || lower.includes("ffprobe")) {
    return new YouTubePipelineError(
      "extraction_download",
      "Audio extraction failed. ffmpeg is required to convert YouTube audio to MP3.",
    );
  }

  if (
    lower.includes("network") ||
    lower.includes("timed out") ||
    lower.includes("connection") ||
    lower.includes("unable to download")
  ) {
    return new YouTubePipelineError(
      "extraction_download",
      "Could not reach YouTube while downloading audio. Check your connection and try again.",
    );
  }

  return new YouTubePipelineError(
    "extraction_download",
    "Failed to download audio from this video.",
  );
}

export function mapOpenAITranscriptionError(
  error: unknown,
): YouTubePipelineError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("incorrect api key")) {
    return new YouTubePipelineError(
      "transcription",
      "OpenAI API key is invalid or rejected.",
    );
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return new YouTubePipelineError(
      "transcription",
      "OpenAI rate limit reached. Wait a moment and try again.",
    );
  }

  if (
    lower.includes("too large") ||
    lower.includes("maximum") ||
    lower.includes("file size")
  ) {
    return new YouTubePipelineError(
      "transcription",
      "Extracted audio is too large for OpenAI Whisper.",
    );
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return new YouTubePipelineError(
      "transcription",
      "OpenAI transcription timed out. Try a shorter video.",
    );
  }

  return new YouTubePipelineError(
    "transcription",
    "OpenAI failed to transcribe the extracted audio.",
  );
}

export function isYouTubePipelineError(
  error: unknown,
): error is YouTubePipelineError {
  return error instanceof YouTubePipelineError;
}
