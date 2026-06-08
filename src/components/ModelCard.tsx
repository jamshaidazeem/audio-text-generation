import Link from "next/link";

import { Card } from "@/components/ui/Card";
import type { ModelConfig } from "@/lib/models";

type ModelCardProps = {
  model: ModelConfig;
};

export function ModelCard({ model }: ModelCardProps) {
  return (
    <Card className="flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        {model.title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {model.summary}
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        {model.modelName} · max {model.maxUploadLabel}
      </p>
      <div className="mt-4">
        <Link
          href={model.href}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
        >
          Explore
        </Link>
      </div>
    </Card>
  );
}
