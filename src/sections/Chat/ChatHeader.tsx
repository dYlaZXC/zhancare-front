"use client";

import { FaStethoscope, FaExpand, FaCompress } from "react-icons/fa";
import { useBrand } from "@/context/BrandContext";

interface ChatHeaderProps {
  language: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export default function ChatHeader({ language, onExpand, isExpanded }: ChatHeaderProps) {
  const { brand } = useBrand();

  const content = {
    ru: { subtitle: "ИИ медицинский ассистент", online: "Онлайн" },
    en: { subtitle: "AI Medical Assistant", online: "Online" },
    kz: { subtitle: "AI медициналық көмекшісі", online: "Онлайн" },
    uz: { subtitle: "AI tibbiy yordamchi", online: "Onlayn" },
  };

  const c = content[language as keyof typeof content] || content.en;
  const botName = brand.id === "uz" || language === "uz" ? "JonBot.Ai" : "ZhanBot.AI";

  return (
    <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.07]">
      <div className="flex items-center space-x-3">
        <div
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}
        >
          <FaStethoscope className="text-white text-base" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{botName}</h3>
          <p className="text-xs text-white/45 mt-0.5">{c.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Online status */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/40">{c.online}</span>
        </div>

        {/* Expand / Collapse button */}
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/10 transition"
            title={isExpanded ? "Collapse" : "Fullscreen"}
          >
            {isExpanded ? <FaCompress size={13} /> : <FaExpand size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
