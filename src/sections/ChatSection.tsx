"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ChatHeader from "./Chat/ChatHeader";
import ChatMessages from "./Chat/ChatMessages";
import ChatInput from "./Chat/ChatInput";
import BookingModal from "./Chat/BookingModal";
import { Message } from "./Chat/types";
import { useChat } from "./Chat/hooks/useChat";
import ZhanBotLogo from "@/assets/ZhanBotAi.png";

export const ChatSection = () => {
  useAuth(); // Keep for BookingModal's internal auth handling
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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
    // Open the booking modal instead of navigating away
    setIsBookingModalOpen(true);
  };

  const handleBookingComplete = useCallback((bookingDetails: {
    doctorName: string;
    doctorType: string;
    scheduledTime: string;
    isGuest?: boolean;
  }) => {
    // Add a confirmation message to the chat
    const confirmationText = getBookingConfirmationText(
      bookingDetails.doctorName,
      bookingDetails.doctorType,
      bookingDetails.scheduledTime,
      language
    );

    const confirmationMessage: Message = {
      id: `booking_${Date.now()}`,
      sender: "bot",
      text: confirmationText,
      timestamp: new Date(),
      showDoctorButton: false,
    };

    setMessages(prev => [...prev, confirmationMessage]);
  }, [language]);

  const getBookingConfirmationText = (
    doctorName: string,
    doctorType: string,
    scheduledTime: string,
    lang: string
  ): string => {
    const date = new Date(scheduledTime);
    const formattedDate = date.toLocaleDateString(
      lang === "kz" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );
    const formattedTime = date.toLocaleTimeString(
      lang === "kz" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU",
      { hour: "2-digit", minute: "2-digit" }
    );

    switch (lang) {
      case "en":
        return `✅ **Appointment Confirmed!**\n\nYou have successfully booked an appointment with **${doctorName}** (${doctorType}).\n\n📅 **Date:** ${formattedDate}\n🕐 **Time:** ${formattedTime}\n💻 **Type:** Online video consultation\n\nYou will receive a reminder before your appointment. Make sure you have a stable internet connection and your camera/microphone ready.`;
      case "kz":
        return `✅ **Жазылу расталды!**\n\n**${doctorName}** (${doctorType}) дәрігеріне сәтті жазылдыңыз.\n\n📅 **Күні:** ${formattedDate}\n🕐 **Уақыты:** ${formattedTime}\n💻 **Түрі:** Онлайн бейне кеңес\n\nКеңес алдында еске салу аласыз. Тұрақты интернет байланысы мен камера/микрофон дайын екеніне көз жеткізіңіз.`;
      default:
        return `✅ **Запись подтверждена!**\n\nВы успешно записались к врачу **${doctorName}** (${doctorType}).\n\n📅 **Дата:** ${formattedDate}\n🕐 **Время:** ${formattedTime}\n💻 **Тип:** Онлайн видеоконсультация\n\nВы получите напоминание перед консультацией. Убедитесь, что у вас стабильное интернет-соединение и готовы камера/микрофон.`;
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
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Image
              src={ZhanBotLogo}
              alt="ZhanBot.AI"
              width={400}
              height={120}
              className="h-24 w-auto"
              priority
            />
          </motion.div>
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingComplete={handleBookingComplete}
        language={language}
      />
    </motion.section>
  );
};