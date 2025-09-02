"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import ChatHeader from "./Chat/ChatHeader";
import ChatMessages from "./Chat/ChatMessages";
import ChatInput from "./Chat/ChatInput";
import { Message } from "./Chat/types";
import { useChat } from "./Chat/hooks/useChat";

export const ChatSection = () => {
  const { user, setIsAuthOpen } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get translations
  const translations = useMemo(() => {
    switch (language) {
      case "ru": return ru.chat;
      case "en": return en.chat;
      case "kz": return kz.chat;
      default: return ru.chat;
    }
  }, [language]);

  // Custom hook for chat logic
  const {
    streaming,
    handleSend: onSend,
    handleImageUpload
  } = useChat({
    messages,
    setMessages,
    input,
    setInput,
    imagePreview,
    setImagePreview,
    language,
    messagesContainerRef
  });

  const handleSend = () => {
    onSend();
  };

  const handleBookAppointment = () => {
    if (user) {
      const profileRoute = user.role === "doctor" ? "/doctor-profile" : "/profile";
      router.push(profileRoute);
    } else {
      setIsAuthOpen(true);
    }
  };

  const getHeaderDescription = () => {
    switch (language) {
      case "ru": 
        return "Опишите симптомы, и наш ИИ-ассистент подскажет, стоит ли обращаться к специалисту.";
      case "en": 
        return "Describe your symptoms, and our AI assistant will suggest whether you should consult a specialist.";
      case "kz":
        return "Симптомдарыңызды сипаттаңыз, біздің AI көмекшісі маманға қаралу керектігін айтады.";
      default:
        return "Describe your symptoms, and our AI assistant will suggest whether you should consult a specialist.";
    }
  };

  return (
    <motion.section
      id="ai-chat"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative bg-gradient-to-br from-[#1E34A0] via-[#1C212C] to-[#0F1419] text-white py-20 px-4 sm:px-10"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001E80]/10 to-[#3A50FF]/10 blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#3A50FF]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#001E80]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <motion.div
        className="container mx-auto max-w-5xl relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2 
            className="text-5xl font-bold text-white leading-tight mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {translations.title}
          </motion.h2>
          <motion.p 
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {getHeaderDescription()}
          </motion.p>
        </div>

        {/* Chat Container */}
        <motion.div
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 min-h-[700px] flex flex-col relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ 
            isolation: 'isolate',
            contain: 'layout style paint'
          }}
        >
          <ChatHeader language={language} />
          
          <ChatMessages 
            messages={messages}
            streaming={streaming}
            language={language}
            messagesContainerRef={messagesContainerRef}
            onBookAppointment={handleBookAppointment}
          />
          
          <ChatInput
            input={input}
            setInput={setInput}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            streaming={streaming}
            language={language}
            messages={messages}
            onSend={handleSend}
            onImageUpload={handleImageUpload}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};