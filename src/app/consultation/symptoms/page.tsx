"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faPaperPlane,
  faArrowLeft,
  faSpinner,
  faMicrophone,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SymptomsPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Здравствуйте! Я ваш медицинский ассистент. Расскажите, пожалуйста, что вас беспокоит? Опишите ваши симптомы подробно.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses = [
        "Понимаю. Как долго у вас эти симптомы?",
        "Спасибо за информацию. Есть ли у вас температура?",
        "Хорошо. Принимали ли вы какие-либо лекарства?",
        "Отлично. Основываясь на ваших симптомах, я рекомендую консультацию с терапевтом. Подбираю подходящего врача...",
      ];

      const response = responses[Math.min(messages.length / 2, responses.length - 1)];
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);

      // After 4 exchanges, redirect to doctor matching
      if (messages.length >= 7) {
        setTimeout(() => {
          router.push("/consultation/matching");
        }, 2000);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Назад</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-900">ИИ Ассистент</h1>
              <p className="text-xs text-gray-500">Медицинская диагностика</p>
            </div>
          </div>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <FontAwesomeIcon icon={faRobot} className="text-white text-xs" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">ИИ Ассистент</span>
                    </div>
                  )}
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faSpinner} className="text-blue-600 animate-spin" />
                  <span className="text-gray-600">Анализирую симптомы...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-end gap-3">
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Опишите ваши симптомы..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ minHeight: "52px", maxHeight: "150px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "52px";
                  target.style.height = Math.min(target.scrollHeight, 150) + "px";
                }}
              />

              {/* Voice Recording Button */}
              <button
                onClick={toggleRecording}
                className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} className="text-sm" />
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </p>
        </div>
      </div>
    </div>
  );
}
