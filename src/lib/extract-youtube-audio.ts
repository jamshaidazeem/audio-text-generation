import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import youtubedl from "youtube-dl-exec";

import {
  MAX_YOUTUBE_AUDIO_BYTES,
  MAX_YOUTUBE_AUDIO_LABEL,
  MAX_YOUTUBE_DURATION_SECONDS,
} from "@/lib/youtube-constants";
import {
  isYouTubePipelineError,
  mapYtDlpError,
  YouTubePipelineError,
} from "@/lib/youtube-errors";

export { YouTubePipelineError as YouTubeExtractionError } from "@/lib/youtube-errors";

export async function extractYouTubeAudio(videoId: string): Promise<File> {
  let tempDir: string;

  try {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "yt-audio-"));
  } catch {
    throw new YouTubePipelineError(
      "extraction_setup",
      "Could not create a temporary folder for audio extraction.",
    );
  }

  const outputTemplate = path.join(tempDir, `${videoId}.%(ext)s`);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    try {
      await youtubedl(url, {
        extractAudio: true,
        audioFormat: "mp3",
        output: outputTemplate,
        noPlaylist: true,
        matchFilter: `duration <= ${MAX_YOUTUBE_DURATION_SECONDS}`,
        noWarnings: true,
      });
    } catch (error) {
      if (isYouTubePipelineError(error)) {
        throw error;
      }

      throw mapYtDlpError(error);
    }

    let files: string[];

    try {
      files = await fs.readdir(tempDir);
    } catch {
      throw new YouTubePipelineError(
        "extraction_read",
        "Download finished but the audio file could not be read.",
      );
    }

    const audioFile = files.find((file) => file.endsWith(".mp3"));

    if (!audioFile) {
      throw new YouTubePipelineError(
        "extraction_read",
        "Download finished but no MP3 audio file was produced.",
      );
    }

    const filePath = path.join(tempDir, audioFile);
    let buffer: Buffer;

    try {
      buffer = await fs.readFile(filePath);
    } catch {
      throw new YouTubePipelineError(
        "extraction_read",
        "Could not read the extracted audio file from disk.",
      );
    }

    if (buffer.length === 0) {
      throw new YouTubePipelineError(
        "extraction_read",
        "Extracted audio file is empty.",
      );
    }

    if (buffer.length > MAX_YOUTUBE_AUDIO_BYTES) {
      throw new YouTubePipelineError(
        "extraction_read",
        `Extracted audio is too large. Maximum size is ${MAX_YOUTUBE_AUDIO_LABEL}.`,
      );
    }

    return new File([new Uint8Array(buffer)], `${videoId}.mp3`, {
      type: "audio/mpeg",
    });
  } catch (error) {
    if (isYouTubePipelineError(error)) {
      throw error;
    }

    throw mapYtDlpError(error);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
