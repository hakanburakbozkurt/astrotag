"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-lg font-semibold tracking-tight text-white/95">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 text-base font-semibold text-violet-200/95 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold text-white/90">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-white/70">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm text-white/70">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-white/70">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white/85">{children}</strong>
  ),
  em: ({ children }) => <em className="text-white/75 italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-violet-400/40 pl-3 text-sm text-white/60 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-white/10" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-300 underline decoration-violet-400/40 underline-offset-2 hover:text-violet-200"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[280px] text-left text-xs text-white/70">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/50">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3 py-2 font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-3 py-2 align-top">{children}</td>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-violet-200/90">
      {children}
    </code>
  ),
};

type LegalMarkdownContentProps = {
  markdown: string;
};

export default function LegalMarkdownContent({ markdown }: LegalMarkdownContentProps) {
  return (
    <article className="legal-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
