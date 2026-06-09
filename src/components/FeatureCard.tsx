import Link from "next/link";

import { Card } from "@/components/ui/Card";

type FeatureCardProps = {
  title: string;
  summary: string;
  href: string;
  cta?: string;
};

export function FeatureCard({
  title,
  summary,
  href,
  cta = "Explore",
}: FeatureCardProps) {
  return (
    <Card className="flex flex-col">
      <h3 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {summary}
      </p>
      <div className="mt-4">
        <Link
          href={href}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
        >
          {cta}
        </Link>
      </div>
    </Card>
  );
}
