import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { YouTubeUrlInput } from "@/components/YouTubeUrlInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "YouTube → Text — Audio → Text",
  description:
    "Preview a YouTube video, download the file, or generate a text transcript.",
};

export default function YouTubeTextPage() {
  return (
    <PageShell>
      <BackLink label="Home" />
      <PageHeader
        title="YouTube → Text"
        description="Preview a YouTube video, download the file, or generate a text transcript."
      />
      <YouTubeUrlInput />
    </PageShell>
  );
}
