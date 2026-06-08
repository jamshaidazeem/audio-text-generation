type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
  );
}
