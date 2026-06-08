import { Card } from "@/components/ui/Card";
import type { ModelConfig } from "@/lib/models";

type ModelInfoProps = {
  model: ModelConfig;
};

function BulletList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
        {title}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ModelInfo({ model }: ModelInfoProps) {
  return (
    <Card className="mb-6 space-y-5">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Model:{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {model.modelName}
        </span>{" "}
        · Max upload:{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {model.maxUploadLabel}
        </span>
      </p>
      <BulletList title="Capabilities" items={model.capabilities} />
      <BulletList title="Pros" items={model.pros} />
      <BulletList title="Cons" items={model.cons} />
    </Card>
  );
}
