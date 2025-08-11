"use client"; // This directive is required for using React hooks

import { createContext, useContext, useState } from "react";

// Define the supported languages as a type
type Language = "ru" | "en" | "kz";

// Define the context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ru", // Default language
  setLanguage: (lang: Language) => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>("ru");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);