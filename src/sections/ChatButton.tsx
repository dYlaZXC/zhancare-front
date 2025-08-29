import React from "react";
import { motion } from "framer-motion";

export const ChatButton = ({ onToggle }: { onToggle: () => void }) => {
  return (
    <motion.button
      onClick={onToggle}
      aria-label="Open chat"
      whileHover={{ scale: 1.1, rotate: 10 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 p-4 sm:p-5 rounded-full z-[9998] shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 group"
      style={{
        background: "linear-gradient(135deg, #3A50FF 0%, #001E80 100%)",
        boxShadow: `
          0 0 20px rgba(58, 80, 255, 0.4),
          0 0 40px rgba(58, 80, 255, 0.2),
          0 10px 25px rgba(0, 0, 0, 0.25),
          inset 0 1px 1px rgba(255, 255, 255, 0.1)
        `
      }}
    >
      {/* Neon glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4A5DFF]/20 to-[#6B7DFF]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Chat icon */}
      <div className="relative z-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 15.72A2.01 2.01 0 0119 17H6l-3 3V7a2 2 0 012-2h14a2 2 0 012 2v8.72z"
          />
        </svg>
      </div>

      {/* Notification indicator (optional - you can remove if not needed) */}
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"
        animate={{
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
      </motion.div>
    </motion.button>
  );
};