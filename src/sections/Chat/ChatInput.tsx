"use client";

import { ChangeEvent, useRef } from "react";
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
      case "ru": return "Например: температура 38 и болит горло";
      case "en": return "E.g.: fever 38°C and sore throat";
      case "kz": return "Мысалы: температура 38 және жұтқыншақ ауруы";
      default: return "E.g.: fever 38°C and sore throat";
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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
      <div className="flex items-end space-x-3 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl px-4 py-3 hover:border-white/20 transition-colors focus-within:border-[#4F7FFF]/60" style={{ transition: "border-color 0.2s, box-shadow 0.2s" }}>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={getPlaceholderText()}
          className="flex-1 bg-transparent text-white placeholder-white/50 outline-none resize-none leading-relaxed"
          style={{ maxHeight: "120px" }}
          value={input}
          onChange={handleTextareaChange}
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
          onClick={() => {
            if (textareaRef.current) textareaRef.current.style.height = "auto";
            onSend();
          }}
          disabled={streaming || (!input.trim() && !imagePreview)}
          className="p-2.5 rounded-xl transition text-white flex-shrink-0"
          style={
            streaming || (!input.trim() && !imagePreview)
              ? { background: "rgba(255,255,255,0.06)", opacity: 0.4, cursor: "not-allowed" }
              : { background: "linear-gradient(135deg, #4F7FFF, #6AA2FF)", boxShadow: "0 4px 18px rgba(79,127,255,0.45)" }
          }
          whileHover={!streaming && (input.trim() || imagePreview) ? { scale: 1.08 } : {}}
          whileTap={!streaming && (input.trim() || imagePreview) ? { scale: 0.94 } : {}}
        >
          <FaPaperPlane size={14} />
        </motion.button>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <div className="pb-2 sm:pb-0">
          <SuggestionChips
            language={language}
            streaming={streaming}
            onSuggestionClick={setInput}
          />
        </div>
      )}
    </div>
  );
}