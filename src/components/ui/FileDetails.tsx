type FileDetailsProps = {
  name: string;
  extension: string;
  sizePretty: string;
  sizeBytes: number;
};

export function FileDetails({
  name,
  extension,
  sizePretty,
  sizeBytes,
}: FileDetailsProps) {
  return (
    <dl className="grid gap-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <dt className="text-zinc-600 dark:text-zinc-400">Name</dt>
        <dd className="max-w-full truncate font-medium text-black dark:text-zinc-50">
          {name}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-zinc-600 dark:text-zinc-400">Extension</dt>
        <dd className="font-medium text-black dark:text-zinc-50">
          {extension ? `.${extension}` : "—"}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-zinc-600 dark:text-zinc-400">Size</dt>
        <dd className="font-medium text-black dark:text-zinc-50">
          {sizePretty}{" "}
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            ({sizeBytes.toLocaleString()} bytes)
          </span>
        </dd>
      </div>
    </dl>
  );
}
