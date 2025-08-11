"use client";

import { motion } from "framer-motion";
import { FaRobot } from "react-icons/fa";

interface StreamingMessageProps {
  text?: string;
}

export default function StreamingMessage({ text }: StreamingMessageProps) {
  const getThinkingText = () => {
    return text || "Typing";
  };

  return (
    <motion.div
      className="flex items-start space-x-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
        <FaRobot className="text-white text-sm animate-pulse" />
      </div>
      <div className="max-w-[70%] bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm">{getThinkingText()}</span>
          <div className="flex space-x-1">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-white/60 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}