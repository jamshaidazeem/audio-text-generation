import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import youtubedl from "youtube-dl-exec";

import {
  MAX_YOUTUBE_DOWNLOAD_BYTES,
  MAX_YOUTUBE_DOWNLOAD_LABEL,
} from "@/lib/youtube-constants";
import {
  isYouTubePipelineError,
  mapYtDlpError,
  YouTubePipelineError,
} from "@/lib/youtube-errors";

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  m4a: "audio/mp4",
  opus: "audio/opus",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  "3gp": "video/3gpp",
};

export type YouTubeMediaDownload = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

function isCompletedDownload(filename: string): boolean {
  return (
    !filename.endsWith(".part") &&
    !filename.endsWith(".ytdl") &&
    !filename.endsWith(".temp")
  );
}

function contentTypeForFilename(filename: string): string {
  const extension = path.extname(filename).slice(1).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

export async function downloadYouTubeMedia(
  videoId: string,
): Promise<YouTubeMediaDownload> {
  let tempDir: string;

  try {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "yt-download-"));
  } catch {
    throw new YouTubePipelineError(
      "extraction_setup",
      "Could not create a temporary folder for the download.",
    );
  }

  const outputTemplate = path.join(tempDir, `${videoId}.%(ext)s`);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    try {
      await youtubedl(url, {
        output: outputTemplate,
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
        "Download finished but the file could not be read.",
      );
    }

    const downloadedFile = files.find(isCompletedDownload);

    if (!downloadedFile) {
      throw new YouTubePipelineError(
        "extraction_read",
        "Download finished but no media file was produced.",
      );
    }

    const filePath = path.join(tempDir, downloadedFile);
    let buffer: Buffer;

    try {
      buffer = await fs.readFile(filePath);
    } catch {
      throw new YouTubePipelineError(
        "extraction_read",
        "Could not read the downloaded file from disk.",
      );
    }

    if (buffer.length === 0) {
      throw new YouTubePipelineError(
        "extraction_read",
        "Downloaded file is empty.",
      );
    }

    if (buffer.length > MAX_YOUTUBE_DOWNLOAD_BYTES) {
      throw new YouTubePipelineError(
        "extraction_read",
        `Downloaded file is too large. Maximum size is ${MAX_YOUTUBE_DOWNLOAD_LABEL}.`,
      );
    }

    return {
      buffer,
      filename: downloadedFile,
      contentType: contentTypeForFilename(downloadedFile),
    };
  } catch (error) {
    if (isYouTubePipelineError(error)) {
      throw error;
    }

    throw mapYtDlpError(error);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
