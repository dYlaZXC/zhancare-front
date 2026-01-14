"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain, FileText, AlertCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { Message, ChatRequest, ChatResponse, Protocol } from "./types";
import { api } from "@/utils/api";

export default function ProtocolAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Здравствуйте! Я ассистент по клиническим протоколам.\n\nСейчас в базе доступен протокол HELLP-СИНДРОМ с полной информацией о диагностике, лечении, классификации и осложнениях.\n\nЗадайте мне любой вопрос об этом протоколе!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<number | undefined>();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
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

  const loadProtocols = async () => {
    try {
      const response = await api.get("/protocols/");
      // Filter to only show protocols that have content
      const protocolsWithContent = (response.data || []).filter(
        (p: Protocol) => p.contents && p.contents.length > 0
      );
      setProtocols(protocolsWithContent);
    } catch (error) {
      console.error("Failed to load protocols:", error);
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
    <div className="min-h-screen bg-gradient-to-b from-[#1E34A0] to-[#1C212C] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">
                Клинические Протоколы AI
              </h1>
              <p className="text-white/70 text-xs">
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
            className="bg-white/10 text-white text-sm px-4 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="">Все протоколы</option>
            {protocols.map((protocol) => (
              <option key={protocol.id} value={protocol.id}>
                {protocol.name}
              </option>
            ))}
          </select>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSourceClick={(source) => {
                  console.log("Source clicked:", source);
                  // TODO: Open source modal
                }}
              />
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
              className="flex-1 bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              className="text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1 rounded-full border border-white/10 transition-colors"
              disabled={loading}
            >
              <FileText className="w-3 h-3 inline mr-1" />
              Диагностические критерии
            </button>
            <button
              onClick={() => setInput("Какие осложнения могут возникнуть?")}
              className="text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1 rounded-full border border-white/10 transition-colors"
              disabled={loading}
            >
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Осложнения
            </button>
            <button
              onClick={() => setInput("Как проводится лечение?")}
              className="text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1 rounded-full border border-white/10 transition-colors"
              disabled={loading}
            >
              <Brain className="w-3 h-3 inline mr-1" />
              Тактика лечения
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
