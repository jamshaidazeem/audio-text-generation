"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight text-black first:mt-0 dark:text-zinc-50">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-8 text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-6 text-base font-semibold text-black dark:text-zinc-50">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-black underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          if (isBlock) {
            return (
              <code className="block w-full overflow-x-auto whitespace-pre rounded-lg bg-zinc-100 px-4 py-3 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-4 overflow-x-auto rounded-lg bg-zinc-100 dark:bg-zinc-900">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-zinc-300 pl-4 text-sm italic text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto rounded-xl border border-black/8 dark:border-white/[.145]">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-zinc-50 dark:bg-zinc-900">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border-b border-black/8 px-4 py-2.5 text-left text-xs font-semibold text-black dark:border-white/[.145] dark:text-zinc-50">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-black/8 px-4 py-2.5 text-zinc-600 last:border-b-0 dark:border-white/[.145] dark:text-zinc-400">
            {children}
          </td>
        ),
        hr: () => (
          <hr className="my-8 border-black/8 dark:border-white/[.145]" />
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-black dark:text-zinc-50">
            {children}
          </strong>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
