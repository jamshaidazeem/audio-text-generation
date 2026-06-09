import { FeatureCard } from "@/components/FeatureCard";
import { ModelCard } from "@/components/ModelCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MODELS } from "@/lib/models";

export default function Home() {
  return (
    <PageShell>
      <PageHeader
        title="Audio → Text"
        description="Transcribe MP3 uploads or YouTube video audio into text."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {MODELS.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
          YouTube → Text
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureCard
            title="YouTube → Text"
            summary="Paste a YouTube URL to transcribe the video's audio into text."
            href="/youtube-text"
          />
        </div>
      </section>
    </PageShell>
  );
}
