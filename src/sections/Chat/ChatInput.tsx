"use client";

import { ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Paperclip, X } from "lucide-react";
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
  onImageUpload,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholder =
    language === "ru" ? "Например: температура 38 и болит горло..." :
    language === "en" ? "E.g.: fever 38°C and sore throat..." :
    language === "kz" ? "Мысалы: температура 38 және жұтқыншақ ауруы..." :
    language === "uz" ? "Masalan: harorat 38 va tomoq og'rig'i..." :
    "E.g.: fever 38°C and sore throat...";

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onSend();
    }
  };

  const handleSend = () => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend();
  };

  const canSend = !streaming && (!!input.trim() || !!imagePreview);

  return (
    <div className="space-y-3">
      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            className="flex"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-xl object-cover"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <div
        className="flex items-end gap-2 px-4 py-3 rounded-2xl transition-all"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.20)",
        }}
      >
        {/* Attach button */}
        <label className="flex-shrink-0 cursor-pointer p-1.5 rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          <Paperclip size={16} />
          <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
        </label>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={streaming}
          className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed min-h-[24px] placeholder-white/25"
          style={{
            color: "rgba(255,255,255,0.86)",
            maxHeight: "120px",
          }}
        />

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all"
          style={
            canSend
              ? { background: "linear-gradient(135deg, #3A50FF 0%, #4F7FFF 100%)", boxShadow: "0 4px 16px rgba(63,87,255,0.35)" }
              : { background: "rgba(255,255,255,0.07)", opacity: 0.4, cursor: "not-allowed" }
          }
          whileHover={canSend ? { scale: 1.08 } : {}}
          whileTap={canSend ? { scale: 0.93 } : {}}
        >
          <ArrowUp size={15} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Suggestion chips — only on empty chat */}
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
