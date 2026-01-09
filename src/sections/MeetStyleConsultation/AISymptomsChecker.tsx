"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faArrowUp,
  faArrowLeft,
  faSpinner,
  faMicrophone,
  faStop,
  faHeartPulse,
  faCircleCheck,
  faUserMd,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

interface DoctorRecommendation {
  id: number;
  name: string;
  doctor_type: string;
  email: string;
  urgency: string;
}

interface Message {
  role: "user" | "assistant" | "doctor-card";
  content: string;
  doctor?: DoctorRecommendation;
}

// Helper function to format AI message content with better structure
const formatAIMessage = (content: string) => {
  // Split by newlines and process each paragraph
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, idx) => {
        // Check if paragraph contains a list (sentences ending with dots)
        const sentences = paragraph.split('. ').filter(s => s.trim());

        if (sentences.length > 3) {
          // If many sentences, format as a list
          return (
            <div key={idx} className="space-y-2">
              {sentences.map((sentence, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2">
                  <span className="text-blue-600 leading-relaxed" style={{ color: "#3772ff" }}>•</span>
                  <span className="flex-1 leading-relaxed">{sentence.trim()}{sIdx < sentences.length - 1 && !sentence.endsWith('.') ? '.' : ''}</span>
                </div>
              ))}
            </div>
          );
        } else {
          // Regular paragraph
          return (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          );
        }
      })}
    </div>
  );
};

export default function AISymptomsChecker() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Здравствуйте! Я ваш медицинский ИИ-ассистент. Расскажите, пожалуйста, что вас беспокоит? Опишите ваши симптомы подробно.",
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

    // Reset textarea height and scroll to initial state
    if (inputRef.current) {
      inputRef.current.style.height = "40px";
      inputRef.current.style.overflowY = "hidden";
      inputRef.current.scrollTop = 0;
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Collect all user messages to build full symptom description
      const allUserMessages = [...messages.filter(m => m.role === "user").map(m => m.content), userMessage];
      const fullSymptoms = allUserMessages.join(". ");

      // Call AI recommendation API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultations/ai-recommend/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          symptoms: fullSymptoms,
          language: "ru"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI recommendation");
      }

      const data = await response.json();
      console.log("AI API Response:", data);
      console.log("Messages length:", messages.length);
      console.log("Data success:", data.success);
      console.log("Data recommended_doctor:", data.recommended_doctor);

      // Format the AI response
      let aiResponse = "";
      let specialty = "";
      let reason = "";

      // Extract reason and specialty from different response formats
      if (data.success && data.recommended_doctor) {
        // Doctor found format
        reason = data.recommended_doctor.reason || "";
        specialty = data.recommended_doctor.doctor_type || "";
      } else if (!data.success && data.ai_data) {
        // No doctor found format
        reason = data.ai_data.reason || "";
        specialty = data.ai_data.specialty || "";
      } else if (data.reason) {
        // Direct format (if any)
        reason = data.reason;
        specialty = data.specialty || "";
      }

      // Use the reason as AI response
      if (reason) {
        aiResponse = reason;
      } else if (data.error) {
        // Handle error from backend
        aiResponse = "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте описать ваши симптомы более подробно.";
      } else {
        // Fallback response if API doesn't return expected data
        const responses = [
          "Понимаю. Как долго у вас эти симптомы?",
          "Спасибо за информацию. Есть ли у вас температура?",
          "Хорошо. Принимали ли вы какие-либо лекарства?",
        ];
        aiResponse = responses[Math.min(messages.length / 2, responses.length - 1)];
      }

      // If we have enough information (either doctor found or not)
      // Note: messages.length will be 1 here because setState is async and hasn't updated yet
      console.log("Checking condition: messages.length >= 1 && (data.success || (!data.success && data.ai_data))");
      console.log("Result:", messages.length >= 1 && (data.success || (!data.success && data.ai_data)));

      if (messages.length >= 1 && (data.success || (!data.success && data.ai_data))) {
        console.log("Inside main condition block");
        // Add AI explanation message
        if (specialty) {
          aiResponse += `\n\nОсновываясь на ваших симптомах, я рекомендую консультацию с специалистом: ${specialty}.`;
        }

        // If doctor found (either exact match or fallback)
        console.log("Checking doctor card condition:", data.success, data.recommended_doctor);
        if (data.success && data.recommended_doctor) {
          console.log("Creating doctor card!");
          let cardContent = "Я нашел подходящего врача для вас:";

          // If it's a fallback doctor (when requested specialty not available)
          if (data.fallback_used && data.requested_specialty) {
            const fallbackMessage = `\n\nК сожалению, в данный момент у нас нет доступного специалиста по направлению "${data.requested_specialty}". Но я могу предложить вам консультацию с нашим врачом, который сможет провести первичный осмотр и при необходимости направить вас к нужному специалисту.`;
            aiResponse += fallbackMessage;
            cardContent = "Рекомендуемый врач (альтернатива):";
          }

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: aiResponse },
            {
              role: "doctor-card",
              content: cardContent,
              doctor: data.recommended_doctor
            }
          ]);
          setIsLoading(false);
          return;
        }

        // If no doctor found at all (even fallback failed)
        if (!data.success && data.ai_data && specialty) {
          const noDocMessage = `\n\nК сожалению, в данный момент все наши врачи заняты. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону для срочной консультации.`;

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: aiResponse + noDocMessage }
          ]);
          setIsLoading(false);
          return;
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error calling AI recommendation API:", error);

      // Fallback to simulated responses on error
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
    }
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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #ebf1ff 0%, #ffffff 50%, #ebf1ff 100%)" }}>
      {/* Header */}
      <header className="bg-white border-b shadow-sm" style={{ borderColor: "#e1eaff" }}>
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all hover:scale-105 text-sm sm:text-base"
              style={{
                color: "#2956bf",
                background: "#ebf1ff"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e1eaff"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ebf1ff"}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs sm:text-sm" />
              <span className="hidden sm:inline font-medium">Назад</span>
            </button>

            {/* Center - AI Assistant Info */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 justify-center">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl sm:rounded-2xl blur-lg opacity-40"
                  style={{ background: "#3772ff" }}
                />
                <div
                  className="relative w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                >
                  <FontAwesomeIcon icon={faRobot} className="text-white text-sm sm:text-base lg:text-xl" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg" style={{ color: "#283353" }}>ИИ Медицинский Ассистент</h1>
                <p className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2" style={{ color: "#3772ff" }}>
                  <FontAwesomeIcon icon={faHeartPulse} className="text-xs" />
                  <span>Диагностика симптомов</span>
                </p>
              </div>
            </div>

            {/* Online Badge */}
            <div className="flex justify-end">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: "#ebf1ff", color: "#2956bf" }}>
                Онлайн
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl space-y-4 sm:space-y-6">
          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border"
            style={{
              background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
              borderColor: "#2956bf"
            }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCircleCheck} className="text-white text-base sm:text-xl" />
              </div>
              <div className="text-white">
                <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">Добро пожаловать в ZhanCare AI</h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  Я проведу предварительную диагностику ваших симптомов и помогу подобрать подходящего специалиста.
                  Все данные конфиденциальны и защищены.
                </p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div>
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>ИИ Ассистент</span>
                      </div>
                      <div
                        className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border"
                        style={{
                          background: "white",
                          borderColor: "#e1eaff"
                        }}
                      >
                        <div className="text-sm sm:text-base break-words" style={{ color: "#283353", overflowWrap: "break-word", wordBreak: "break-word" }}>
                          {formatAIMessage(message.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : message.role === "doctor-card" && message.doctor ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>Рекомендация врача</span>
                      </div>
                      <div
                        className="rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-6 sm:py-5 shadow-xl border-2"
                        style={{
                          background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
                          borderColor: "#2956bf"
                        }}
                      >
                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                          <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0"
                            style={{ background: "rgba(255, 255, 255, 0.2)" }}
                          >
                            <FontAwesomeIcon icon={faUserMd} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-base sm:text-lg mb-1">{message.doctor.name}</h3>
                            <p className="text-white/90 text-sm sm:text-base mb-2">{message.doctor.doctor_type}</p>
                            {message.doctor.urgency === "urgent" && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "#ef4444", color: "white" }}>
                                <FontAwesomeIcon icon={faHeartPulse} />
                                <span>Срочная консультация</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push("/consultation/schedule")}
                          className="w-full py-3 sm:py-4 bg-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl transition-all hover:scale-105 shadow-lg"
                          style={{ color: "#3772ff" }}
                        >
                          Записаться на прием →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[90%] sm:max-w-[85%]">
                    <div
                      className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
                      }}
                    >
                      <p className="text-white text-sm sm:text-base leading-relaxed break-words" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{message.content}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                >
                  <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                </div>
                <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border" style={{ background: "white", borderColor: "#e1eaff" }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm sm:text-base" style={{ color: "#3772ff" }} />
                    <span className="text-sm sm:text-base" style={{ color: "#283353" }}>Анализирую симптомы...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t" style={{ borderColor: "#e1eaff" }}>
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="relative">
            {/* Combined Input Container */}
            <div className="relative rounded-3xl border-2 transition-all shadow-lg"
              style={{
                borderColor: "#3772ff",
                background: "#ffffff"
              }}
            >
              <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Опишите ваши симптомы..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-3xl focus:outline-none focus:ring-0 focus:border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-transparent text-xs sm:text-sm lg:text-base resize-none overflow-hidden break-words border-0"
                  style={{
                    minHeight: "40px",
                    maxHeight: "120px",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    boxShadow: "none",
                    border: "none",
                    outline: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none"
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "40px";
                    const newHeight = Math.min(target.scrollHeight, 120);
                    target.style.height = newHeight + "px";
                    // Only show scroll if content exceeds max height
                    target.style.overflowY = target.scrollHeight > 120 ? "auto" : "hidden";
                  }}
                />

                {/* Right Side Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Voice Recording Button */}
                <button
                  onClick={toggleRecording}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: isRecording ? "#ef4444" : "transparent",
                    color: isRecording ? "white" : "#3772ff"
                  }}
                >
                  <FontAwesomeIcon
                    icon={isRecording ? faStop : faMicrophone}
                    className={`text-sm sm:text-base ${isRecording ? "animate-pulse" : ""}`}
                  />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center transition-all disabled:cursor-not-allowed group"
                  style={{
                    background: input.trim() && !isLoading
                      ? "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)"
                      : "#bcc0ca"
                  }}
                  onMouseEnter={(e) => {
                    if (input.trim() && !isLoading) {
                      e.currentTarget.style.transform = "scale(1.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {/* Glow effect */}
                  {input.trim() && !isLoading && (
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-50 -z-10"
                      style={{ background: "#3772ff" }}
                    />
                  )}
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs sm:text-sm" />
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[8px] xs:text-[9px] sm:text-xs px-2" style={{ color: "#3772ff" }}>
            <span className="font-medium whitespace-nowrap">Enter - отправка</span>
            <span className="whitespace-nowrap" style={{ color: "#bcc0ca" }}>•</span>
            <span className="font-medium whitespace-nowrap">Shift+Enter - строка</span>
          </div>
        </div>
      </div>
    </div>
  );
}
