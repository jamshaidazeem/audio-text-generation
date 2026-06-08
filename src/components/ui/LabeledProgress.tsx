import { ProgressBar } from "@/components/ui/ProgressBar";

type LabeledProgressProps = {
  label: string;
  value: number;
  valueLabel?: string;
  indeterminate?: boolean;
};

export function LabeledProgress({
  label,
  value,
  valueLabel,
  indeterminate = false,
}: LabeledProgressProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        {valueLabel ? (
          <span className="font-medium text-black dark:text-zinc-50">
            {valueLabel}
          </span>
        ) : null}
      </div>
      <ProgressBar value={value} indeterminate={indeterminate} />
    </div>
  );
}
