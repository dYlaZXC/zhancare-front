"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

type Props = {
  currentLanguage: string;
  setLanguage: (lang: "ru" | "en" | "kz") => void;
  variant?: "dark" | "light";
};

interface Language {
  code: "ru" | "en" | "kz";
  label: string;
  flag: string;
  flagImage: string;
}

const languages: Language[] = [
  { code: "ru", label: "RU", flag: "🇷🇺", flagImage: "https://flagcdn.com/24x18/ru.png" },
  { code: "en", label: "EN", flag: "🇺🇸", flagImage: "https://flagcdn.com/24x18/us.png" },
  { code: "kz", label: "KZ", flag: "🇰🇿", flagImage: "https://flagcdn.com/24x18/kz.png" },
];

function Flag({ lang }: { lang: Language }) {
  const [error, setError] = useState(false);
  if (error) return <span style={{ fontSize: 11, lineHeight: 1 }}>{lang.flag}</span>;
  return (
    <Image
      src={lang.flagImage}
      alt={lang.label}
      width={14}
      height={11}
      className="object-cover rounded-[2px] shrink-0"
      onError={() => setError(true)}
    />
  );
}

export default function LanguageSwitcher({ currentLanguage, setLanguage, variant = "dark" }: Props) {
  const activeIndex = languages.findIndex(l => l.code === currentLanguage);
  const isLight = variant === "light";

  return (
    <div
      data-language-dropdown="true"
      className={`relative flex items-center rounded-xl p-0.5 backdrop-blur-md ${
        isLight
          ? "bg-[#ebf1ff] border border-[#d0dcf7]"
          : "bg-white/[0.08] border border-white/15"
      }`}
      style={{ gap: 0 }}
    >
      {/* Sliding highlight */}
      <motion.div
        className="absolute top-0.5 bottom-0.5 rounded-[10px] bg-gradient-to-r from-[#1A2FC8] to-[#3772ff] shadow-[0_2px_12px_rgba(55,114,255,0.45)]"
        animate={{ left: `calc(${activeIndex} * (100% / 3) + 2px)` }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{ width: "calc(100% / 3 - 4px)" }}
      />

      {languages.map((lang) => {
        const isActive = lang.code === currentLanguage;
        return (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-colors duration-200 focus:outline-none"
            style={{ flex: 1, justifyContent: "center", minWidth: 52 }}
          >
            <Flag lang={lang} />
            <span
              className="text-[11px] font-semibold tracking-wider transition-colors duration-200"
              style={{
                color: isActive
                  ? "#fff"
                  : isLight ? "#7a96d4" : "rgba(255,255,255,0.5)",
              }}
            >
              {lang.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
