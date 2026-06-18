import OpenAI from "openai";

export async function transcribeWithOpenAI(
  file: File,
  apiKey: string,
  model: string = "whisper-1",
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model,
  });

  return transcription.text;
}
