"use client";

import { useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUserMd } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import LanguageSwitcher from "./LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { FocusTrap } from "focus-trap-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onScrollToSection: (id: string) => void;
};

export default function MobileMenu({ isOpen, onClose, onScrollToSection }: Props) {
  const { setIsAuthOpen, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const translations = language === "ru" ? ru.hero : kz.hero;
  const navigationKeys = Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>;

  const trapRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 w-4/5 max-w-sm h-full z-50 bg-white/10 backdrop-blur-md shadow-xl text-white flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Навигационное меню"
            id="mobile-menu"
          >
            <FocusTrap>
              <div ref={trapRef} className="p-6 h-full flex flex-col">
                <button
                  aria-label="Закрыть меню"
                  className="self-end mb-4 text-white"
                  onClick={onClose}
                >
                  <FontAwesomeIcon icon={faTimes} className="text-2xl" />
                </button>

                <span className="sr-only">Навигация сайта. Используйте Tab для перемещения.</span>

                <nav className="flex flex-col gap-6 text-lg font-medium">
                  {navigationKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => onScrollToSection(key)}
                      className="text-left hover:text-gray-300 transition-colors"
                    >
                      {translations.navigation[key]}
                    </button>
                  ))}

                  <LanguageSwitcher
                    toggleLanguage={() => setLanguage(language === "ru" ? "kz" : "ru")}
                    currentLanguage={language}
                  />

                  {user ? (
                    <button
                      onClick={() =>
                        (window.location.href = user.role === "doctor" ? "/doctor-profile" : "/profile")
                      }
                      className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-lg px-5 py-2 mt-6"
                    >
                      <FontAwesomeIcon icon={faUserMd} className="mr-2" />
                      {user.first_name}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAuthOpen(true);
                        onClose();
                      }}
                      className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-lg px-5 py-2 mt-6"
                    >
                      {language === "ru" ? "Войти" : "Кіру"}
                    </button>
                  )}
                </nav>
              </div>
            </FocusTrap>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
