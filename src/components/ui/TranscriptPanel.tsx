type TranscriptPanelProps = {
  transcript: string;
};

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
        Transcript
      </h3>
      <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-200">
        {transcript}
      </p>
    </div>
  );
}
