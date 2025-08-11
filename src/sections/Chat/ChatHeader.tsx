"use client";

import { FaRobot } from "react-icons/fa";

interface ChatHeaderProps {
  language: string;
}

export default function ChatHeader({ language }: ChatHeaderProps) {
  const getSubtitle = () => {
    switch (language) {
      case "ru": return "ИИ медицинский ассистент";
      case "en": return "AI Medical Assistant";
      case "kz": return "AI медициналық көмекшісі";
      default: return "AI Medical Assistant";
    }
  };

  return (
    <div className="flex items-center justify-center mb-6 pb-4 border-b border-white/10">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full flex items-center justify-center">
          <FaRobot className="text-white text-lg" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">ZhanBot.AI</h3>
          <p className="text-sm text-white/60">
            {getSubtitle()}
          </p>
        </div>
      </div>
    </div>
  );
}