"use client";

import { createContext, useContext, useState } from "react";

type Language = "ru" | "en" | "kz";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = "zhancare_language";

function detectLanguage(): Language {
  // 1. User already chose a language — respect it
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "ru" || saved === "en" || saved === "kz") return saved;
  }

  // 2. Detect from browser
  const browserLang = (
    typeof navigator !== "undefined"
      ? navigator.language || (navigator as any).userLanguage || ""
      : ""
  ).toLowerCase();

  if (browserLang.startsWith("kk") || browserLang.startsWith("kz")) return "kz";
  if (browserLang.startsWith("en")) return "en";
  return "ru"; // default
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ru",
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);