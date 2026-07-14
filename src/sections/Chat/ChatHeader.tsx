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
    <div
      className="flex items-center justify-between mb-5 pb-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
            boxShadow: `0 4px 14px ${brand.primary}44`,
          }}
        >
          <FaStethoscope className="text-white" style={{ fontSize: 13 }} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-semibold text-white leading-tight">{botName}</h3>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.32)" }}>{c.online}</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{c.subtitle}</p>
        </div>
      </div>

      {onExpand && (
        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.30)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.80)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.30)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          title={isExpanded ? "Collapse" : "Fullscreen"}
        >
          {isExpanded ? <FaCompress size={12} /> : <FaExpand size={12} />}
        </button>
      )}
    </div>
  );
}
