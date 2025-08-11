"use client";

import { motion } from "framer-motion";
import { FaUser, FaRobot } from "react-icons/fa";
import Image from "next/image";
import { Message } from "./types";

interface MessageItemProps {
  message: Message;
  index: number;
  language: string;
  onBookAppointment: () => void;
}

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      delay: i * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 30
    },
  }),
};

// Format markdown-like output
function formatMessageToHTML(text: string): string {
  let safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*(.*?)\*/g, "<em>$1</em>");
  safe = safe.replace(/\n/g, "<br/>");
  return safe;
}

export default function MessageItem({ 
  message, 
  index, 
  language, 
  onBookAppointment 
}: MessageItemProps) {
  const getDoctorButtonText = () => {
    switch (language) {
      case "ru": return "Записаться к врачу";
      case "en": return "Book Appointment";
      case "kz": return "Дәрігерге жазылу";
      default: return "Book Appointment";
    }
  };

  return (
    <motion.div
      custom={index}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={`flex items-start space-x-3 ${
        message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        message.sender === "user" 
          ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF]" 
          : "bg-white/10"
      }`}>
        {message.sender === "user" ? (
          <FaUser className="text-white text-sm" />
        ) : (
          <FaRobot className="text-white text-sm" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${
        message.sender === "user" ? "items-end" : "items-start"
      }`}>
        {/* Message Bubble */}
        <div className={`px-4 py-3 rounded-2xl shadow-lg ${
          message.sender === "user"
            ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white"
            : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
        }`}>
          {message.imageUrl && (
            <Image
              src={message.imageUrl}
              alt="Uploaded"
              width={200}
              height={200}
              className="rounded-lg mb-2"
            />
          )}
          {message.sender === "bot" ? (
            <span
              dangerouslySetInnerHTML={{
                __html: formatMessageToHTML(message.text),
              }}
            />
          ) : (
            message.text
          )}
        </div>
        
        {/* Doctor Button */}
        {message.showDoctorButton && (
          <motion.button
            onClick={onBookAppointment}
            className="mt-3 bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getDoctorButtonText()}
          </motion.button>
        )}
        
        {/* Timestamp */}
        <p className="text-xs text-white/40 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}