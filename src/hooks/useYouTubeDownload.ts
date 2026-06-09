"use client";

import { useCallback, useRef, useState } from "react";

import type { YouTubePipelineStep } from "@/lib/youtube-errors";

export type YouTubeDownloadStatus = "idle" | "downloading" | "done" | "error";

type YouTubeApiErrorResponse = {
  error?: string;
  step?: YouTubePipelineStep;
};

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(contentDisposition);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1].replace(/"/g, ""));
  } catch {
    return match[1].replace(/"/g, "");
  }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useYouTubeDownload() {
  const abortRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<YouTubeDownloadStatus>("idle");
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStep, setErrorStep] = useState<YouTubePipelineStep | null>(null);

  const isBusy = status === "downloading";

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setProgressLabel(null);
    setError(null);
    setErrorStep(null);
  }, []);

  const download = useCallback(async (videoId: string) => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setErrorStep(null);
    setStatus("downloading");
    setProgressLabel("Downloading from YouTube…");

    try {
      const response = await fetch("/api/download-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      if (!response.ok) {
        let data: YouTubeApiErrorResponse = {};

        try {
          data = (await response.json()) as YouTubeApiErrorResponse;
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

        setStatus("error");
        setErrorStep(data.step ?? "extraction_download");
        setError(data.error ?? "Download failed.");
        setProgressLabel(null);
        return;
      }

      const blob = await response.blob();

      if (controller.signal.aborted) {
        return;
      }

      const filename =
        parseFilename(response.headers.get("Content-Disposition")) ??
        videoId;

      triggerBrowserDownload(blob, filename);
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
      setErrorStep("extraction_download");
      setError(err instanceof Error ? err.message : "Download failed.");
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
    error,
    errorStep,
    isBusy,
    download,
    reset,
  };
}
