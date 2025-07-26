import React from "react";
import { motion } from "framer-motion";

export const ChatButton = ({ onToggle }: { onToggle: () => void }) => {
  return (
    <motion.button
      onClick={onToggle}
      aria-label="Open chat"
      whileHover={{ scale: 1.1, rotate: 10 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 p-4 sm:p-5 rounded-full z-50 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      style={{
        background: "linear-gradient(135deg, #3A50FF 0%, #001E80 100%)",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 sm:w-7 sm:h-7 text-white"
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
    </motion.button>
  );
};
