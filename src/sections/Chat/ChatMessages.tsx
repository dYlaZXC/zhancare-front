"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import MessageItem from "./MessageItem";
import StreamingMessage from "./StreamingMessage";
import EmptyState from "./EmptyState";
import { Message } from "./types";

interface ChatMessagesProps {
  messages: Message[];
  streaming: boolean;
  streamingMessageId: string | null;
  language: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  onBookAppointment: () => void;
  expanded?: boolean;
}

export default function ChatMessages({
  messages,
  streaming,
  streamingMessageId,
  language,
  messagesContainerRef,
  onBookAppointment,
  expanded = false,
}: ChatMessagesProps) {
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messagesContainerRef]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if ((e.deltaY < 0 && scrollTop === 0) ||
        (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
      e.preventDefault();
    }
  };

  const handleScrollToBottom = () => {
    isNearBottomRef.current = true;
    setShowScrollButton(false);
    scrollToBottom();
  };

  const uniqueMessages = messages.filter((message, index, array) => {
    const firstIndex = array.findIndex(m => m.id === message.id);
    if (firstIndex !== index) {
      console.warn("Duplicate message ID found:", message.id);
      return false;
    }
    return true;
  });

  const hasContent = uniqueMessages.length > 0 || streaming;

  return (
    <div className={`${expanded ? "flex-1 flex flex-col" : ""} min-h-0 mb-6 relative`}>
      <style>{`
        .zhan-scroll::-webkit-scrollbar { width: 4px; }
        .zhan-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          margin: 6px 0;
        }
        .zhan-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #4F7FFF 0%, #00C6FF 100%);
          border-radius: 10px;
          box-shadow: 0 0 8px rgba(79,127,255,0.5);
        }
        .zhan-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #6AA2FF 0%, #00E5FF 100%);
          box-shadow: 0 0 14px rgba(79,127,255,0.75);
        }
        .zhan-scroll { scrollbar-width: thin; scrollbar-color: #4F7FFF transparent; }
      `}</style>
      <div
        ref={messagesContainerRef}
        className={`${expanded ? "flex-1" : "h-[520px]"} overflow-y-auto flex flex-col pr-1 zhan-scroll`}
        onScroll={handleChatScroll}
        onWheel={handleWheel}
        style={{ scrollBehavior: "smooth", overscrollBehavior: "contain" }}
      >
        <AnimatePresence mode="sync">
          {!hasContent ? (
            <motion.div
              key="empty"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState language={language} />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              className="flex flex-col flex-1"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex-1" />
              <div className="space-y-4 pb-1">
                <AnimatePresence mode="popLayout">
                  {uniqueMessages.map((msg, i) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      index={i}
                      language={language}
                      onBookAppointment={onBookAppointment}
                      isStreaming={msg.id === streamingMessageId}
                    />
                  ))}
                  {streaming && uniqueMessages[uniqueMessages.length - 1]?.text === "" && (
                    <StreamingMessage key="streaming" />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={handleScrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-[#3A50FF] hover:bg-[#001E80] text-white text-xs font-medium rounded-full shadow-lg transition-colors"
          >
            <FaChevronDown size={10} />
            <span>scroll down</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
