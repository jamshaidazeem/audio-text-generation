import Link from "next/link";

type BackLinkProps = {
  label?: string;
};

export function BackLink({ label = "All models" }: BackLinkProps) {
  return (
    <Link
      href="/"
      className="mb-4 inline-flex items-center text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      ← {label}
    </Link>
  );
}
