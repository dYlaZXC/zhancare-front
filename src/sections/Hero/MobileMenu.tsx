"use client";

import { useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUserMd } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
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
  
  // Get translations based on current language
  const translations = (() => {
    switch (language) {
      case "ru": return ru.hero;
      case "kz": return kz.hero;
      case "en": return en.hero;
      default: return ru.hero;
    }
  })();

  const navigationKeys = Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>;

  const trapRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  // IMPROVED: Handle overlay clicks with language switcher exception
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    
    // Don't close if clicking on language dropdown
    if (target.closest('[data-language-dropdown]')) {
      return;
    }
    
    // Only close if clicking directly on the overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
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

  // Get localized text functions
  const getCloseAriaLabel = useCallback(() => {
    switch (language) {
      case "ru": return "Закрыть меню";
      case "en": return "Close menu";
      case "kz": return "Мәзірді жабу";
      default: return "Close menu";
    }
  }, [language]);

  const getMenuAriaLabel = useCallback(() => {
    switch (language) {
      case "ru": return "Навигационное меню";
      case "en": return "Navigation menu";
      case "kz": return "Навигациялық мәзір";
      default: return "Navigation menu";
    }
  }, [language]);

  const getNavigationHint = useCallback(() => {
    switch (language) {
      case "ru": return "Навигация сайта. Используйте Tab для перемещения.";
      case "en": return "Site navigation. Use Tab to navigate.";
      case "kz": return "Сайт навигациясы. Жылжу үшін Tab пернесін пайдаланыңыз.";
      default: return "Site navigation. Use Tab to navigate.";
    }
  }, [language]);

  const getAuthButtonText = useCallback(() => {
    switch (language) {
      case "ru": return "Войти";
      case "en": return "Sign In";
      case "kz": return "Кіру";
      default: return "Sign In";
    }
  }, [language]);

  const getProfilePath = useCallback(() => {
    return user?.role === "doctor" ? "/doctor-profile" : "/profile";
  }, [user]);

  // Animation variants
  const menuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
        duration: 0.3
      }
    },
    exit: { 
      x: "100%", 
      opacity: 0,
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 0.6 },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* SIMPLIFIED: Basic overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black z-40"
            aria-hidden="true"
            onClick={handleOverlayClick}
          />

          {/* Menu Panel */}
          <motion.div
            ref={menuPanelRef}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 w-4/5 max-w-sm h-full z-50 bg-gradient-to-br from-[#1D1D2F]/95 to-[#2A2A3A]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl text-white flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={getMenuAriaLabel()}
            id="mobile-menu"
          >
            {/* SIMPLIFIED: More permissive FocusTrap */}
            <FocusTrap
              focusTrapOptions={{
                allowOutsideClick: true,
                clickOutsideDeactivates: false,
                returnFocusOnDeactivate: true,
                escapeDeactivates: true,
                // Don't interfere with dropdowns
                tabbableOptions: {
                  displayCheck: 'none'
                }
              }}
            >
              <div ref={trapRef} className="p-6 h-full flex flex-col">
                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.2 }}
                  aria-label={getCloseAriaLabel()}
                  className="self-end mb-6 text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                  onClick={onClose}
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </motion.button>

                {/* Screen Reader Hint */}
                <span className="sr-only">{getNavigationHint()}</span>

                {/* Navigation */}
                <nav className="flex flex-col gap-4 text-lg font-medium flex-1">
                  {navigationKeys.map((key, index) => (
                    <motion.button
                      key={key}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => onScrollToSection(key)}
                      className="group text-left py-3 px-4 rounded-xl hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 border border-transparent hover:border-white/20"
                    >
                      <span className="group-hover:translate-x-2 transition-transform duration-200 inline-block">
                        {translations.navigation[key]}
                      </span>
                    </motion.button>
                  ))}

                  {/* IMPROVED: Language Switcher with proper container */}
                  <motion.div
                    custom={navigationKeys.length}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-4 relative"
                    data-language-dropdown="container"
                  >
                    <LanguageSwitcher
                      currentLanguage={language}
                      setLanguage={setLanguage}
                    />
                  </motion.div>

                  {/* Authentication Button */}
                  <motion.div
                    custom={navigationKeys.length + 1}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-auto pt-6"
                  >
                    {user ? (
                      <button
                        onClick={() => {
                          window.location.href = getProfilePath();
                          onClose();
                        }}
                        className="group w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-xl px-6 py-4 font-medium hover:from-[#0029A3] hover:to-[#4A5DFF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-center space-x-3"
                      >
                        <FontAwesomeIcon 
                          icon={faUserMd} 
                          className="text-lg group-hover:scale-110 transition-transform duration-200" 
                        />
                        <span>{user.first_name}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAuthOpen(true);
                          onClose();
                        }}
                        className="group w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-xl px-6 py-4 font-medium hover:from-[#0029A3] hover:to-[#4A5DFF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 relative overflow-hidden"
                      >
                        <span className="relative z-10">{getAuthButtonText()}</span>
                        <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      </button>
                    )}
                  </motion.div>
                </nav>
              </div>
            </FocusTrap>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}