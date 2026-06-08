import { ModelCard } from "@/components/ModelCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MODELS } from "@/lib/models";

export default function Home() {
  return (
    <PageShell>
      <PageHeader
        title="Audio → Text"
        description="Choose a transcription model to explore its capabilities, trade-offs, and upload interface."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {MODELS.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </PageShell>
  );
}
