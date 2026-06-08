type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </header>
  );
}
