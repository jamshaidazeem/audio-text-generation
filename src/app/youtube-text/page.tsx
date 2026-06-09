import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { YouTubeUrlInput } from "@/components/YouTubeUrlInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "YouTube → Text — Audio → Text",
  description:
    "Paste a YouTube link, confirm the video, and transcribe its audio into text via OpenAI Whisper.",
};

export default function YouTubeTextPage() {
  return (
    <PageShell>
      <BackLink label="Home" />
      <PageHeader
        title="YouTube → Text"
        description="Paste a YouTube URL, confirm the video, and transcribe its audio into text via OpenAI Whisper."
      />
      <YouTubeUrlInput />
    </PageShell>
  );
}
