type ProgressBarProps = {
  value: number;
  indeterminate?: boolean;
};

export function ProgressBar({ value, indeterminate = false }: ProgressBarProps) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100 ${
          indeterminate ? "w-1/3 animate-pulse" : ""
        }`}
        style={indeterminate ? undefined : { width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
