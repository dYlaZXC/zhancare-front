"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ProtocolSource, InteractiveProtocol, Protocol } from "./types";
import { BookOpen, Bot, User, ExternalLink, X, FileText, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { InteractiveProtocols } from "./InteractiveProtocols";

interface ChatMessageProps {
  message: Message;
  onSourceClick?: (source: any) => void;
  onProtocolClick?: (protocol: InteractiveProtocol) => void;
  onQuickAction?: (action: string, protocol?: InteractiveProtocol) => void;
  onProtocolSelectFromSearch?: (protocol: Protocol) => void;
  allProtocols?: Protocol[];
  onSuggestedQuestion?: (question: string) => void;
}

export function ChatMessage({ message, onSourceClick, onProtocolClick, onQuickAction, onProtocolSelectFromSearch, allProtocols = [], onSuggestedQuestion }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ProtocolSource | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleSourceClick = (source: ProtocolSource) => {
    if (source.protocol_url) {
      setSelectedSource(source);
      setShowPdfModal(true);
    }
    onSourceClick?.(source);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedback(type);

    // TODO: Send feedback to backend API
    console.log('Feedback:', {
      messageId: message.id,
      type,
      question: message.content,
    });

    // Show thank you message
    setTimeout(() => {
      // Could add a toast notification here
    }, 500);
  };

  // Generate smart suggested questions based on the answer
  const generateSuggestedQuestions = (): string[] => {
    const content = message.content.toLowerCase();
    const suggestions: string[] = [];

    // Check what the answer is about and suggest relevant follow-ups
    if (content.includes('диагност') || content.includes('критери')) {
      suggestions.push('Какая тактика лечения?');
      suggestions.push('Какие возможны осложнения?');
    } else if (content.includes('лечени') || content.includes('терапи')) {
      suggestions.push('Какие диагностические критерии?');
      suggestions.push('Какие показания и противопоказания?');
    } else if (content.includes('осложнени')) {
      suggestions.push('Как проводится профилактика?');
      suggestions.push('Какая тактика лечения осложнений?');
    } else {
      // Default suggestions
      suggestions.push('Расскажи подробнее');
      suggestions.push('Какие есть альтернативы?');
    }

    // Always add a general question
    suggestions.push('Что еще важно знать?');

    return suggestions.slice(0, 3); // Return max 3 suggestions
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
            className={`rounded-2xl px-6 py-5 shadow-lg relative group ${
              isAssistant
                ? "bg-white border border-gray-200"
                : "bg-gradient-to-r from-blue-500 to-blue-600 shadow-xl"
            }`}
          >
            {/* Copy Button - only for assistant messages */}
            {isAssistant && (
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 hover:bg-gray-200 rounded-lg p-2"
                title="Копировать ответ"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}

            {/* Markdown Content */}
            <div className={`markdown-content leading-relaxed ${isAssistant ? 'text-gray-800' : 'text-white'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({node, ...props}) => <h1 className={`text-xl font-bold mb-4 pb-2 ${isAssistant ? 'text-gray-900 border-b border-gray-200' : 'text-white border-b border-white/20'}`} {...props} />,
                  h2: ({node, ...props}) => <h2 className={`text-lg font-bold mb-3 mt-6 pb-2 ${isAssistant ? 'text-gray-900 border-b border-gray-200' : 'text-white border-b border-white/20'}`} {...props} />,
                  h3: ({node, ...props}) => <h3 className={`text-base font-semibold mb-2 mt-4 ${isAssistant ? 'text-gray-800' : 'text-white'}`} {...props} />,
                  h4: ({node, ...props}) => <h4 className={`text-sm font-semibold mb-2 mt-3 ${isAssistant ? 'text-gray-700' : 'text-white/90'}`} {...props} />,

                  // Paragraphs
                  p: ({node, ...props}) => <p className={`text-sm leading-relaxed mb-3 ${isAssistant ? 'text-gray-700' : 'text-white'}`} {...props} />,

                  // Lists
                  ul: ({node, ...props}) => <ul className="space-y-2 my-3 ml-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="space-y-2 my-3 ml-4 list-decimal" {...props} />,
                  li: ({node, ...props}) => (
                    <li className={`flex gap-2 items-start text-sm ${isAssistant ? 'text-gray-700' : 'text-white'}`}>
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAssistant ? 'bg-gradient-to-br from-blue-400 to-cyan-400' : 'bg-white'}`}></span>
                      <span className="flex-1" {...props} />
                    </li>
                  ),

                  // Strong/Bold
                  strong: ({node, ...props}) => <strong className={`font-semibold ${isAssistant ? 'text-gray-900' : 'text-white'}`} {...props} />,

                  // Em/Italic
                  em: ({node, ...props}) => <em className={`italic ${isAssistant ? 'text-gray-600' : 'text-white/80'}`} {...props} />,

                  // Code blocks
                  code: ({node, inline, ...props}: any) =>
                    inline ? (
                      <code className={isAssistant ? 'bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono' : 'bg-white/20 text-white px-1.5 py-0.5 rounded text-xs font-mono'} {...props} />
                    ) : (
                      <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto my-3" {...props} />
                    ),

                  // Blockquotes
                  blockquote: ({node, ...props}) => (
                    <blockquote className={isAssistant ? 'border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-3 italic text-blue-700' : 'border-l-4 border-white/40 bg-white/10 pl-4 py-2 my-3 italic text-white/90'} {...props} />
                  ),

                  // Horizontal rule
                  hr: ({node, ...props}) => <hr className="my-4 border-gray-200" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Old manual parsing code - REMOVED */}
          {false && (
            <div className={`leading-relaxed space-y-4 ${isAssistant ? 'text-gray-800' : 'text-white'}`} style={{ fontWeight: 300 }}>
              {message.content.split('\n\n').map((paragraph, idx) => {
                const textColor = isAssistant ? 'text-gray-900' : 'text-white';
                const borderColor = isAssistant ? 'border-gray-200' : 'border-white/20';

                // Check if it starts with a main heading pattern (all caps or ends with specific markers)
                if (paragraph.match(/^[А-ЯЁ\s\-–—]+:/) || paragraph.match(/^HELLP/)) {
                  return (
                    <div key={idx} className="mb-4">
                      <h3 className={`text-base ${textColor} mb-3 pb-2 border-b ${borderColor}`} style={{ fontWeight: 500 }}>
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
                  const bgColor = isAssistant ? 'bg-blue-50' : 'bg-white/5';
                  const itemTextColor = isAssistant ? 'text-gray-700' : 'text-white/90';

                  return (
                    <div key={idx} className={`${bgColor} rounded-xl p-4 border ${borderColor}`}>
                      {title && !title.match(/^[-•]/) && (
                        <h4 className={`text-sm ${textColor} mb-3 flex items-center gap-2`} style={{ fontWeight: 500 }}>
                          <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></span>
                          {title}
                        </h4>
                      )}
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex-shrink-0"></span>
                            <span className={`${itemTextColor} text-sm leading-relaxed`} style={{ fontWeight: 300 }}>{item.replace(/^[-•]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                // Check if it's a sub-heading (ends with :)
                if (paragraph.trim().endsWith(':') && paragraph.length < 100) {
                  return (
                    <h4 key={idx} className={`text-sm font-semibold ${textColor} mt-3 mb-2 flex items-center gap-2`} style={{ fontWeight: 600 }}>
                      <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></span>
                      {paragraph}
                    </h4>
                  );
                }

                // Check if it starts with "Источник:" or "Примечание:"
                if (paragraph.match(/^(Источник|Примечание|Note|Source):/i)) {
                  const noteTextColor = isAssistant ? 'text-blue-700' : 'text-white/80';
                  const noteBgColor = isAssistant ? 'bg-blue-100' : 'bg-blue-500/10';
                  return (
                    <div key={idx} className={`${noteBgColor} border-l-4 border-blue-400 rounded-r-lg p-3 italic`}>
                      <p className={`${noteTextColor} text-sm`} style={{ fontWeight: 400 }}>
                        {paragraph}
                      </p>
                    </div>
                  );
                }

                // Regular paragraph with enhanced styling
                const regularTextColor = isAssistant ? 'text-gray-700' : 'text-white/90';
                return (
                  <p key={idx} className={`${regularTextColor} text-sm leading-relaxed`} style={{ fontWeight: 400 }}>
                    {paragraph}
                  </p>
                );
              })}
            </div>
          )}

          {/* Interactive Protocol Pills */}
          {isAssistant && message.metadata?.interactive_protocols && message.metadata.interactive_protocols.length > 0 && (
            <InteractiveProtocols
              protocols={message.metadata.interactive_protocols}
              onProtocolClick={onProtocolClick || (() => {})}
              onQuickAction={onQuickAction}
            />
          )}

          {/* Sources */}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <BookOpen className="w-3 h-3" />
                <span>Источники:</span>
              </div>
              {message.sources.slice(0, 3).map((source, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
                  onClick={() => handleSourceClick(source)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-gray-800 truncate">
                          {source.protocol_name}
                        </div>
                        {source.protocol_url && (
                          <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {source.content_type_display} • Стр. {source.page_from}
                        {source.page_to && source.page_to !== source.page_from
                          ? `-${source.page_to}`
                          : ""}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {source.title}
                      </div>
                    </div>
                    {source.protocol_url ? (
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
              {message.sources.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{message.sources.length - 3} еще
                </div>
              )}
            </div>
          )}

          {/* Feedback Buttons - Only for assistant messages */}
          {isAssistant && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">Этот ответ помог?</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleFeedback('positive')}
                    disabled={feedback !== null}
                    className={`p-2 rounded-lg transition-all ${
                      feedback === 'positive'
                        ? 'bg-green-100 text-green-600'
                        : feedback === null
                        ? 'hover:bg-gray-100 text-gray-400 hover:text-green-600'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="Полезно"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback('negative')}
                    disabled={feedback !== null}
                    className={`p-2 rounded-lg transition-all ${
                      feedback === 'negative'
                        ? 'bg-red-100 text-red-600'
                        : feedback === null
                        ? 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="Не помогло"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
                {feedback && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-gray-500 ml-2"
                  >
                    Спасибо за отзыв!
                  </motion.span>
                )}
              </div>

              {/* Suggested Follow-up Questions */}
              {onSuggestedQuestion && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">💡 Вопросы по теме:</div>
                  <div className="flex flex-wrap gap-2">
                    {generateSuggestedQuestions().map((question, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => onSuggestedQuestion(question)}
                        className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              isAssistant ? "text-gray-400" : "text-white/60 text-right"
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
