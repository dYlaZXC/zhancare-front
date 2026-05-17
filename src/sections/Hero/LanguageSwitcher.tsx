"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type LangCode = "ru" | "en" | "kz" | "uz";

type Props = {
  currentLanguage: string;
  setLanguage: (lang: LangCode) => void;
  variant?: "dark" | "light";
};

interface Language {
  code: LangCode;
  label: string;
  flag: string;
  flagImage: string;
}

const languages: Language[] = [
  { code: "ru", label: "RU", flag: "🇷🇺", flagImage: "https://flagcdn.com/24x18/ru.png" },
  { code: "en", label: "EN", flag: "🇺🇸", flagImage: "https://flagcdn.com/24x18/us.png" },
  { code: "kz", label: "KZ", flag: "🇰🇿", flagImage: "https://flagcdn.com/24x18/kz.png" },
  { code: "uz", label: "UZ", flag: "🇺🇿", flagImage: "https://flagcdn.com/24x18/uz.png" },
];

function Flag({ lang, size = 14 }: { lang: Language; size?: number }) {
  const [error, setError] = useState(false);
  if (error) return <span style={{ fontSize: 11, lineHeight: 1 }}>{lang.flag}</span>;
  return (
    <Image
      src={lang.flagImage}
      alt={lang.label}
      width={size}
      height={Math.round(size * 0.75)}
      className="object-cover rounded-[2px] shrink-0"
      onError={() => setError(true)}
    />
  );
}

export default function LanguageSwitcher({ currentLanguage, setLanguage, variant = "dark" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isLight = variant === "light";

  const active = languages.find(l => l.code === currentLanguage) ?? languages[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      ref={ref}
      data-language-dropdown="true"
      className="relative"
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 ${
          isLight
            ? "bg-[#ebf1ff] border border-[#d0dcf7] hover:bg-[#dce8ff]"
            : "bg-white/[0.08] border border-white/15 hover:bg-white/[0.14]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Flag lang={active} />
        <span
          className="text-[11px] font-semibold tracking-wider"
          style={{ color: isLight ? "#29358f" : "rgba(255,255,255,0.9)" }}
        >
          {active.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: isLight ? "#7a96d4" : "rgba(255,255,255,0.5)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-50 min-w-[110px] rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: "rgba(20,20,35,0.97)", backdropFilter: "blur(20px)" }}
          role="listbox"
        >
          {languages.map((lang) => {
            const isActive = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-150 ${
                  isActive
                    ? "bg-white/10"
                    : "hover:bg-white/[0.07]"
                }`}
              >
                <Flag lang={lang} size={16} />
                <span
                  className="text-[12px] font-semibold tracking-wider"
                  style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.55)" }}
                >
                  {lang.label}
                </span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
