"use client";

import { useMemo, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileDetails } from "@/components/ui/FileDetails";
import { LabeledProgress } from "@/components/ui/LabeledProgress";
import { TranscriptPanel } from "@/components/ui/TranscriptPanel";
import { useServerTranscription } from "@/hooks/useServerTranscription";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import { formatBytes } from "@/lib/format-bytes";
import { OPENAI_TRANSCRIPTION_MODELS, type OpenAITranscriptionModelId } from "@/lib/models";
import {
  MAX_SERVER_UPLOAD_BYTES,
  MAX_SERVER_UPLOAD_LABEL,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  type TranscriptionMode,
} from "@/lib/upload-constants";
import {
  getExtension,
  getFileInputAccept,
  getSupportedFormatsLabel,
  validateAudioUpload,
} from "@/lib/validate-audio-upload";

type TranscriptionUploaderProps = {
  mode: TranscriptionMode;
};

export function TranscriptionUploader({ mode }: TranscriptionUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<OpenAITranscriptionModelId>("whisper-1");

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

  function validateSelectedFile(selected: File) {
    const limit = browserEnabled ? MAX_UPLOAD_BYTES : MAX_SERVER_UPLOAD_BYTES;
    return validateAudioUpload(selected, limit);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      clearSelection();
      return;
    }

    const validationError = validateSelectedFile(selected);
    if (validationError) {
      clearSelection(validationError);
      return;
    }

    resetTranscriptionState();
    setFile(selected);
    setError(null);
  }

  async function onTranscribe() {
    if (!file || active.isBusy) return;

    if (browserEnabled) {
      await browser.transcribe(file);
    } else {
      await server.transcribe(file, selectedModel);
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
    <Card variant="elevated" className="w-full">
      <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        Upload audio
      </h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Choose a single audio file (
        <span className="font-medium">{getSupportedFormatsLabel()}</span>; max{" "}
        <span className="font-medium">{maxLabel}</span>), then transcribe it.
      </p>

      {!browserEnabled ? (
        <div className="mt-4">
          <fieldset>
            <legend className="text-sm font-medium text-black dark:text-zinc-50">
              Transcription model
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {OPENAI_TRANSCRIPTION_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedModel === m.id
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
                      : "border-black/8 text-zinc-700 hover:border-zinc-400 dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-zinc-500"
                  } ${isBusy ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name="transcription-model"
                    value={m.id}
                    checked={selectedModel === m.id}
                    onChange={() => setSelectedModel(m.id)}
                    disabled={isBusy}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept={getFileInputAccept()}
          onChange={onFileChange}
          disabled={isBusy}
          className="block w-full cursor-pointer rounded-lg border border-black/8 bg-transparent px-3 py-2 text-sm text-black file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-50 dark:file:bg-zinc-100 dark:file:text-black dark:hover:file:bg-zinc-200"
        />

        <Button
          variant="secondary"
          onClick={() => clearSelection()}
          disabled={isBusy}
          className="sm:w-auto"
        >
          Clear
        </Button>
      </div>

      <div className="mt-4">
        <Button onClick={onTranscribe} disabled={!file || isBusy}>
          {isBusy ? "Working…" : "Transcribe"}
        </Button>
      </div>

      {showBackgroundModelProgress ? (
        <Card className="mt-4 text-sm">
          <p className="font-medium text-black dark:text-zinc-50">
            Downloading Whisper Tiny in the background…
          </p>
          <div className="mt-3">
            <LabeledProgress
              label="Model download"
              value={browser.modelProgress}
              valueLabel={
                browser.modelProgress > 0
                  ? `${browser.modelProgress}%`
                  : "Starting…"
              }
              indeterminate={browser.modelProgress === 0}
            />
          </div>
        </Card>
      ) : null}

      {showBrowserActiveProgress ? (
        <Card className="mt-4 space-y-4 text-sm">
          <p className="font-medium text-black dark:text-zinc-50">
            {progressLabel}
          </p>

          {browser.status === "loading_model" && (
            <LabeledProgress
              label="Model download"
              value={browser.modelProgress}
              valueLabel={
                browser.modelProgress > 0
                  ? `${browser.modelProgress}%`
                  : "Starting…"
              }
              indeterminate={
                browser.status === "loading_model" &&
                browser.modelProgress === 0
              }
            />
          )}

          {browser.status === "transcribing" && (
            <LabeledProgress
              label="Transcription"
              value={browser.transcriptionProgress}
              valueLabel={`${browser.transcriptionProgress}%`}
            />
          )}

          {browser.status === "decoding" && (
            <LabeledProgress
              label="Audio decode"
              value={0}
              valueLabel="In progress…"
              indeterminate
            />
          )}
        </Card>
      ) : null}

      {showServerActiveProgress ? (
        <Card className="mt-4 space-y-4 text-sm">
          <p className="font-medium text-black dark:text-zinc-50">
            {progressLabel}
          </p>

          {server.status === "uploading" && (
            <LabeledProgress
              label="Upload"
              value={server.uploadProgress}
              valueLabel={`${server.uploadProgress}%`}
            />
          )}

          {server.status === "transcribing" && (
            <LabeledProgress
              label="Transcription"
              value={0}
              valueLabel="In progress…"
              indeterminate
            />
          )}
        </Card>
      ) : null}

      {displayError ? (
        <div className="mt-4">
          <Alert>{displayError}</Alert>
        </div>
      ) : null}

      {details ? (
        <Card className="mt-4">
          <FileDetails
            name={details.name}
            extension={details.extension}
            sizePretty={details.sizePretty}
            sizeBytes={details.sizeBytes}
          />
        </Card>
      ) : (
        <Card variant="dashed" className="mt-4">
          <EmptyState message="No file selected yet." />
        </Card>
      )}

      {transcript ? (
        <Card className="mt-4">
          <TranscriptPanel transcript={transcript} />
        </Card>
      ) : null}
    </Card>
  );
}
