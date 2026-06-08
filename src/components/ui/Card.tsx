import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "dashed";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "rounded-xl border border-black/8 bg-zinc-50 p-4 dark:border-white/[.145] dark:bg-white/4",
  elevated:
    "rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black",
  dashed:
    "rounded-xl border border-dashed border-black/8 p-4 dark:border-white/[.145]",
};

export function Card({
  children,
  variant = "default",
  className = "",
}: CardProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
