"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, input]);
    setInput("");
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-lg px-4 py-6 w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto"
    >
      {/* Messages */}
      <div className="h-40 overflow-y-auto mb-4 space-y-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent pr-1">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-white text-sm md:text-base">
            <span className="text-blue-200 font-medium">You:</span> {msg}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Что вас беспокоит...."
        />
        <button
          onClick={sendMessage}
          className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:opacity-90 w-full sm:w-auto"
        >
          отправить
        </button>
      </div>
    </motion.div>
  );
}
