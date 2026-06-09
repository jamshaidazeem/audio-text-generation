import { NextResponse } from "next/server";

import { getYouTubeVideoDuration } from "@/lib/get-youtube-video-info";
import {
  isYouTubePipelineError,
  YouTubePipelineError,
} from "@/lib/youtube-errors";
import { isValidYouTubeVideoId } from "@/lib/validate-youtube-url";

export const maxDuration = 60;

type YouTubeErrorResponse = {
  error: string;
  step: YouTubePipelineError["step"];
};

function errorResponse(
  step: YouTubePipelineError["step"],
  message: string,
  status: number,
) {
  return NextResponse.json({ error: message, step } satisfies YouTubeErrorResponse, {
    status,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("request", "Invalid JSON body.", 400);
  }

  const videoId =
    typeof body === "object" &&
    body !== null &&
    "videoId" in body &&
    typeof body.videoId === "string"
      ? body.videoId
      : null;

  if (!videoId) {
    return errorResponse("request", "A YouTube video ID is required.", 400);
  }

  if (!isValidYouTubeVideoId(videoId)) {
    return errorResponse(
      "request",
      "The video ID format is invalid.",
      400,
    );
  }

  try {
    const durationSeconds = await getYouTubeVideoDuration(videoId);
    return NextResponse.json({ durationSeconds });
  } catch (error) {
    if (isYouTubePipelineError(error)) {
      return errorResponse(error.step, error.message, 400);
    }

    return errorResponse(
      "extraction_download",
      "Failed to fetch video information.",
      400,
    );
  }
}
