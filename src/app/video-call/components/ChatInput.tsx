"use client";

import React from "react";

interface ChatInputProps {
  userInput: string;
  setUserInput: (value: string) => void;
  sendMessage: () => void;
  loading: boolean;
  t: {
    placeholder: string;
    sending: string;
    sendButton: string;
  };
}

const ChatInput: React.FC<ChatInputProps> = ({
  userInput,
  setUserInput,
  sendMessage,
  loading,
  t,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="p-3 border-t bg-white flex items-center space-x-2">
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.placeholder}
        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none"
        disabled={loading}
      />
      <button
        onClick={sendMessage}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white font-medium ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? t.sending : t.sendButton}
      </button>
    </div>
  );
};

export default ChatInput;
