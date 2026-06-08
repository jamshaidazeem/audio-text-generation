import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/BackLink";
import { ModelInfo } from "@/components/ModelInfo";
import { TranscriptionUploader } from "@/components/TranscriptionUploader";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { getModelById } from "@/lib/models";

type ModelPageProps = {
  params: Promise<{ mode: string }>;
};

export async function generateMetadata({
  params,
}: ModelPageProps): Promise<Metadata> {
  const { mode } = await params;
  const model = getModelById(mode);

  if (!model) {
    return { title: "Model not found" };
  }

  return {
    title: `${model.title} — Audio → Text`,
    description: model.subtitle,
  };
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { mode } = await params;
  const model = getModelById(mode);

  if (!model) {
    notFound();
  }

  return (
    <PageShell>
      <BackLink />
      <PageHeader title={model.title} description={model.subtitle} />
      <ModelInfo model={model} />
      <TranscriptionUploader mode={model.transcriptionMode} />
    </PageShell>
  );
}
