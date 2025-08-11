"use client";

import { ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaImage, FaTimes } from "react-icons/fa";
import Image from "next/image";
import SuggestionChips from "./SuggestionChips";
import { Message } from "./types";

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  imagePreview: string | null;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  streaming: boolean;
  language: string;
  messages: Message[];
  onSend: () => void;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function ChatInput({
  input,
  setInput,
  imagePreview,
  setImagePreview,
  streaming,
  language,
  messages,
  onSend,
  onImageUpload
}: ChatInputProps) {
  const getPlaceholderText = () => {
    switch (language) {
      case "ru": return "Что вас беспокоит?";
      case "en": return "What's bothering you?";
      case "kz": return "Сізді не мазалайды?";
      default: return "What's bothering you?";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            className="mb-4 flex justify-start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Preview"
                width={120}
                height={120}
                className="rounded-xl border border-white/20"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition"
              >
                <FaTimes size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Field */}
      <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3">
        <input
          type="text"
          placeholder={getPlaceholderText()}
          className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        
        {/* Image Upload */}
        <label className="cursor-pointer text-white/60 hover:text-white transition p-2 hover:bg-white/10 rounded-lg">
          <FaImage size={18} />
          <input 
            type="file" 
            accept="image/*" 
            onChange={onImageUpload} 
            className="hidden" 
          />
        </label>

        {/* Send Button */}
        <motion.button
          onClick={onSend}
          disabled={streaming || (!input.trim() && !imagePreview)}
          className={`p-2 rounded-lg transition ${
            streaming || (!input.trim() && !imagePreview)
              ? "opacity-50 cursor-not-allowed text-white/40"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-lg"
          }`}
          whileHover={!streaming && (input.trim() || imagePreview) ? { scale: 1.05 } : {}}
          whileTap={!streaming && (input.trim() || imagePreview) ? { scale: 0.95 } : {}}
        >
          <FaPaperPlane size={16} />
        </motion.button>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <SuggestionChips
          language={language}
          streaming={streaming}
          onSuggestionClick={setInput}
        />
      )}
    </div>
  );
}