"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain, FileText, AlertCircle, Bot, Trash2 } from "lucide-react";
import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { ChatMessage } from "./ChatMessage";
import { ChatBackground } from "./ChatBackground";
import { Message, ChatRequest, ChatResponse, Protocol, InteractiveProtocol } from "./types";
import { api } from "@/utils/api";

export default function ProtocolAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);
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
    protocolsWithoutContent: Protocol[]
  ) => {
    const totalCount = protocolsWithContent.length + protocolsWithoutContent.length;

    let welcomeContent = "👋 Здравствуйте! Я AI-ассистент по клиническим протоколам.\n\n";
    welcomeContent += `📚 У меня есть доступ к ${totalCount} ${totalCount === 1 ? 'протоколу' : 'протоколам'} (${protocolsWithContent.length} с полными данными).\n\n`;
    welcomeContent += "💬 **Просто задайте вопрос!** Например:\n";
    welcomeContent += "• \"Какие диагностические критерии HELLP-синдрома?\"\n";
    welcomeContent += "• \"Расскажи о лечении преэклампсии\"\n";
    welcomeContent += "• \"Какие осложнения при гестационном диабете?\"\n\n";
    welcomeContent += "Я автоматически найду нужный протокол и дам ответ на основе актуальных медицинских данных.";

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

      setAllProtocols(fetchedProtocols);

      // Generate welcome message
      const welcomeContent = generateWelcomeMessage(
        protocolsWithContent,
        protocolsWithoutContent
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

  const handleProtocolClick = (protocol: InteractiveProtocol) => {
    // Auto-fill input with smart question about the protocol
    setInput(`Расскажи о протоколе "${protocol.name}". Какие основные разделы?`);
    // Optionally, you can auto-send the message
    // sendMessage();
  };

  const handleProtocolSelectFromSearch = (protocol: Protocol) => {
    console.log("📋 Protocol selected from search:", protocol);

    // Auto-fill input with question about the protocol
    setInput(`Расскажи о протоколе "${protocol.name}". Какие основные разделы?`);
  };

  const handleQuickAction = (action: string, protocol?: InteractiveProtocol) => {
    let question = "";
    switch (action) {
      case "diagnosis":
        question = "Какие диагностические критерии?";
        break;
      case "treatment":
        question = "Какая тактика лечения?";
        break;
      case "complications":
        question = "Какие возможны осложнения?";
        break;
    }
    setInput(question);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
        {/* Beautiful Background */}
        <ChatBackground />

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

            {/* Clear Conversation Button */}
            {messages.length > 1 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  if (confirm('Очистить всю историю разговора?')) {
                    setMessages([]);
                    loadProtocols(); // Reload welcome message
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all backdrop-blur-sm"
                title="Очистить разговор"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Очистить</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative">
          <AnimatePresence>
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage
                  message={message}
                  onSourceClick={(source) => {
                    console.log("Source clicked:", source);
                    // TODO: Open source modal
                  }}
                  onProtocolClick={handleProtocolClick}
                  onQuickAction={handleQuickAction}
                  onProtocolSelectFromSearch={handleProtocolSelectFromSearch}
                  onSuggestedQuestion={(question) => setInput(question)}
                  allProtocols={allProtocols}
                />
              </div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 mb-6"
            >
              {/* AI Avatar */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(to bottom right, #3772ff, #2c5bcc)' }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>

              {/* Typing Indicator */}
              <div className="flex-1 max-w-[80%]">
                <div className="rounded-2xl px-6 py-5 shadow-lg bg-white border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Анализирую протоколы и генерирую ответ...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-lg">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос о любом клиническом протоколе..."
              className="flex-1 bg-white text-gray-800 placeholder-gray-400 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm transition-all"
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
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
              disabled={loading}
            >
              <FileText className="w-3 h-3 inline mr-1" />
              Диагностические критерии
            </button>
            <button
              onClick={() => setInput("Какие осложнения могут возникнуть?")}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
              disabled={loading}
            >
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Осложнения
            </button>
            <button
              onClick={() => setInput("Как проводится лечение?")}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
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
