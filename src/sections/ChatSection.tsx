"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaStethoscope } from "react-icons/fa";
import Image from "next/image";
import ChatHeader from "./Chat/ChatHeader";
import ChatMessages from "./Chat/ChatMessages";
import ChatInput from "./Chat/ChatInput";
import BookingModal from "./Chat/BookingModal";
import { Message } from "./Chat/types";
import { useChat } from "./Chat/hooks/useChat";
import ZhanBotLogoKZ from "@/assets/ZhanBotAi.png";
import JanBotLogoUZ from "@/assets/JanBotAi_uz.png";
import { useBrand } from "@/context/BrandContext";

export const ChatSection = () => {
  useAuth();
  const { language } = useLanguage();
  const { brand } = useBrand();
  const ZhanBotLogo = brand.id === "uz" ? JanBotLogoUZ : ZhanBotLogoKZ;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesExpandedRef = useRef<HTMLDivElement>(null);

  // Close expanded modal on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    if (isExpanded) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const {
    streaming,
    streamingMessageId,
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

  const handleSend = () => { onSend(); };

  const handleBookAppointment = () => { setIsBookingModalOpen(true); };

  const handleBookingComplete = useCallback((bookingDetails: {
    doctorName: string;
    doctorType: string;
    scheduledTime: string;
    isGuest?: boolean;
    meetingId?: string;
    consultationId?: number;
  }) => {
    const confirmationText = getBookingConfirmationText(
      bookingDetails.doctorName,
      bookingDetails.doctorType,
      bookingDetails.scheduledTime,
      language,
      bookingDetails.meetingId
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
    lang: string,
    meetingId?: string
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
    const videoLine = meetingId
      ? lang === "en"
        ? `\n🔗 **Video link:** [Join consultation](/video-call/patient?meetingId=${meetingId})`
        : lang === "kz"
        ? `\n🔗 **Бейне сілтеме:** [Кеңеске кіру](/video-call/patient?meetingId=${meetingId})`
        : `\n🔗 **Ссылка на консультацию:** [Войти в кабинет](/video-call/patient?meetingId=${meetingId})`
      : "";
    switch (lang) {
      case "en":
        return `✅ **Appointment Confirmed!**\n\nYou have successfully booked an appointment with **${doctorName}** (${doctorType}).\n\n📅 **Date:** ${formattedDate}\n🕐 **Time:** ${formattedTime}\n💻 **Type:** Online video consultation${videoLine}\n\nYou will receive a reminder before your appointment. Make sure you have a stable internet connection and your camera/microphone ready.`;
      case "kz":
        return `✅ **Жазылу расталды!**\n\n**${doctorName}** (${doctorType}) дәрігеріне сәтті жазылдыңыз.\n\n📅 **Күні:** ${formattedDate}\n🕐 **Уақыты:** ${formattedTime}\n💻 **Түрі:** Онлайн бейне кеңес${videoLine}\n\nКеңес алдында еске салу аласыз. Тұрақты интернет байланысы мен камера/микрофон дайын екеніне көз жеткізіңіз.`;
      default:
        return `✅ **Запись подтверждена!**\n\nВы успешно записались к врачу **${doctorName}** (${doctorType}).\n\n📅 **Дата:** ${formattedDate}\n🕐 **Время:** ${formattedTime}\n💻 **Тип:** Онлайн видеоконсультация${videoLine}\n\nВы получите напоминание перед консультацией. Убедитесь, что у вас стабильное интернет-соединение и готовы камера/микрофон.`;
    }
  };

  const getBenefits = () => {
    switch (language) {
      case "ru": return ["Анализ симптомов за 30 секунд", "Рекомендации по обращению к врачу", "Доступно 24/7"];
      case "en": return ["Symptom analysis in 30 seconds", "Doctor consultation advice", "Available 24/7"];
      case "kz": return ["30 секундта симптом талдауы", "Дәрігерге қаралу туралы кеңес", "24/7 қолжетімді"];
      default: return ["Symptom analysis in 30 seconds", "Doctor consultation advice", "Available 24/7"];
    }
  };

  const getTrustBadges = () => {
    switch (language) {
      case "ru": return { privacy: "Данные защищены", clinical: "Клинические рекомендации" };
      case "en": return { privacy: "Data protected", clinical: "Clinical guidelines" };
      case "kz": return { privacy: "Деректер қорғалған", clinical: "Клиникалық нұсқаулар" };
      default: return { privacy: "Data protected", clinical: "Clinical guidelines" };
    }
  };

  const trust = getTrustBadges();

  return (
    <motion.section
      id="ai-chat"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative bg-gradient-to-br from-[#1E34A0] via-[#1C212C] to-[#0F1419] text-white py-16 px-4 sm:px-10 overflow-hidden"
    >
      {/* Background depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(43,63,143,0.55) 0%, transparent 55%), radial-gradient(circle at 82% 82%, rgba(30,44,109,0.45) 0%, transparent 55%)"
        }}
      />
      <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-[#3A50FF]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[600px] h-[600px] bg-[#001E80]/20 rounded-full blur-[120px] pointer-events-none" />
      {/* AI glow centered behind chat */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle at center, rgba(79,120,255,0.14) 0%, transparent 65%)" }} />
      </div>

      <motion.div
        className="container mx-auto max-w-4xl relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Image
              src={ZhanBotLogo}
              alt={brand.id === "uz" ? "JanBot.Ai" : "ZhanBot.AI"}
              width={400}
              height={120}
              className="h-20 w-auto"
              priority
            />
          </motion.div>

          {/* Benefit bullets */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {getBenefits().map((benefit, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-white/70">
                <span className="text-[#6AA2FF] font-bold">✓</span>
                {benefit}
              </span>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex items-center justify-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <FaShieldAlt size={11} className="text-white/30" /> {trust.privacy}
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <FaStethoscope size={11} className="text-white/30" /> {trust.clinical}
            </span>
          </motion.div>
        </div>

        {/* Chat Container */}
        <motion.div
          className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 min-h-[720px] flex flex-col relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            isolation: "isolate",
            contain: "layout style paint",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(70,120,255,0.20)"
          }}
        >
          <ChatHeader
            language={language}
            onExpand={() => setIsExpanded(true)}
            isExpanded={false}
          />

          <ChatMessages
            messages={messages}
            streaming={streaming}
            streamingMessageId={streamingMessageId}
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

      {/* Fullscreen expanded modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: "rgba(4,7,18,0.88)", backdropFilter: "blur(10px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsExpanded(false); }}
          >
            <motion.div
              className="w-full max-w-4xl flex flex-col rounded-3xl border border-white/[0.08] overflow-hidden relative"
              style={{
                height: "90vh",
                background: "linear-gradient(135deg, #1b30a0 0%, #1a2030 45%, #0e1318 100%)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 80px rgba(70,120,255,0.18)"
              }}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Background layers inside modal */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 20% 15%, rgba(43,63,143,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 85%, rgba(30,44,109,0.3) 0%, transparent 50%)" }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[700px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle at center, rgba(79,120,255,0.12) 0%, transparent 65%)" }} />
              </div>

              {/* Modal chat content */}
              <div className="relative z-10 flex flex-col h-full p-8">
                <ChatHeader
                  language={language}
                  onExpand={() => setIsExpanded(false)}
                  isExpanded={true}
                />

                <ChatMessages
                  messages={messages}
                  streaming={streaming}
                  streamingMessageId={streamingMessageId}
                  language={language}
                  messagesContainerRef={messagesExpandedRef}
                  onBookAppointment={handleBookAppointment}
                  expanded={true}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingComplete={handleBookingComplete}
        language={language}
      />
    </motion.section>
  );
};
