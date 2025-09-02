"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageItem from "./MessageItem";
import StreamingMessage from "./StreamingMessage";
import EmptyState from "./EmptyState";
import { Message } from "./types";

interface ChatMessagesProps {
  messages: Message[];
  streaming: boolean;
  language: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  onBookAppointment: () => void;
}

export default function ChatMessages({
  messages,
  streaming,
  language,
  messagesContainerRef,
  onBookAppointment
}: ChatMessagesProps) {
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messagesContainerRef]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    if ((e.deltaY < 0 && scrollTop === 0) || 
        (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
      e.preventDefault();
    }
  };

  // Filter out any duplicate IDs and log them
  const uniqueMessages = messages.filter((message, index, array) => {
    const firstIndex = array.findIndex(m => m.id === message.id);
    if (firstIndex !== index) {
      console.warn("Duplicate message ID found:", message.id);
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 min-h-0 mb-6">
      <div 
        ref={messagesContainerRef}
        className="h-[400px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        onScroll={handleChatScroll}
        onWheel={handleWheel}
        style={{ 
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }}
      >
        <AnimatePresence mode="popLayout">
          {uniqueMessages.length === 0 && !streaming && (
            <EmptyState key="empty-state" language={language} />
          )}
          
          {uniqueMessages.map((msg, i) => (
            <MessageItem
              key={msg.id} // Use the unique ID as key
              message={msg}
              index={i}
              language={language}
              onBookAppointment={onBookAppointment}
            />
          ))}

          {streaming && (
            <StreamingMessage key="streaming" />
          )}
        </AnimatePresence>
        <div />
      </div>
    </div>
  );
}