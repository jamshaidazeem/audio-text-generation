export const SUPPORTED_AUDIO_EXTENSIONS = [
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "m4a",
  "wav",
  "webm",
] as const;

export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "video/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/webm",
  "video/webm",
] as const;

const MIME_BY_EXTENSION: Record<(typeof SUPPORTED_AUDIO_EXTENSIONS)[number], string> =
  {
    mp3: "audio/mpeg",
    mpeg: "audio/mpeg",
    mpga: "audio/mpeg",
    mp4: "video/mp4",
    m4a: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
  };

const SUPPORTED_EXTENSION_SET = new Set<string>(SUPPORTED_AUDIO_EXTENSIONS);
const SUPPORTED_MIME_SET = new Set<string>(
  SUPPORTED_AUDIO_MIME_TYPES.map((mime) => mime.toLowerCase()),
);

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

export function mimeTypeForExtension(ext: string): string | undefined {
  return MIME_BY_EXTENSION[ext as (typeof SUPPORTED_AUDIO_EXTENSIONS)[number]];
}

export function isSupportedAudioUpload(file: {
  name: string;
  type?: string;
}): boolean {
  const ext = getExtension(file.name);
  if (SUPPORTED_EXTENSION_SET.has(ext)) return true;

  if (file.type && SUPPORTED_MIME_SET.has(file.type.toLowerCase())) {
    return true;
  }

  return false;
}

export function getSupportedFormatsLabel(): string {
  return SUPPORTED_AUDIO_EXTENSIONS.join(", ");
}

export function getFileInputAccept(): string {
  const mimeTypes = SUPPORTED_AUDIO_MIME_TYPES.join(",");
  const extensions = SUPPORTED_AUDIO_EXTENSIONS.map((ext) => `.${ext}`).join(
    ",",
  );
  return `${mimeTypes},${extensions}`;
}

export function validateAudioUpload(
  file: { name: string; type: string; size: number },
  maxBytes: number,
): string | null {
  if (!isSupportedAudioUpload(file)) {
    return `Please choose a supported audio file (${getSupportedFormatsLabel()}).`;
  }

  if (file.size > maxBytes) {
    const maxMb = maxBytes / (1024 * 1024);
    return `File is too large. Max size is ${maxMb} MB.`;
  }

  return null;
}
