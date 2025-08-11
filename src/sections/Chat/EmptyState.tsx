"use client";

import { motion } from "framer-motion";
import { FaRobot } from "react-icons/fa";

interface EmptyStateProps {
  language: string;
}

export default function EmptyState({ language }: EmptyStateProps) {
  const getEmptyMessage = () => {
    switch (language) {
      case "ru": return "Начните разговор с медицинским ассистентом";
      case "en": return "Start a conversation with the medical assistant";
      case "kz": return "Медициналық көмекшімен сөйлесуді бастаңыз";
      default: return "Start a conversation with the medical assistant";
    }
  };

  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-16 h-16 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full flex items-center justify-center mx-auto mb-4"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <FaRobot className="text-white text-2xl" />
      </motion.div>
      <motion.p 
        className="text-white/60"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {getEmptyMessage()}
      </motion.p>
      
      {/* Floating particles around the bot */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `calc(50% + ${(i - 1) * 30}px)`,
            top: `calc(50% - ${20 + i * 10}px)`
          }}
          animate={{
            y: [-5, -15, -5],
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );
}