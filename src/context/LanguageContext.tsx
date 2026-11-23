"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Language = "ru" | "en" | "kz" | "uz";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = "zhancare_language";

function detectLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (saved === "ru" || saved === "en" || saved === "kz" || saved === "uz") return saved;

  const browserLang = (
    navigator.language || (navigator as any).userLanguage || ""
  ).toLowerCase();

  if (browserLang.startsWith("kk") || browserLang.startsWith("kz")) return "kz";
  if (browserLang.startsWith("uz")) return "uz";
  if (browserLang.startsWith("en")) return "en";
  return "ru";
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ru",
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("ru");

  useEffect(() => {
    setLanguageState(detectLanguage());
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
