"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { decodeAudioFile } from "@/lib/audio";
import type { ModelStatus, WhisperWorkerResponse } from "@/lib/whisper-types";

export type TranscriptionStatus =
  | "idle"
  | "loading_model"
  | "decoding"
  | "transcribing"
  | "done"
  | "error";

export function useWhisperTranscription(enabled = true) {
  const workerRef = useRef<Worker | null>(null);
  const isTranscribingRef = useRef(false);
  const modelStatusRef = useRef<ModelStatus>(enabled ? "loading" : "ready");

  const [modelStatus, setModelStatus] = useState<ModelStatus>(
    enabled ? "loading" : "ready",
  );
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isBusy =
    status === "loading_model" ||
    status === "decoding" ||
    status === "transcribing";

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/whisper.worker.ts", import.meta.url),
      );
    }

    return workerRef.current;
  }, []);

  const handleWorkerMessage = useCallback(
    (event: MessageEvent<WhisperWorkerResponse>) => {
      const message = event.data;

      switch (message.type) {
        case "progress":
          modelStatusRef.current = "loading";
          setModelStatus("loading");
          if (message.progress != null && message.total) {
            setModelProgress(
              Math.round((message.progress / message.total) * 100),
            );
          }

          if (isTranscribingRef.current) {
            setStatus("loading_model");
            setProgressLabel(message.file ?? "Downloading Whisper Tiny…");
          }
          break;
        case "model_ready":
          modelStatusRef.current = "ready";
          setModelStatus("ready");
          setModelProgress(100);
          break;
        case "transcribing":
          setStatus("transcribing");
          setModelProgress(100);
          setTranscriptionProgress(0);
          setProgressLabel(
            message.totalChunks > 1
              ? `Transcribing audio (0/${message.totalChunks} chunks)…`
              : "Transcribing audio…",
          );
          break;
        case "transcription_progress":
          setStatus("transcribing");
          setTranscriptionProgress(message.progress);
          setProgressLabel(
            message.totalChunks > 1
              ? `Transcribing audio (${message.chunk}/${message.totalChunks} chunks)…`
              : "Transcribing audio…",
          );
          break;
        case "result":
          isTranscribingRef.current = false;
          setStatus("done");
          setTranscriptionProgress(100);
          setTranscript(message.text);
          setProgressLabel(null);
          break;
        case "error":
          if (isTranscribingRef.current) {
            isTranscribingRef.current = false;
            setStatus("error");
          } else {
            modelStatusRef.current = "error";
            setModelStatus("error");
          }
          setError(message.message);
          setProgressLabel(null);
          break;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    isTranscribingRef.current = false;
    setStatus("idle");
    setTranscriptionProgress(0);
    setProgressLabel(null);
    setTranscript("");
    setError(null);
  }, []);

  const transcribe = useCallback(
    async (file: File) => {
      setError(null);
      setTranscript("");
      setTranscriptionProgress(0);
      setProgressLabel(null);
      isTranscribingRef.current = true;

      const worker = getWorker();

      try {
        setStatus("decoding");
        setProgressLabel("Decoding audio…");

        const audio = await decodeAudioFile(file);

        if (modelStatusRef.current !== "ready") {
          setStatus("loading_model");
          setProgressLabel("Waiting for Whisper Tiny model…");
        }

        worker.postMessage({ type: "transcribe", audio }, [audio.buffer]);
      } catch {
        isTranscribingRef.current = false;
        setStatus("error");
        setError(
          "This browser could not decode the selected audio file. Try mp3 or wav, or use the server transcription mode.",
        );
      }
    },
    [getWorker],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const worker = getWorker();
    worker.addEventListener("message", handleWorkerMessage);
    worker.postMessage({ type: "preload" });

    return () => {
      worker.removeEventListener("message", handleWorkerMessage);
      worker.terminate();
      workerRef.current = null;
      modelStatusRef.current = "loading";
      setModelStatus("loading");
      setModelProgress(0);
    };
  }, [enabled, getWorker, handleWorkerMessage]);

  return {
    modelStatus,
    status,
    modelProgress,
    transcriptionProgress,
    progressLabel,
    transcript,
    error,
    isBusy,
    isModelReady: enabled && modelStatus === "ready",
    isModelLoading: enabled && modelStatus === "loading",
    transcribe,
    reset,
  };
}
