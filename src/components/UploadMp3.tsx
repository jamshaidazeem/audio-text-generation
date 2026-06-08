"use client";

import { useMemo, useRef, useState } from "react";

import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
} from "@/lib/upload-constants";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KiB", "MiB", "GiB", "TiB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[unitIndex]}`;
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

function isProbablyMp3(file: File): boolean {
  const ext = getExtension(file.name);
  if (ext === "mp3") return true;
  if (file.type && file.type.toLowerCase() === "audio/mpeg") return true;
  return false;
}

function ProgressBar({
  value,
  indeterminate = false,
}: {
  value: number;
  indeterminate?: boolean;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100 ${
          indeterminate ? "w-1/3 animate-pulse" : ""
        }`}
        style={indeterminate ? undefined : { width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function UploadMp3() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    status,
    modelProgress,
    transcriptionProgress,
    progressLabel,
    transcript,
    error: transcriptionError,
    isBusy,
    isModelLoading,
    transcribe,
    reset: resetTranscription,
  } = useWhisperTranscription();

  const details = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      extension: getExtension(file.name),
      sizeBytes: file.size,
      sizePretty: formatBytes(file.size),
    };
  }, [file]);

  function clearSelection(message?: string) {
    setFile(null);
    setError(message ?? null);
    resetTranscription();
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      clearSelection();
      return;
    }

    if (!isProbablyMp3(selected)) {
      clearSelection("Please choose an .mp3 file.");
      return;
    }

    if (selected.size > MAX_UPLOAD_BYTES) {
      clearSelection(
        `File is too large. Max size is ${formatBytes(MAX_UPLOAD_BYTES)} (${MAX_UPLOAD_LABEL}).`,
      );
      return;
    }

    resetTranscription();
    setFile(selected);
    setError(null);
  }

  async function onTranscribe() {
    if (!file || isBusy) return;
    await transcribe(file);
  }

  const displayError = error ?? transcriptionError;
  const showBackgroundModelProgress = isModelLoading && !isBusy;
  const showModelProgress = status === "loading_model";
  const showTranscriptionProgress = status === "transcribing";

  return (
    <section className="w-full rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
      <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        Upload an MP3
      </h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Choose a single <span className="font-medium">.mp3</span> file (max{" "}
        <span className="font-medium">{MAX_UPLOAD_LABEL}</span>), then transcribe
        it on your device with Whisper Tiny.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          onChange={onFileChange}
          disabled={isBusy}
          className="block w-full cursor-pointer rounded-lg border border-black/8 bg-transparent px-3 py-2 text-sm text-black file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-50 dark:file:bg-zinc-100 dark:file:text-black dark:hover:file:bg-zinc-200"
        />

        <button
          type="button"
          onClick={() => clearSelection()}
          disabled={isBusy}
          className="inline-flex h-10 items-center justify-center rounded-full border border-solid border-black/8 px-5 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a] sm:w-auto"
        >
          Clear
        </button>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onTranscribe}
          disabled={!file || isBusy}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
        >
          {isBusy ? "Working…" : "Transcribe"}
        </button>
      </div>

      {showBackgroundModelProgress ? (
        <div className="mt-4 rounded-xl border border-black/8 bg-zinc-50 p-4 text-sm dark:border-white/[.145] dark:bg-white/4">
          <p className="font-medium text-black dark:text-zinc-50">
            Downloading Whisper Tiny in the background…
          </p>
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-zinc-600 dark:text-zinc-400">
                Model download
              </span>
              <span className="font-medium text-black dark:text-zinc-50">
                {modelProgress > 0 ? `${modelProgress}%` : "Starting…"}
              </span>
            </div>
            <ProgressBar
              value={modelProgress}
              indeterminate={modelProgress === 0}
            />
          </div>
        </div>
      ) : null}

      {isBusy && progressLabel ? (
        <div className="mt-4 space-y-4 rounded-xl border border-black/8 bg-zinc-50 p-4 text-sm dark:border-white/[.145] dark:bg-white/4">
          <p className="font-medium text-black dark:text-zinc-50">
            {progressLabel}
          </p>

          {showModelProgress && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Model download
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {modelProgress > 0 ? `${modelProgress}%` : "Starting…"}
                </span>
              </div>
              <ProgressBar
                value={modelProgress}
                indeterminate={
                  status === "loading_model" && modelProgress === 0
                }
              />
            </div>
          )}

          {showTranscriptionProgress && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Transcription
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {transcriptionProgress}%
                </span>
              </div>
              <ProgressBar value={transcriptionProgress} />
            </div>
          )}

          {status === "decoding" && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Audio decode
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  In progress…
                </span>
              </div>
              <ProgressBar value={0} indeterminate />
            </div>
          )}
        </div>
      ) : null}

      {displayError ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
          {displayError}
        </div>
      ) : null}

      {details ? (
        <dl className="mt-4 grid gap-3 rounded-xl border border-black/8 bg-zinc-50 p-4 text-sm dark:border-white/[.145] dark:bg-white/4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-zinc-600 dark:text-zinc-400">Name</dt>
            <dd className="max-w-full truncate font-medium text-black dark:text-zinc-50">
              {details.name}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-zinc-600 dark:text-zinc-400">Extension</dt>
            <dd className="font-medium text-black dark:text-zinc-50">
              {details.extension ? `.${details.extension}` : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-zinc-600 dark:text-zinc-400">Size</dt>
            <dd className="font-medium text-black dark:text-zinc-50">
              {details.sizePretty}{" "}
              <span className="font-normal text-zinc-600 dark:text-zinc-400">
                ({details.sizeBytes.toLocaleString()} bytes)
              </span>
            </dd>
          </div>
        </dl>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-black/8 p-4 text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
          No file selected yet.
        </div>
      )}

      {transcript ? (
        <div className="mt-4 rounded-xl border border-black/8 bg-zinc-50 p-4 dark:border-white/[.145] dark:bg-white/4">
          <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
            Transcript
          </h3>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-200">
            {transcript}
          </p>
        </div>
      ) : null}
    </section>
  );
}
