import type { ReactNode } from "react";

type AlertProps = {
  children: ReactNode;
};

export function Alert({ children }: AlertProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
      {children}
    </div>
  );
}
