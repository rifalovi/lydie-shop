"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={`markdown-body ${className ?? ""}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-oif-blue mt-6 mb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-oif-blue mt-6 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-oif-gray-700 mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-oif-gray-700 leading-relaxed mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 text-sm text-oif-gray-700 mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 text-sm text-oif-gray-700 mb-3 space-y-1">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-oif-gray-900">
              {children}
            </strong>
          ),
          hr: () => <hr className="my-6 border-oif-gray-200" />,
          code: ({ children }) => (
            <code className="font-mono bg-oif-gray-100 text-oif-blue px-1 rounded text-xs">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
