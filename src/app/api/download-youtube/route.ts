import { NextResponse } from "next/server";

import { downloadYouTubeMedia } from "@/lib/download-youtube-media";
import {
  isYouTubePipelineError,
  YouTubePipelineError,
} from "@/lib/youtube-errors";
import { isValidYouTubeVideoId } from "@/lib/validate-youtube-url";

export const maxDuration = 300;

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
    const { buffer, filename, contentType } = await downloadYouTubeMedia(videoId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    if (isYouTubePipelineError(error)) {
      return errorResponse(error.step, error.message, 400);
    }

    return errorResponse(
      "extraction_download",
      "Failed to download this video.",
      400,
    );
  }
}
