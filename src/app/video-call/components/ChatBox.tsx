"use client";

import React, { RefObject } from "react";

interface Message {
  user: string;
  response: string;
}

interface ChatBoxProps {
  messages: Message[];
  loading: boolean;
  error: string;
  chatBoxRef: RefObject<HTMLDivElement>;
  t: {
    typing: string;
    genericError: string;
  };
  formatResponse: (text: string) => string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, loading, error, chatBoxRef, t, formatResponse }) => {
  return (
    <div ref={chatBoxRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-sm">
      {messages.map((msg, idx) => (
        <div key={idx}>
          <div className="text-right">
            <div className="inline-block bg-blue-500 text-white p-2 rounded-lg max-w-[80%]">
              {msg.user}
            </div>
          </div>
          {msg.response && (
            <div className="text-left mt-1">
              <div
                className="inline-block bg-gray-200 text-gray-900 p-3 rounded-xl max-w-[90%] whitespace-pre-wrap leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ __html: formatResponse(msg.response) }}
              />
            </div>
          )}
        </div>
      ))}
      {loading && (
        <div className="text-left mt-1">
          <div className="inline-block bg-gray-200 text-gray-700 p-2 rounded-lg max-w-[80%]">
            {t.typing}...
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default ChatBox;
