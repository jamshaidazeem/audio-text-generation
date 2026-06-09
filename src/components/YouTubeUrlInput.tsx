"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LabeledProgress } from "@/components/ui/LabeledProgress";
import { TranscriptPanel } from "@/components/ui/TranscriptPanel";
import { useYouTubeTranscription } from "@/hooks/useYouTubeTranscription";
import { MAX_YOUTUBE_DURATION_LABEL } from "@/lib/youtube-constants";
import {
  getYouTubeStepLabel,
  type YouTubePipelineStep,
} from "@/lib/youtube-errors";
import {
  parseYouTubeVideoId,
  validateYouTubeUrl,
} from "@/lib/validate-youtube-url";

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

  const transcription = useYouTubeTranscription();

  function clearValidationError() {
    setValidationError(null);
    setValidationErrorStep(null);
  }

  function onUrlChange(value: string) {
    setUrl(value);
    clearValidationError();
    setVideoId(null);
    transcription.reset();
  }

  function onConfirmVideo() {
    const error = validateYouTubeUrl(url);
    if (error) {
      setValidationError(error);
      setValidationErrorStep("url_validation");
      setVideoId(null);
      transcription.reset();
      return;
    }

    clearValidationError();
    setVideoId(parseYouTubeVideoId(url));
    transcription.reset();
  }

  async function onTranscribe() {
    if (!videoId || transcription.isBusy) return;
    clearValidationError();
    await transcription.transcribe(videoId);
  }

  const displayError = validationError ?? transcription.error;
  const displayErrorStep =
    validationErrorStep ?? transcription.errorStep ?? null;

  return (
    <Card variant="elevated" className="space-y-4">
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Enter a YouTube video URL, confirm the preview, then transcribe its
        audio into text. Videos up to {MAX_YOUTUBE_DURATION_LABEL} are supported
        (local dev, OpenAI server mode).
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
          disabled={transcription.isBusy}
          className="w-full rounded-xl border border-black/8 bg-white px-4 py-2.5 text-sm text-black placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onConfirmVideo} disabled={transcription.isBusy}>
          Confirm video
        </Button>

        {videoId ? (
          <Button onClick={onTranscribe} disabled={transcription.isBusy}>
            {transcription.isBusy ? "Working…" : "Transcribe"}
          </Button>
        ) : null}
      </div>

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

      {transcription.isBusy && transcription.progressLabel ? (
        <Card className="space-y-4 text-sm">
          <p className="font-medium text-black dark:text-zinc-50">
            {transcription.progressLabel}
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
