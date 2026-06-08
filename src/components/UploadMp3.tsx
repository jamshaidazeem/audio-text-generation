"use client";

import { useMemo, useRef, useState } from "react";

import { useServerTranscription } from "@/hooks/useServerTranscription";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import {
  MAX_SERVER_UPLOAD_BYTES,
  MAX_SERVER_UPLOAD_LABEL,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  type TranscriptionMode,
} from "@/lib/upload-constants";
import { getExtension, validateMp3File } from "@/lib/validate-mp3";

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
  const [mode, setMode] = useState<TranscriptionMode>("browser");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const browserEnabled = mode === "browser";
  const maxLabel = browserEnabled ? MAX_UPLOAD_LABEL : MAX_SERVER_UPLOAD_LABEL;

  const browser = useWhisperTranscription(browserEnabled);
  const server = useServerTranscription();

  const active = browserEnabled ? browser : server;

  const details = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      extension: getExtension(file.name),
      sizeBytes: file.size,
      sizePretty: formatBytes(file.size),
    };
  }, [file]);

  function resetTranscriptionState() {
    browser.reset();
    server.reset();
  }

  function clearSelection(message?: string) {
    setFile(null);
    setError(message ?? null);
    resetTranscriptionState();
    if (inputRef.current) inputRef.current.value = "";
  }

  function validateSelectedFile(selected: File, activeMode: TranscriptionMode) {
    const limit =
      activeMode === "browser" ? MAX_UPLOAD_BYTES : MAX_SERVER_UPLOAD_BYTES;
    return validateMp3File(selected, limit);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      clearSelection();
      return;
    }

    const validationError = validateSelectedFile(selected, mode);
    if (validationError) {
      clearSelection(validationError);
      return;
    }

    resetTranscriptionState();
    setFile(selected);
    setError(null);
  }

  function onModeChange(nextMode: TranscriptionMode) {
    if (active.isBusy) return;

    setMode(nextMode);
    setError(null);
    resetTranscriptionState();

    if (file) {
      const validationError = validateSelectedFile(file, nextMode);
      if (validationError) {
        setFile(null);
        setError(validationError);
        if (inputRef.current) inputRef.current.value = "";
      }
    }
  }

  async function onTranscribe() {
    if (!file || active.isBusy) return;

    if (browserEnabled) {
      await browser.transcribe(file);
    } else {
      await server.transcribe(file);
    }
  }

  const displayError = error ?? active.error;
  const transcript = active.transcript;
  const isBusy = active.isBusy;
  const progressLabel = active.progressLabel;

  const showBackgroundModelProgress =
    browserEnabled && browser.isModelLoading && !browser.isBusy;

  const showBrowserActiveProgress =
    browserEnabled && browser.isBusy && progressLabel;

  const showServerActiveProgress = !browserEnabled && server.isBusy && progressLabel;

  return (
    <section className="w-full rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
      <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        Upload an MP3
      </h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Choose a single <span className="font-medium">.mp3</span> file (max{" "}
        <span className="font-medium">{maxLabel}</span> in{" "}
        {browserEnabled ? "on-device" : "server"} mode), then transcribe it.
      </p>

      <fieldset className="mt-4" disabled={isBusy}>
        <legend className="sr-only">Transcription mode</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-black/8 px-3 py-2 text-sm dark:border-white/[.145]">
            <input
              type="radio"
              name="transcription-mode"
              value="browser"
              checked={mode === "browser"}
              onChange={() => onModeChange("browser")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium text-black dark:text-zinc-50">
                On device
              </span>
              <span className="mt-0.5 block text-zinc-600 dark:text-zinc-400">
                Whisper Tiny in your browser. Audio stays on your device.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-black/8 px-3 py-2 text-sm dark:border-white/[.145]">
            <input
              type="radio"
              name="transcription-mode"
              value="server"
              checked={mode === "server"}
              onChange={() => onModeChange("server")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium text-black dark:text-zinc-50">
                Server (OpenAI)
              </span>
              <span className="mt-0.5 block text-zinc-600 dark:text-zinc-400">
                Audio is uploaded to your server, then sent to OpenAI.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

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
                {browser.modelProgress > 0
                  ? `${browser.modelProgress}%`
                  : "Starting…"}
              </span>
            </div>
            <ProgressBar
              value={browser.modelProgress}
              indeterminate={browser.modelProgress === 0}
            />
          </div>
        </div>
      ) : null}

      {showBrowserActiveProgress ? (
        <div className="mt-4 space-y-4 rounded-xl border border-black/8 bg-zinc-50 p-4 text-sm dark:border-white/[.145] dark:bg-white/4">
          <p className="font-medium text-black dark:text-zinc-50">
            {progressLabel}
          </p>

          {browser.status === "loading_model" && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Model download
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {browser.modelProgress > 0
                    ? `${browser.modelProgress}%`
                    : "Starting…"}
                </span>
              </div>
              <ProgressBar
                value={browser.modelProgress}
                indeterminate={
                  browser.status === "loading_model" &&
                  browser.modelProgress === 0
                }
              />
            </div>
          )}

          {browser.status === "transcribing" && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Transcription
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {browser.transcriptionProgress}%
                </span>
              </div>
              <ProgressBar value={browser.transcriptionProgress} />
            </div>
          )}

          {browser.status === "decoding" && (
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

      {showServerActiveProgress ? (
        <div className="mt-4 space-y-4 rounded-xl border border-black/8 bg-zinc-50 p-4 text-sm dark:border-white/[.145] dark:bg-white/4">
          <p className="font-medium text-black dark:text-zinc-50">
            {progressLabel}
          </p>

          {server.status === "uploading" && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">Upload</span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {server.uploadProgress}%
                </span>
              </div>
              <ProgressBar value={server.uploadProgress} />
            </div>
          )}

          {server.status === "transcribing" && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Transcription
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
