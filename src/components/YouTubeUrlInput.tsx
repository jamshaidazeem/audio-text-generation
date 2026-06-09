"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  parseYouTubeVideoId,
  validateYouTubeUrl,
} from "@/lib/validate-youtube-url";

export function YouTubeUrlInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  function onUrlChange(value: string) {
    setUrl(value);
    setError(null);
    setVideoId(null);
  }

  function onPreview() {
    const validationError = validateYouTubeUrl(url);
    if (validationError) {
      setError(validationError);
      setVideoId(null);
      return;
    }

    setError(null);
    setVideoId(parseYouTubeVideoId(url));
  }

  return (
    <Card variant="elevated" className="space-y-4">
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Enter the YouTube video you want to turn into text. Preview confirms
        you have the right one before transcription.
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
          className="w-full rounded-xl border border-black/8 bg-white px-4 py-2.5 text-sm text-black placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
      </div>

      <Button onClick={onPreview}>Confirm video</Button>

      {error && <Alert>{error}</Alert>}

      {videoId && (
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Selected YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}
    </Card>
  );
}
