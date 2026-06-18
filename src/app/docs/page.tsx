import fs from "fs";
import path from "path";
import Link from "next/link";

import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { PageShell } from "@/components/ui/PageShell";

export const metadata = { title: "Documentation" };

export default function DocsPage() {
  const readme = fs.readFileSync(
    path.join(process.cwd(), "README.md"),
    "utf-8",
  );

  return (
    <PageShell>
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Home
      </Link>
      <MarkdownRenderer content={readme} />
    </PageShell>
  );
}
