"use client";

import { useCallback, useRef, useState } from "react";

import type { YouTubePipelineStep } from "@/lib/youtube-errors";

export type YouTubeTranscriptionStatus =
  | "idle"
  | "extracting"
  | "transcribing"
  | "done"
  | "error";

type YouTubeApiSuccessResponse = {
  text?: string;
};

type YouTubeApiErrorResponse = {
  error?: string;
  step?: YouTubePipelineStep;
};

export function useYouTubeTranscription() {
  const abortRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<YouTubeTranscriptionStatus>("idle");
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorStep, setErrorStep] = useState<YouTubePipelineStep | null>(null);

  const isBusy = status === "extracting" || status === "transcribing";

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setProgressLabel(null);
    setTranscript("");
    setError(null);
    setErrorStep(null);
  }, []);

  const transcribe = useCallback(async (videoId: string) => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setErrorStep(null);
    setTranscript("");
    setStatus("extracting");
    setProgressLabel("Extracting audio from YouTube…");

    try {
      const response = await fetch("/api/transcribe-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      let data: YouTubeApiSuccessResponse & YouTubeApiErrorResponse;

      try {
        data = (await response.json()) as YouTubeApiSuccessResponse &
          YouTubeApiErrorResponse;
      } catch {
        setStatus("error");
        setErrorStep("network");
        setError("Received an invalid response from the server.");
        setProgressLabel(null);
        return;
      }

      if (controller.signal.aborted) {
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setErrorStep(data.step ?? "transcription");
        setError(data.error ?? "Transcription failed.");
        setProgressLabel(null);
        return;
      }

      setTranscript(data.text ?? "");
      setStatus("done");
      setProgressLabel(null);
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus("idle");
        setProgressLabel(null);
        return;
      }

      if (err instanceof TypeError) {
        setStatus("error");
        setErrorStep("network");
        setError("Network error while contacting the server.");
        setProgressLabel(null);
        return;
      }

      setStatus("error");
      setErrorStep("transcription");
      setError(
        err instanceof Error ? err.message : "Transcription failed.",
      );
      setProgressLabel(null);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  return {
    status,
    progressLabel,
    transcript,
    error,
    errorStep,
    isBusy,
    transcribe,
    reset,
  };
}
