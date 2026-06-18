import { NextResponse } from "next/server";

import { transcribeWithOpenAI } from "@/lib/transcribe-openai";
import {
  isValidOpenAITranscriptionModelId,
} from "@/lib/models";
import { MAX_SERVER_UPLOAD_BYTES } from "@/lib/upload-constants";
import { validateAudioUpload } from "@/lib/validate-audio-upload";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const validationError = validateAudioUpload(file, MAX_SERVER_UPLOAD_BYTES);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const rawModel = formData.get("model");
  const model =
    typeof rawModel === "string" && isValidOpenAITranscriptionModelId(rawModel)
      ? rawModel
      : "whisper-1";

  try {
    const text = await transcribeWithOpenAI(file, apiKey, model);
    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
