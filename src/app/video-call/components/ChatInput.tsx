"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner } from "@fortawesome/free-solid-svg-icons";

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
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSend = () => {
    if (!loading && userInput.trim()) {
      sendMessage();
    }
  };

  return (
    <div className="relative p-4 border-t border-white/10 backdrop-blur-sm"
         style={{
           background: `
             linear-gradient(135deg,
               rgba(255, 255, 255, 0.08) 0%,
               rgba(55, 114, 255, 0.05) 100%
             )
           `
         }}>
      <div className="flex items-center gap-3">
        {/* Input Container */}
        <div className={`flex-1 relative transition-all duration-300 ${
          isFocused ? 'scale-[1.02]' : ''
        }`}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t.placeholder}
            disabled={loading}
            className={`w-full px-4 py-3 rounded-2xl text-white placeholder-white/50 text-sm transition-all duration-300 border backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(255, 255, 255, 0.1) 0%,
                  rgba(255, 255, 255, 0.05) 50%,
                  rgba(55, 114, 255, 0.08) 100%
                )
              `,
              borderColor: isFocused ? 'rgba(55, 114, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'
            }}
          />

          {/* Input glow effect */}
          <div className={`absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-300 -z-10 blur-lg ${
            isFocused ? 'opacity-30' : ''
          }`}
               style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading || !userInput.trim()}
          className={`relative group p-3 rounded-2xl transition-all duration-300 border backdrop-blur-md overflow-hidden min-w-[48px] min-h-[48px] flex items-center justify-center ${
            loading || !userInput.trim()
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 active:scale-95'
          }`}
          style={{
            background: loading || !userInput.trim()
              ? 'rgba(255, 255, 255, 0.1)'
              : `
                linear-gradient(135deg,
                  rgba(55, 114, 255, 0.8) 0%,
                  rgba(50, 103, 230, 0.9) 50%,
                  rgba(41, 53, 143, 0.8) 100%
                )
              `,
            borderColor: loading || !userInput.trim()
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(55, 114, 255, 0.4)'
          }}
          onMouseEnter={(e) => {
            if (!loading && userInput.trim()) {
              e.currentTarget.style.background = `
                linear-gradient(135deg,
                  rgba(55, 114, 255, 0.9) 0%,
                  rgba(50, 103, 230, 1) 50%,
                  rgba(41, 53, 143, 0.9) 100%
                )
              `;
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && userInput.trim()) {
              e.currentTarget.style.background = `
                linear-gradient(135deg,
                  rgba(55, 114, 255, 0.8) 0%,
                  rgba(50, 103, 230, 0.9) 50%,
                  rgba(41, 53, 143, 0.8) 100%
                )
              `;
            }
          }}
        >
          {loading ? (
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-white text-sm animate-spin"
            />
          ) : (
            <FontAwesomeIcon
              icon={faPaperPlane}
              className={`text-white text-sm transition-transform duration-300 ${
                !loading && userInput.trim() ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''
              }`}
            />
          )}

          {/* Button shimmer effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform transition-transform duration-1000 ${
            !loading && userInput.trim() ? 'group-hover:translate-x-[-200%]' : 'translate-x-full'
          }`}></div>

          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>

          {/* Button glow effect */}
          <div className={`absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-300 -z-10 blur-lg ${
            !loading && userInput.trim() ? 'group-hover:opacity-40' : ''
          }`}
               style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
        </button>
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
    </div>
  );
};

export default ChatInput;
