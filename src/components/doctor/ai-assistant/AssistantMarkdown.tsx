"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the assistant's markdown reply (###, **bold**, lists, ---) as
 * actual formatted text instead of raw syntax — scaled down for a chat
 * bubble, same ReactMarkdown + remark-gfm setup already used elsewhere
 * (src/sections/ProtocolAI/ChatMessage.tsx) rather than a new dependency.
 */
export default function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h3 className="text-base font-bold text-gray-900 mt-3 mb-1.5" {...props} />,
          h2: ({ node, ...props }) => <h3 className="text-base font-bold text-gray-900 mt-3 mb-1.5" {...props} />,
          h3: ({ node, ...props }) => <h4 className="text-sm font-bold text-gray-900 mt-3 mb-1.5" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-sm font-semibold text-gray-800 mt-2 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2" {...props} />,
          ul: ({ node, ...props }) => <ul className="space-y-1 my-2 ml-4 list-disc" {...props} />,
          ol: ({ node, ...props }) => <ol className="space-y-1 my-2 ml-4 list-decimal" {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-3 border-gray-200" {...props} />,
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-gray-200/70 text-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props} />
            ) : (
              <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2" {...props} />
            ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic text-gray-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
