"use client";

import { useMemo, useRef, useState } from "react";

const MAX_BYTES = 25 * 1024 * 1024;

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

export function UploadMp3() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    if (selected.size > MAX_BYTES) {
      clearSelection(
        `File is too large. Max size is ${formatBytes(MAX_BYTES)} (25 MB).`,
      );
      return;
    }

    setFile(selected);
    setError(null);
  }

  return (
    <section className="w-full rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
      <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        Upload an MP3
      </h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Choose a single <span className="font-medium">.mp3</span> file (max{" "}
        <span className="font-medium">25 MB</span>). We’ll show its extension
        and size before you do anything else.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          onChange={onFileChange}
          className="block w-full cursor-pointer rounded-lg border border-black/8 bg-transparent px-3 py-2 text-sm text-black file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 dark:border-white/[.145] dark:text-zinc-50 dark:file:bg-zinc-100 dark:file:text-black dark:hover:file:bg-zinc-200"
        />

        <button
          type="button"
          onClick={() => clearSelection()}
          className="inline-flex h-10 items-center justify-center rounded-full border border-solid border-black/8 px-5 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a] sm:w-auto"
        >
          Clear
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
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
    </section>
  );
}
