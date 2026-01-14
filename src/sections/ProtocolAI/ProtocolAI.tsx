"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain, FileText, AlertCircle } from "lucide-react";
import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { ChatMessage } from "./ChatMessage";
import { Message, ChatRequest, ChatResponse, Protocol } from "./types";
import { api } from "@/utils/api";

export default function ProtocolAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<number | undefined>();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);
  const [showAllProtocols, setShowAllProtocols] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load protocols on mount
  useEffect(() => {
    loadProtocols();
  }, []);

  const generateWelcomeMessage = (
    protocolsWithContent: Protocol[],
    protocolsWithoutContent: Protocol[],
    showAll: boolean
  ) => {
    let welcomeContent = "Здравствуйте! Я ассистент по клиническим протоколам.\n\n";

    if (protocolsWithContent.length > 0) {
      welcomeContent += "📚 Протоколы с полными данными:\n";
      const displayProtocols = showAll ? protocolsWithContent : protocolsWithContent.slice(0, 10);
      displayProtocols.forEach((p: Protocol) => {
        const count = p.content_count || p.contents?.length || 0;
        welcomeContent += `- ${p.name} (${count} секций)\n`;
      });

      if (!showAll && protocolsWithContent.length > 10) {
        welcomeContent += `\n... и еще ${protocolsWithContent.length - 10} протоколов`;
      }
    }

    if (protocolsWithoutContent.length > 0) {
      welcomeContent += "\n\n📋 Протоколы в базе (данные в процессе загрузки):\n";
      const displayProtocols = showAll ? protocolsWithoutContent : protocolsWithoutContent.slice(0, 10);
      displayProtocols.forEach((p: Protocol) => {
        welcomeContent += `- ${p.name}\n`;
      });

      if (!showAll && protocolsWithoutContent.length > 10) {
        welcomeContent += `\n... и еще ${protocolsWithoutContent.length - 10} протоколов`;
      }
    }

    welcomeContent += "\n\nЗадайте мне любой вопрос о доступных протоколах!";
    return welcomeContent;
  };

  const loadProtocols = async () => {
    try {
      const response = await api.get("/protocols/");
      const fetchedProtocols = response.data || [];

      // Filter to only show protocols that have content
      // Use content_count from API (much faster than loading full contents array)
      const protocolsWithContent = fetchedProtocols.filter(
        (p: Protocol) => {
          const count = p.content_count !== undefined ? p.content_count : (p.contents?.length || 0);
          return count > 0;
        }
      );

      const protocolsWithoutContent = fetchedProtocols.filter(
        (p: Protocol) => {
          const count = p.content_count !== undefined ? p.content_count : (p.contents?.length || 0);
          return count === 0;
        }
      );

      setProtocols(protocolsWithContent);
      setAllProtocols(fetchedProtocols);

      // Generate welcome message
      const welcomeContent = generateWelcomeMessage(
        protocolsWithContent,
        protocolsWithoutContent,
        showAllProtocols
      );

      // Set welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeContent,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to load protocols:", error);

      // Fallback welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Здравствуйте! Я ассистент по клиническим протоколам. Задайте мне вопрос!",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Update welcome message when showAllProtocols changes
  useEffect(() => {
    if (allProtocols.length > 0) {
      const protocolsWithContent = allProtocols.filter(
        (p: Protocol) => {
          const count = p.content_count !== undefined ? p.content_count : (p.contents?.length || 0);
          return count > 0;
        }
      );

      const protocolsWithoutContent = allProtocols.filter(
        (p: Protocol) => {
          const count = p.content_count !== undefined ? p.content_count : (p.contents?.length || 0);
          return count === 0;
        }
      );

      const welcomeContent = generateWelcomeMessage(
        protocolsWithContent,
        protocolsWithoutContent,
        showAllProtocols
      );

      // Update only the welcome message
      setMessages((prev) => {
        if (prev.length > 0 && prev[0].id === "welcome") {
          return [
            {
              ...prev[0],
              content: welcomeContent,
            },
            ...prev.slice(1),
          ];
        }
        return prev;
      });
    }
  }, [showAllProtocols, allProtocols]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const request: ChatRequest = {
        question: userMessage.content,
        protocol_id: selectedProtocol,
        language: "ru",
        include_sources: true,
      };

      const response = await api.post<ChatResponse>("/protocols/ask/", request);

      if (response.data.success && response.data.answer) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.answer,
          timestamp: new Date(),
          sources: response.data.sources,
          metadata: response.data.metadata,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Error response
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.error || "Произошла ошибка при обработке запроса.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Ошибка: ${error.response?.data?.error || error.message || "Не удалось отправить сообщение"}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #12263a 0%, #1e263e 50%, #0e121d 100%)' }}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 relative overflow-hidden"
             style={{
               background: `linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)`
             }}>
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-20 w-32 h-32 rounded-full blur-xl opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.3) 0%, transparent 70%)', animationDuration: '4s' }}></div>
            <div className="absolute bottom-0 left-20 w-24 h-24 rounded-full blur-lg opacity-20 animate-bounce" style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.3) 0%, transparent 70%)', animationDuration: '3s' }}></div>
          </div>

          <div className="flex items-center justify-between relative z-10">
            {/* Logo Container - Similar to Sidebar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="relative overflow-hidden rounded-2xl p-3 backdrop-blur-md border border-white/20 transition-all duration-500 hover:scale-105"
                     style={{
                       background: `linear-gradient(135deg, rgba(55, 114, 255, 0.15) 0%, rgba(50, 103, 230, 0.1) 50%, rgba(41, 53, 143, 0.05) 100%)`
                     }}>
                  <Image
                    src={Logo}
                    alt="ZhanCare Logo"
                    width={120}
                    height={40}
                    className="w-auto h-10 transition-all duration-500 group-hover:scale-110 drop-shadow-lg"
                  />
                  {/* Animated glow behind logo */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-600/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-white font-bold text-xl drop-shadow-lg">
                  Клинические Протоколы AI
                </h1>
                <p className="text-white/80 text-sm">
                  Ассистент по медицинским протоколам
                </p>
              </div>
            </div>

            {/* Protocol Selector */}
            <select
              value={selectedProtocol || ""}
              onChange={(e) =>
                setSelectedProtocol(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="bg-white/10 text-white text-sm px-4 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-2 transition-all backdrop-blur-sm"
              style={{
                '--tw-ring-color': '#ebf1ff',
                '--tw-ring-opacity': '0.3',
              } as any}
            >
              <option value="" style={{ background: '#1e263e', color: 'white' }}>Все протоколы</option>
              {protocols.map((protocol) => (
                <option key={protocol.id} value={protocol.id} style={{ background: '#1e263e', color: 'white' }}>
                  {protocol.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <div key={message.id}>
                <ChatMessage
                  message={message}
                  onSourceClick={(source) => {
                    console.log("Source clicked:", source);
                    // TODO: Open source modal
                  }}
                />

                {/* Show "Load More" button after welcome message */}
                {index === 0 && message.id === "welcome" && !showAllProtocols && (
                  (allProtocols.filter(p => {
                    const count = p.content_count !== undefined ? p.content_count : (p.contents?.length || 0);
                    return count > 0;
                  }).length > 10 ||
                   allProtocols.filter(p => {
                    const count = p.content_count !== undefined ? p.content_count : (p.contents?.length || 0);
                    return count === 0;
                  }).length > 10) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center mt-4"
                    >
                      <button
                        onClick={() => setShowAllProtocols(true)}
                        className="text-white text-sm px-6 py-2 rounded-xl border border-white/20 transition-all backdrop-blur-sm"
                        style={{
                          background: 'linear-gradient(to right, rgba(55, 114, 255, 0.2), rgba(44, 91, 204, 0.2))',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, rgba(55, 114, 255, 0.3), rgba(44, 91, 204, 0.3))';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, rgba(55, 114, 255, 0.2), rgba(44, 91, 204, 0.2))';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        Показать все протоколы
                      </button>
                    </motion.div>
                  )
                )}
              </div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-white/60"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Генерирую ответ...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос о клиническом протоколе..."
              className="flex-1 bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 resize-none backdrop-blur-sm transition-all"
              style={{
                '--tw-ring-color': '#3772ff',
              } as any}
              rows={2}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: loading || !input.trim() ? '#bcc0ca' : 'linear-gradient(to right, #3772ff, #2c5bcc)',
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #3267e6, #2956bf)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #3772ff, #2c5bcc)';
                }
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Hints */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() =>
                setInput("Какие диагностические критерии HELLP-синдрома?")
              }
              className="text-xs bg-white/5 text-white/60 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
              disabled={loading}
            >
              <FileText className="w-3 h-3 inline mr-1" />
              Диагностические критерии
            </button>
            <button
              onClick={() => setInput("Какие осложнения могут возникнуть?")}
              className="text-xs bg-white/5 text-white/60 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
              disabled={loading}
            >
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Осложнения
            </button>
            <button
              onClick={() => setInput("Как проводится лечение?")}
              className="text-xs bg-white/5 text-white/60 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
              disabled={loading}
            >
              <Brain className="w-3 h-3 inline mr-1" />
              Тактика лечения
            </button>
          </div>
        </div>
    </div>
  );
}
