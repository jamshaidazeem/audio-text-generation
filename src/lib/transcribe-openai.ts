import OpenAI from "openai";

export async function transcribeWithOpenAI(
  file: File,
  apiKey: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text;
}
