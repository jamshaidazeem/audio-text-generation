"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LabeledProgress } from "@/components/ui/LabeledProgress";
import { TranscriptPanel } from "@/components/ui/TranscriptPanel";
import { useYouTubeDownload } from "@/hooks/useYouTubeDownload";
import { useYouTubeTranscription } from "@/hooks/useYouTubeTranscription";
import {
  MAX_YOUTUBE_DURATION_LABEL,
  MAX_YOUTUBE_DURATION_SECONDS,
} from "@/lib/youtube-constants";
import {
  getYouTubeStepLabel,
  type YouTubePipelineStep,
} from "@/lib/youtube-errors";
import {
  parseYouTubeVideoId,
  validateYouTubeUrl,
} from "@/lib/validate-youtube-url";

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;

  if (minutes === 0) {
    return `${remainingSeconds} seconds`;
  }

  if (remainingSeconds === 0) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

function StepErrorAlert({
  step,
  message,
}: {
  step: YouTubePipelineStep;
  message: string;
}) {
  return (
    <Alert>
      <span className="font-medium">{getYouTubeStepLabel(step)}:</span>{" "}
      {message}
    </Alert>
  );
}

export function YouTubeUrlInput() {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationErrorStep, setValidationErrorStep] =
    useState<YouTubePipelineStep | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [durationWarning, setDurationWarning] = useState<string | null>(null);
  const [durationBlocked, setDurationBlocked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const transcription = useYouTubeTranscription();
  const download = useYouTubeDownload();

  const isBusy = transcription.isBusy || download.isBusy || isConfirming;

  function clearValidationError() {
    setValidationError(null);
    setValidationErrorStep(null);
  }

  function onUrlChange(value: string) {
    setUrl(value);
    clearValidationError();
    setVideoId(null);
    setDurationWarning(null);
    setDurationBlocked(false);
    transcription.reset();
    download.reset();
  }

  async function onConfirmVideo() {
    const error = validateYouTubeUrl(url);
    if (error) {
      setValidationError(error);
      setValidationErrorStep("url_validation");
      setVideoId(null);
      setDurationWarning(null);
      setDurationBlocked(false);
      transcription.reset();
      download.reset();
      return;
    }

    const confirmedVideoId = parseYouTubeVideoId(url);
    if (!confirmedVideoId) return;

    clearValidationError();
    setDurationWarning(null);
    setDurationBlocked(false);
    setVideoId(confirmedVideoId);
    transcription.reset();
    download.reset();
    setIsConfirming(true);

    try {
      const response = await fetch("/api/youtube-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: confirmedVideoId }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { durationSeconds?: number };

      if (
        typeof data.durationSeconds === "number" &&
        data.durationSeconds > MAX_YOUTUBE_DURATION_SECONDS
      ) {
        setDurationBlocked(true);
        setDurationWarning(
          `This video is about ${formatDuration(data.durationSeconds)} long, which is longer than ${MAX_YOUTUBE_DURATION_LABEL}. Download and transcribe are not available for this video.`,
        );
      }
    } catch {
      // Duration check is best-effort; preview still works without it.
    } finally {
      setIsConfirming(false);
    }
  }

  async function onTranscribe() {
    if (!videoId || isBusy || durationBlocked) return;
    clearValidationError();
    await transcription.transcribe(videoId);
  }

  async function onDownload() {
    if (!videoId || isBusy || durationBlocked) return;
    clearValidationError();
    await download.download(videoId);
  }

  const actionsAvailable = videoId && !isConfirming && !durationBlocked;

  const displayError =
    validationError ?? transcription.error ?? download.error;
  const displayErrorStep =
    validationErrorStep ??
    transcription.errorStep ??
    download.errorStep ??
    null;

  return (
    <Card variant="elevated" className="space-y-4">
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        You can enter a YouTube URL to preview the video. You can also download
        the file or generate a text transcript. Videos up to{" "}
        {MAX_YOUTUBE_DURATION_LABEL} are supported.
      </p>

      <div className="space-y-2">
        <label
          htmlFor="youtube-url"
          className="block text-sm font-medium text-black dark:text-zinc-50"
        >
          Video URL
        </label>
        <input
          id="youtube-url"
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          disabled={isBusy}
          className="w-full rounded-xl border border-black/8 bg-white px-4 py-2.5 text-sm text-black placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onConfirmVideo} disabled={isBusy}>
          {isConfirming ? "Checking…" : "Confirm video"}
        </Button>

        {actionsAvailable ? (
          <>
            <Button
              variant="secondary"
              onClick={onDownload}
              disabled={isBusy}
            >
              {download.isBusy ? "Working…" : "Download"}
            </Button>
            <Button onClick={onTranscribe} disabled={isBusy}>
              {transcription.isBusy ? "Working…" : "Transcribe"}
            </Button>
          </>
        ) : null}
      </div>

      {durationWarning ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
          {durationWarning}
        </div>
      ) : null}

      {displayError && displayErrorStep ? (
        <StepErrorAlert step={displayErrorStep} message={displayError} />
      ) : displayError ? (
        <Alert>{displayError}</Alert>
      ) : null}

      {videoId ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Selected YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : null}

      {isBusy && (transcription.progressLabel ?? download.progressLabel) ? (
        <Card className="space-y-4 text-sm">
          <p className="font-medium text-black dark:text-zinc-50">
            {transcription.progressLabel ?? download.progressLabel}
          </p>
          <LabeledProgress
            label="Processing"
            value={0}
            valueLabel="In progress…"
            indeterminate
          />
        </Card>
      ) : null}

      {transcription.transcript ? (
        <Card>
          <TranscriptPanel transcript={transcription.transcript} />
        </Card>
      ) : null}
    </Card>
  );
}
