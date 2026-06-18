import { Card } from "@/components/ui/Card";
import type { ModelConfig } from "@/lib/models";

type ModelInfoProps = {
  model: ModelConfig;
};

function BulletList({ title, items }: { title: string; items: string[] }) {
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

const SERVER_MODEL_COMPARISON = [
  { label: "Architecture",        whisper: "Whisper encoder-decoder", gpt4o: "GPT-4o audio" },
  { label: "Accuracy",            whisper: "Good",                    gpt4o: "Higher — better on accents, noise & technical terms" },
  { label: "Punctuation",         whisper: "Basic",                   gpt4o: "More natural, better capitalisation" },
  { label: "Languages",           whisper: "57+",                     gpt4o: "57+" },
  { label: "Price",               whisper: "$0.006 / min",            gpt4o: "$0.006 / min" },
  { label: "Project access",      whisper: "Must be enabled in OpenAI project settings", gpt4o: "Must be enabled in OpenAI project settings" },
  { label: "Best for",            whisper: "General use, reliability",gpt4o: "Quality-critical transcripts" },
];

function ServerModelComparison() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-black dark:text-zinc-50">
        Whisper 1 vs GPT-4o Transcribe
      </h3>
      <div className="overflow-x-auto rounded-xl border border-black/8 dark:border-white/[.145]">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="border-b border-black/8 px-4 py-2.5 text-left text-xs font-semibold text-black dark:border-white/[.145] dark:text-zinc-50 w-1/4"></th>
              <th className="border-b border-black/8 px-4 py-2.5 text-left text-xs font-semibold text-black dark:border-white/[.145] dark:text-zinc-50">
                whisper-1
              </th>
              <th className="border-b border-black/8 px-4 py-2.5 text-left text-xs font-semibold text-black dark:border-white/[.145] dark:text-zinc-50">
                gpt-4o-transcribe
              </th>
            </tr>
          </thead>
          <tbody>
            {SERVER_MODEL_COMPARISON.map((row, i) => {
              const isLast = i === SERVER_MODEL_COMPARISON.length - 1;
              const cellBase = `px-4 py-2.5 ${isLast ? "" : "border-b border-black/8 dark:border-white/[.145]"}`;
              const stripe = i % 2 === 1 ? "bg-zinc-50/50 dark:bg-white/[.02]" : "";
              return (
                <tr key={row.label} className={stripe}>
                  <td className={`${cellBase} text-xs font-medium text-black dark:text-zinc-50`}>
                    {row.label}
                  </td>
                  <td className={`${cellBase} text-zinc-600 dark:text-zinc-400`}>
                    {row.whisper}
                  </td>
                  <td className={`${cellBase} text-zinc-600 dark:text-zinc-400`}>
                    {row.gpt4o}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      {model.id === "server" && <ServerModelComparison />}
    </Card>
  );
}
