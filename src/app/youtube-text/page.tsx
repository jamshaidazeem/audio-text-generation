import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { YouTubeUrlInput } from "@/components/YouTubeUrlInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "YouTube → Text — Audio → Text",
  description:
    "Paste a YouTube link to confirm the video and transcribe its audio into text.",
};

export default function YouTubeTextPage() {
  return (
    <PageShell>
      <BackLink label="Home" />
      <PageHeader
        title="YouTube → Text"
        description="Paste a YouTube URL to confirm the video you want to transcribe. Text generation is coming next."
      />
      <YouTubeUrlInput />
    </PageShell>
  );
}
