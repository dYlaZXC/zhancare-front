"use client";

import { motion } from "framer-motion";
import { Message } from "./types";
import { BookOpen, Bot, User, ExternalLink } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  onSourceClick?: (source: any) => void;
}

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 mb-6 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isAssistant
            ? "bg-gradient-to-br from-blue-500 to-purple-600"
            : "bg-gradient-to-br from-green-500 to-teal-600"
        }`}
      >
        {isAssistant ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 max-w-[80%] ${
          isAssistant ? "" : "flex flex-col items-end"
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-5 py-3 ${
            isAssistant
              ? "bg-white/10 backdrop-blur-sm border border-white/20"
              : "bg-gradient-to-r from-green-500 to-teal-500"
          }`}
        >
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Metadata */}
          {isAssistant && message.metadata && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3 text-xs text-white/60">
              <span>{message.metadata.model || "AI"}</span>
              {message.metadata.num_sources !== undefined && (
                <span>• {message.metadata.num_sources} источников</span>
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <BookOpen className="w-3 h-3" />
              <span>Источники:</span>
            </div>
            {message.sources.slice(0, 3).map((source, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSourceClick?.(source)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white/80 truncate">
                      {source.protocol_name}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {source.content_type_display} • Стр. {source.page_from}
                      {source.page_to && source.page_to !== source.page_from
                        ? `-${source.page_to}`
                        : ""}
                    </div>
                    <div className="text-xs text-white/50 mt-1 line-clamp-2">
                      {source.title}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/40 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
            {message.sources.length > 3 && (
              <div className="text-xs text-white/40 text-center">
                +{message.sources.length - 3} еще
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs text-white/40 mt-1 ${
            isAssistant ? "" : "text-right"
          }`}
        >
          {message.timestamp.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
