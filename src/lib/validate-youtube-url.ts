const VIDEO_ID_PATTERN = /^[\w-]{11}$/;

function isValidVideoId(id: string): boolean {
  return VIDEO_ID_PATTERN.test(id);
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, "").replace(/^m\./, "");
}

export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = normalizeHost(url.hostname);

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id && isValidVideoId(id) ? id : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && isValidVideoId(id) ? id : null;
      }

      for (const prefix of ["/embed/", "/shorts/", "/live/", "/v/"]) {
        if (url.pathname.startsWith(prefix)) {
          const id = url.pathname.slice(prefix.length).split("/")[0];
          return id && isValidVideoId(id) ? id : null;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function validateYouTubeUrl(input: string): string | null {
  if (!input.trim()) {
    return "Please enter a YouTube URL.";
  }

  if (!parseYouTubeVideoId(input)) {
    return "Please enter a valid YouTube link.";
  }

  return null;
}
