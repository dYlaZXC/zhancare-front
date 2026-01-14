"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message, ProtocolSource } from "./types";
import { BookOpen, Bot, User, ExternalLink, X, FileText } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  onSourceClick?: (source: any) => void;
}

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ProtocolSource | null>(null);

  const handleSourceClick = (source: ProtocolSource) => {
    if (source.protocol_url) {
      setSelectedSource(source);
      setShowPdfModal(true);
    }
    onSourceClick?.(source);
  };

  return (
    <>
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
              ? ""
              : "bg-gradient-to-br from-green-500 to-teal-500"
          }`}
          style={isAssistant ? { background: 'linear-gradient(to bottom right, #3772ff, #2c5bcc)' } : undefined}
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
            className={`rounded-2xl px-6 py-5 ${
              isAssistant
                ? "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/20 shadow-xl"
                : "bg-gradient-to-r from-green-500 to-teal-500 shadow-lg"
            }`}
          >
            <div className="text-white leading-relaxed space-y-4" style={{ fontWeight: 300 }}>
              {message.content.split('\n\n').map((paragraph, idx) => {
                // Check if it starts with a main heading pattern (all caps or ends with specific markers)
                if (paragraph.match(/^[А-ЯЁ\s\-–—]+:/) || paragraph.match(/^HELLP/)) {
                  return (
                    <div key={idx} className="mb-4">
                      <h3 className="text-base text-white mb-3 pb-2 border-b border-white/20" style={{ fontWeight: 500 }}>
                        {paragraph}
                      </h3>
                    </div>
                  );
                }

                // Check if paragraph is a list item (starts with • or -)
                if (paragraph.includes('\n-') || paragraph.includes('\n•')) {
                  const lines = paragraph.split('\n');
                  const title = lines[0];
                  const items = lines.slice(1).filter(line => line.trim());

                  return (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      {title && !title.match(/^[-•]/) && (
                        <h4 className="text-sm text-white mb-3 flex items-center gap-2" style={{ fontWeight: 500 }}>
                          <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></span>
                          {title}
                        </h4>
                      )}
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex-shrink-0"></span>
                            <span className="text-white/90 text-sm leading-relaxed" style={{ fontWeight: 300 }}>{item.replace(/^[-•]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                // Check if it's a sub-heading (ends with :)
                if (paragraph.trim().endsWith(':') && paragraph.length < 100) {
                  return (
                    <h4 key={idx} className="text-sm font-semibold text-white mt-3 mb-2 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></span>
                      {paragraph}
                    </h4>
                  );
                }

                // Check if it starts with "Источник:" or "Примечание:"
                if (paragraph.match(/^(Источник|Примечание|Note|Source):/i)) {
                  return (
                    <div key={idx} className="bg-blue-500/10 border-l-4 border-blue-400 rounded-r-lg p-3 italic">
                      <p className="text-white/80 text-sm" style={{ fontWeight: 400 }}>
                        {paragraph}
                      </p>
                    </div>
                  );
                }

                // Regular paragraph with enhanced styling
                return (
                  <p key={idx} className="text-white/90 text-sm leading-relaxed" style={{ fontWeight: 400 }}>
                    {paragraph}
                  </p>
                );
              })}
            </div>

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
                  onClick={() => handleSourceClick(source)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-white/80 truncate">
                          {source.protocol_name}
                        </div>
                        {source.protocol_url && (
                          <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        )}
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
                    {source.protocol_url ? (
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    ) : (
                      <ExternalLink className="w-3 h-3 text-white/40 flex-shrink-0" />
                    )}
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

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPdfModal && selectedSource?.protocol_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPdfModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl h-[90vh] bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/10" style={{ background: 'linear-gradient(to right, #3772ff, #2c5bcc)' }}>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {selectedSource.protocol_name}
                    </h3>
                    <p className="text-white/70 text-xs">
                      {selectedSource.content_type_display} • Стр. {selectedSource.page_from}
                      {selectedSource.page_to && selectedSource.page_to !== selectedSource.page_from
                        ? `-${selectedSource.page_to}`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="w-full h-[calc(90vh-80px)]">
                <iframe
                  src={`${selectedSource.protocol_url}#page=${selectedSource.page_from || 1}`}
                  className="w-full h-full"
                  title={selectedSource.protocol_name}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
