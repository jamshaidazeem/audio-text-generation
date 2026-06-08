export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

export function isProbablyMp3(file: {
  name: string;
  type?: string;
}): boolean {
  const ext = getExtension(file.name);
  if (ext === "mp3") return true;
  if (file.type && file.type.toLowerCase() === "audio/mpeg") return true;
  return false;
}

export function validateMp3File(
  file: { name: string; type: string; size: number },
  maxBytes: number,
): string | null {
  if (!isProbablyMp3(file)) {
    return "Please choose an .mp3 file.";
  }

  if (file.size > maxBytes) {
    const maxMb = maxBytes / (1024 * 1024);
    return `File is too large. Max size is ${maxMb} MB.`;
  }

  return null;
}
