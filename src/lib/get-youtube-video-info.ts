import youtubedl from "youtube-dl-exec";

import {
  isYouTubePipelineError,
  mapYtDlpError,
  YouTubePipelineError,
} from "@/lib/youtube-errors";

type YtDlpMetadata = {
  duration?: number;
};

function parseMetadata(output: unknown): YtDlpMetadata {
  if (typeof output === "string") {
    return JSON.parse(output) as YtDlpMetadata;
  }

  return output as YtDlpMetadata;
}

export async function getYouTubeVideoDuration(videoId: string): Promise<number> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      skipDownload: true,
      noPlaylist: true,
      noWarnings: true,
    });

    const duration = parseMetadata(output).duration;

    if (typeof duration !== "number" || duration <= 0) {
      throw new YouTubePipelineError(
        "extraction_download",
        "Could not determine video duration.",
      );
    }

    return duration;
  } catch (error) {
    if (isYouTubePipelineError(error)) {
      throw error;
    }

    throw mapYtDlpError(error);
  }
}
