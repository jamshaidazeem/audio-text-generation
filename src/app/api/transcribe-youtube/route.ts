import { NextResponse } from "next/server";

import { extractYouTubeAudio } from "@/lib/extract-youtube-audio";
import { isValidOpenAITranscriptionModelId } from "@/lib/models";
import { transcribeWithOpenAI } from "@/lib/transcribe-openai";
import {
  isYouTubePipelineError,
  mapOpenAITranscriptionError,
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
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return errorResponse(
      "config",
      "OpenAI API key is not configured.",
      500,
    );
  }

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

  const rawModel =
    typeof body === "object" &&
    body !== null &&
    "model" in body &&
    typeof body.model === "string"
      ? body.model
      : null;

  const model =
    rawModel && isValidOpenAITranscriptionModelId(rawModel)
      ? rawModel
      : "whisper-1";

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

  let file: File;

  try {
    file = await extractYouTubeAudio(videoId);
  } catch (error) {
    if (isYouTubePipelineError(error)) {
      return errorResponse(error.step, error.message, 400);
    }

    return errorResponse(
      "extraction_download",
      "Failed to extract audio from this video.",
      400,
    );
  }

  try {
    const text = await transcribeWithOpenAI(file, apiKey, model);
    return NextResponse.json({ text });
  } catch (error) {
    const mapped = mapOpenAITranscriptionError(error);
    return errorResponse(mapped.step, mapped.message, 500);
  }
}
