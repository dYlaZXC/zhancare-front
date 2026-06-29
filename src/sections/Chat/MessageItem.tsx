"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaStethoscope, FaCopy, FaCheck } from "react-icons/fa";
import Image from "next/image";
import { Message } from "./types";

interface MessageItemProps {
  message: Message;
  index: number;
  language: string;
  onBookAppointment: () => void;
  isStreaming?: boolean;
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

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[2] !== undefined) parts.push(<em key={m.index}>{m[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function formatBotMessage(text: string): React.ReactNode {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  type ListState = { ordered: boolean; items: string[] } | null;
  let list: ListState = null;
  let paraLines: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (!paraLines.length) return;
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(paraLines.join(" "))}
      </p>
    );
    paraLines = [];
  };

  const flushList = () => {
    if (!list) return;
    if (list.ordered) {
      blocks.push(
        <ol key={key++} className="space-y-1.5 list-none">
          {list.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-semibold flex-shrink-0 w-5 text-right text-[#6aa2ff]">{i + 1}.</span>
              <span className="leading-relaxed flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={key++} className="space-y-1.5 list-none">
          {list.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 rounded-full mt-[7px] bg-[#6aa2ff]" style={{ width: 5, height: 5 }} />
              <span className="leading-relaxed flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }

    const ol = line.match(/^(\d+)[.)]\s+(.+)/);
    if (ol) {
      flushPara();
      if (list && !list.ordered) flushList();
      if (!list) list = { ordered: true, items: [] };
      list.items.push(ol[2]);
      continue;
    }

    const ul = line.match(/^[-*•]\s+(.+)/);
    if (ul) {
      flushPara();
      if (list && list.ordered) flushList();
      if (!list) list = { ordered: false, items: [] };
      list.items.push(ul[1]);
      continue;
    }

    flushList();
    paraLines.push(line);
  }
  flushPara();
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}

export default function MessageItem({
  message,
  index,
  language,
  onBookAppointment,
  isStreaming
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const getDoctorButtonText = () => {
    switch (language) {
      case "ru": return "Записаться к врачу";
      case "en": return "Book Appointment";
      case "kz": return "Дәрігерге жазылу";
      case "uz": return "Shifokorga yozilish";
      default: return "Book Appointment";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={message.sender === "user"
          ? { background: "linear-gradient(135deg, #4F7FFF, #6AA2FF)" }
          : { background: "linear-gradient(135deg, #4F7FFF 0%, #00C6FF 100%)" }
        }
      >
        {message.sender === "user" ? (
          <FaUser className="text-white text-xs" />
        ) : (
          <FaStethoscope className="text-white text-xs" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${
        message.sender === "user" ? "items-end" : "items-start"
      }`}>
        {/* Message Bubble with hover copy */}
        <div className="relative group">
          <div className={`px-[18px] py-[14px] rounded-[18px] shadow-lg ${
            message.sender === "user"
              ? "bg-gradient-to-br from-[#4F7FFF] to-[#6AA2FF] text-white"
              : "bg-white/[0.07] backdrop-blur-sm text-white border border-white/[0.12]"
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
              <>
                {formatBotMessage(message.text)}
                {isStreaming && (
                  <motion.span
                    className="inline-block w-[2px] h-[1em] bg-white/80 ml-[2px] align-middle rounded-sm"
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear", times: [0, 0.49, 0.5, 1] }}
                  />
                )}
              </>
            ) : (
              message.text
            )}
          </div>

          {/* Copy button — bot messages only, hidden while streaming */}
          {message.sender === "bot" && !isStreaming && message.text && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white/70 hover:text-white backdrop-blur-sm border border-white/10"
              title="Copy"
            >
              {copied ? <FaCheck size={11} className="text-green-400" /> : <FaCopy size={11} />}
            </button>
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
