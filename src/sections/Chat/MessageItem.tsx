"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Check, Copy, Calendar } from "lucide-react";
import { FaUser, FaStethoscope } from "react-icons/fa";
import { Message } from "./types";

interface MessageItemProps {
  message: Message;
  index: number;
  language: string;
  onBookAppointment: () => void;
  isStreaming?: boolean;
}

export default function MessageItem({ message, index, language, onBookAppointment, isStreaming }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const bookLabel =
    language === "ru" ? "Записаться к врачу" :
    language === "en" ? "Book a Doctor" :
    language === "kz" ? "Дәрігерге жазылу" :
    "Shifokorga yozilish";

  return (
    <motion.div
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.12) }}
      layout
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={
          isUser
            ? { background: "linear-gradient(135deg, #4F7FFF 0%, #6AA2FF 100%)" }
            : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)" }
        }
      >
        {isUser
          ? <FaUser size={10} className="text-white" />
          : <FaStethoscope size={10} style={{ color: "#6AA2FF" }} />
        }
      </div>

      {/* Bubble */}
      <div className={`group flex flex-col gap-1.5 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Image preview */}
        {message.imageUrl && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={message.imageUrl} alt="" className="max-w-[240px] max-h-[200px] object-cover block" />
          </div>
        )}

        {/* Text bubble */}
        {message.text && (
          <div className="relative">
            <div
              className="relative px-4 py-3 text-sm leading-relaxed"
              style={
                isUser
                  ? {
                      background: "linear-gradient(135deg, #3A50FF 0%, #4F7FFF 100%)",
                      borderRadius: "18px 18px 4px 18px",
                      color: "rgba(255,255,255,0.94)",
                      boxShadow: "0 4px 20px rgba(63,87,255,0.25)",
                    }
                  : {
                      background: "rgba(255,255,255,0.055)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: "18px 18px 18px 4px",
                      color: "rgba(255,255,255,0.82)",
                      backdropFilter: "blur(8px)",
                    }
              }
            >
              {isStreaming ? (
                <span>{message.text}</span>
              ) : (
                <div className="prose prose-sm max-w-none prose-invert prose-p:my-1 prose-headings:text-white/90 prose-strong:text-white prose-a:text-[#6AA2FF] prose-code:text-[#6AA2FF] prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Copy button for bot messages */}
            {!isUser && !isStreaming && message.text && (
              <button
                onClick={handleCopy}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="text-white/50" />}
              </button>
            )}
          </div>
        )}

        {/* Book appointment button */}
        {!isUser && message.showDoctorButton && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onBookAppointment}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all hover:scale-[1.02] hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #3A50FF 0%, #4F7FFF 100%)",
              boxShadow: "0 4px 16px rgba(63,87,255,0.28)",
            }}
          >
            <Calendar size={13} />
            {bookLabel}
          </motion.button>
        )}

        {/* Timestamp */}
        <p className="text-[10px] px-1" style={{ color: "rgba(255,255,255,0.22)" }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}
