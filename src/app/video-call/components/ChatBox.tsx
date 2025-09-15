"use client";

import React, { RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRobot, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

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
    <div
      ref={chatBoxRef}
      className="flex-1 p-4 overflow-y-auto space-y-4 text-sm relative"
      style={{
        background: `
          linear-gradient(135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(55, 114, 255, 0.02) 100%
          )
        `
      }}
    >
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20"
               style={{ background: 'rgba(55, 114, 255, 0.1)' }}>
            <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
          </div>
          <p className="text-white/70 text-sm">Начните разговор с AI ассистентом</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} className="space-y-3">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="group flex items-end gap-2 max-w-[80%]">
              <div className="relative overflow-hidden rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg"
                   style={{
                     background: `
                       linear-gradient(135deg,
                         rgba(55, 114, 255, 0.8) 0%,
                         rgba(50, 103, 230, 0.9) 50%,
                         rgba(41, 53, 143, 0.8) 100%
                       )
                     `
                   }}>
                <div className="px-4 py-3 text-white text-sm leading-relaxed">
                  {msg.user}
                </div>

                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
              </div>

              <div className="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg"
                   style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
                <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
              </div>
            </div>
          </div>

          {/* AI Response */}
          {msg.response && (
            <div className="flex justify-start">
              <div className="group flex items-end gap-2 max-w-[90%]">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg"
                     style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                  <FontAwesomeIcon icon={faRobot} className="text-white text-xs" />
                </div>

                <div className="relative overflow-hidden rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg"
                     style={{
                       background: `
                         linear-gradient(135deg,
                           rgba(255, 255, 255, 0.12) 0%,
                           rgba(255, 255, 255, 0.08) 50%,
                           rgba(55, 114, 255, 0.08) 100%
                         )
                       `
                     }}>
                  <div
                    className="px-4 py-3 text-white text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatResponse(msg.response) }}
                  />

                  {/* Glass effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-start">
          <div className="group flex items-end gap-2 max-w-[80%]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg"
                 style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
              <FontAwesomeIcon icon={faRobot} className="text-white text-xs" />
            </div>

            <div className="relative overflow-hidden rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg"
                 style={{
                   background: `
                     linear-gradient(135deg,
                       rgba(255, 255, 255, 0.12) 0%,
                       rgba(255, 255, 255, 0.08) 50%,
                       rgba(55, 114, 255, 0.08) 100%
                     )
                   `
                 }}>
              <div className="px-4 py-3 text-white/80 text-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                {t.typing}...
              </div>

              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border border-red-400/30 shadow-lg"
               style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <FontAwesomeIcon icon={faCircleExclamation} className="text-red-400 text-sm" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
