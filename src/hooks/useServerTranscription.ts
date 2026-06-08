"use client";

import { useCallback, useRef, useState } from "react";

export type ServerTranscriptionStatus =
  | "idle"
  | "uploading"
  | "transcribing"
  | "done"
  | "error";

export function useServerTranscription() {
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [status, setStatus] = useState<ServerTranscriptionStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isBusy = status === "uploading" || status === "transcribing";

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setStatus("idle");
    setUploadProgress(0);
    setProgressLabel(null);
    setTranscript("");
    setError(null);
  }, []);

  const transcribe = useCallback(async (file: File) => {
    xhrRef.current?.abort();

    setError(null);
    setTranscript("");
    setUploadProgress(0);
    setStatus("uploading");
    setProgressLabel("Uploading audio…");

    const formData = new FormData();
    formData.append("file", file);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.upload.addEventListener("load", () => {
        setStatus("transcribing");
        setUploadProgress(100);
        setProgressLabel("Transcribing with OpenAI…");
      });

      xhr.addEventListener("load", () => {
        xhrRef.current = null;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { text?: string };
            setTranscript(data.text ?? "");
            setStatus("done");
            setProgressLabel(null);
            resolve();
          } catch {
            setStatus("error");
            setError("Invalid response from server.");
            setProgressLabel(null);
            reject(new Error("Invalid response from server."));
          }
          return;
        }

        let message = "Transcription failed.";

        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          if (data.error) {
            message = data.error;
          }
        } catch {
          // use default message
        }

        setStatus("error");
        setError(message);
        setProgressLabel(null);
        reject(new Error(message));
      });

      xhr.addEventListener("error", () => {
        xhrRef.current = null;
        setStatus("error");
        setError("Network error while uploading audio.");
        setProgressLabel(null);
        reject(new Error("Network error while uploading audio."));
      });

      xhr.addEventListener("abort", () => {
        xhrRef.current = null;
        setStatus("idle");
        setProgressLabel(null);
        reject(new Error("Upload cancelled."));
      });

      xhr.open("POST", "/api/transcribe");
      xhr.send(formData);
    });
  }, []);

  return {
    status,
    uploadProgress,
    progressLabel,
    transcript,
    error,
    isBusy,
    transcribe,
    reset,
  };
}
