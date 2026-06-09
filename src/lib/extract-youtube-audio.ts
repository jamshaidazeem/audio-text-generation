import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import youtubedl from "youtube-dl-exec";

import {
  getExtension,
  getSupportedFormatsLabel,
  isSupportedAudioUpload,
  mimeTypeForExtension,
} from "@/lib/validate-audio-upload";
import {
  MAX_YOUTUBE_AUDIO_BYTES,
  MAX_YOUTUBE_AUDIO_LABEL,
} from "@/lib/youtube-constants";
import {
  isYouTubePipelineError,
  mapYtDlpError,
  YouTubePipelineError,
} from "@/lib/youtube-errors";

export { YouTubePipelineError as YouTubeExtractionError } from "@/lib/youtube-errors";

function isCompletedDownload(filename: string): boolean {
  return (
    !filename.endsWith(".part") &&
    !filename.endsWith(".ytdl") &&
    !filename.endsWith(".temp")
  );
}

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
        output: outputTemplate,
        format: "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
        noPlaylist: true,
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

    const audioFile = files.find(isCompletedDownload);

    if (!audioFile) {
      throw new YouTubePipelineError(
        "extraction_read",
        "Download finished but no audio file was produced.",
      );
    }

    if (
      !isSupportedAudioUpload({
        name: audioFile,
      })
    ) {
      const ext = getExtension(audioFile);
      throw new YouTubePipelineError(
        "extraction_read",
        ext
          ? `Downloaded audio format ".${ext}" is not supported for transcription. Supported formats: ${getSupportedFormatsLabel()}.`
          : `Downloaded audio format is not supported for transcription. Supported formats: ${getSupportedFormatsLabel()}.`,
      );
    }

    const filePath = path.join(tempDir, audioFile);
    let buffer: Buffer;

    try {
      buffer = await fs.readFile(filePath);
    } catch {
      throw new YouTubePipelineError(
        "extraction_read",
        "Could not read the downloaded audio file from disk.",
      );
    }

    if (buffer.length === 0) {
      throw new YouTubePipelineError(
        "extraction_read",
        "Downloaded audio file is empty.",
      );
    }

    if (buffer.length > MAX_YOUTUBE_AUDIO_BYTES) {
      throw new YouTubePipelineError(
        "extraction_read",
        `Downloaded audio is too large. Maximum size is ${MAX_YOUTUBE_AUDIO_LABEL}.`,
      );
    }

    const ext = getExtension(audioFile);
    const mimeType = mimeTypeForExtension(ext) ?? "application/octet-stream";

    return new File([new Uint8Array(buffer)], audioFile, {
      type: mimeType,
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
