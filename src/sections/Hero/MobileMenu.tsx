"use client";

import { useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faHome,
  faGlobe,
  faHospital,
  faRobot,
  faStethoscope,
  faCubes,
  faPhone
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import uz from "@/locales/uz.json";
import LanguageSwitcher from "./LanguageSwitcher";
import UserDropdown from "./UserDropdown";
import { motion, AnimatePresence } from "framer-motion";
import { FocusTrap } from "focus-trap-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onScrollToSection: (id: string) => void;
};

export default function MobileMenu({ isOpen, onClose, onScrollToSection }: Props) {
  const { setIsAuthOpen, user, logoutUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  
  // Get translations based on current language
  const translations = (() => {
    switch (language) {
      case "ru": return ru.hero;
      case "kz": return kz.hero;
      case "en": return en.hero;
      case "uz": return uz.hero;
      default: return ru.hero;
    }
  })();

  // "Наш путь" (traction) is intentionally not in the menu
  const navigationKeys = (Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>)
    .filter((k) => k !== "traction");

  // Navigation icons mapping
  const getNavigationIcon = (key: string) => {
    const iconMap: Record<string, any> = {
      hero: faHome,
      "ai-chat": faRobot,
      services: faHospital,
      specialists: faStethoscope,
      modules: faCubes,
      contacts: faPhone,
      default: faGlobe
    };
    return iconMap[key] || iconMap.default;
  };

  const trapRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    
    if (target.closest('[data-language-dropdown]')) {
      return;
    }
    
    if (target.closest('[data-user-dropdown]')) {
      return;
    }
    
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
      case "uz": return "Menyuni yopish";
      default: return "Close menu";
    }
  }, [language]);

  const getMenuAriaLabel = useCallback(() => {
    switch (language) {
      case "ru": return "Навигационное меню";
      case "en": return "Navigation menu";
      case "kz": return "Навигациялық мәзір";
      case "uz": return "Navigatsiya menyusi";
      default: return "Navigation menu";
    }
  }, [language]);

  const getNavigationHint = useCallback(() => {
    switch (language) {
      case "ru": return "Навигация сайта. Используйте Tab для перемещения.";
      case "en": return "Site navigation. Use Tab to navigate.";
      case "kz": return "Сайт навигациясы. Жылжу үшін Tab пернесін пайдаланыңыз.";
      case "uz": return "Sayt navigatsiyasi. Harakatlanish uchun Tab dan foydalaning.";
      default: return "Site navigation. Use Tab to navigate.";
    }
  }, [language]);

  const getAuthButtonText = useCallback(() => {
    switch (language) {
      case "ru": return "Войти";
      case "en": return "Sign In";
      case "kz": return "Кіру";
      case "uz": return "Kirish";
      default: return "Sign In";
    }
  }, [language]);

  const handleLogout = useCallback(() => {
    onClose();
    logoutUser(); // shows its own toast, revokes the server session, navigates to /login
  }, [logoutUser, onClose]);

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
    hidden: { opacity: 0, x: 30 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        type: "spring",
        damping: 20
      }
    })
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Overlay with blur effect */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
            aria-hidden="true"
            onClick={handleOverlayClick}
          />

          {/* Enhanced Menu Panel */}
          <motion.div
            ref={menuPanelRef}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 w-5/6 xs:w-4/5 max-w-sm h-full z-[10000] bg-gradient-to-br from-[#0A0A1A]/98 via-[#1A1A2E]/98 to-[#16213E]/98 backdrop-blur-2xl border-l border-white/10 shadow-2xl text-white flex flex-col"
            data-mobile-menu="true"
            style={{
              boxShadow: `
                -20px 0 60px rgba(74, 93, 255, 0.1),
                -10px 0 30px rgba(74, 93, 255, 0.05),
                inset 1px 0 1px rgba(255, 255, 255, 0.1)
              `
            }}
            role="dialog"
            aria-modal="true"
            aria-label={getMenuAriaLabel()}
            id="mobile-menu"
          >
            <FocusTrap
              focusTrapOptions={{
                allowOutsideClick: true,
                clickOutsideDeactivates: false,
                returnFocusOnDeactivate: true,
                escapeDeactivates: true,
                tabbableOptions: {
                  displayCheck: 'none'
                }
              }}
            >
              <div ref={trapRef} className="h-full flex flex-col">
                {/* Enhanced Header */}
                <motion.div 
                  variants={headerVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative p-4 sm:p-6 border-b border-white/10"
                >
                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#001E80]/20 to-[#3A50FF]/20" />
                  
                  <div className="relative flex items-center justify-between gap-4">
                    {user ? (
                      <div className="flex-1 mr-3">
                        <UserDropdown user={user} onLogout={handleLogout} disableClickOutside={true} isMobile={true} />
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => {
                          setIsAuthOpen(true);
                          onClose();
                        }}
                        className="group flex-1 mr-2 sm:mr-3 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-lg sm:rounded-xl p-3 sm:p-4 font-medium hover:from-[#0029A3] hover:to-[#4A5DFF] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 relative overflow-hidden flex items-center gap-2 sm:gap-3"
                        style={{
                          boxShadow: `
                            0 0 20px rgba(74, 93, 255, 0.3),
                            0 0 40px rgba(74, 93, 255, 0.1),
                            inset 0 1px 1px rgba(255, 255, 255, 0.1)
                          `
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Neon glow effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#4A5DFF]/20 to-[#6B7DFF]/20 blur-lg" />
                        
                        <div className="relative flex items-center gap-2 sm:gap-3 w-full justify-center">
                          <span className="text-base sm:text-lg font-semibold">{getAuthButtonText()}</span>
                        </div>
                      </motion.button>
                    )}
                    
                    <motion.button
                      aria-label={getCloseAriaLabel()}
                      className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 group"
                      onClick={onClose}
                      whileHover={{ scale: 1.05, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FontAwesomeIcon 
                        icon={faTimes} 
                        className="text-base sm:text-lg group-hover:text-white transition-colors duration-200" 
                      />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Screen Reader Hint */}
                <span className="sr-only">{getNavigationHint()}</span>

                {/* Enhanced Navigation */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                  <nav className="space-y-2 sm:space-y-3">
                    {navigationKeys.map((key, index) => (
                      <motion.button
                        key={key}
                        custom={index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => onScrollToSection(key)}
                        className="group w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 relative overflow-hidden"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#001E80]/20 to-[#3A50FF]/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                        
                        <div className="relative flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-all duration-200 group-hover:scale-110">
                            <FontAwesomeIcon 
                              icon={getNavigationIcon(key)} 
                              className="text-white/80 group-hover:text-white transition-colors duration-200" 
                            />
                          </div>
                          <span className="text-sm sm:text-base font-medium text-white/90 group-hover:text-white transition-colors duration-200">
                            {translations.navigation[key]}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </nav>

                  {/* Enhanced Language Switcher */}
                  <motion.div
                    custom={navigationKeys.length}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10"
                    data-language-dropdown="container"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <FontAwesomeIcon icon={faGlobe} className="text-white/60 text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-white/80">
                        {language === "ru" ? "Язык" : language === "kz" ? "Тіл" : "Language"}
                      </span>
                    </div>
                    <LanguageSwitcher
                      currentLanguage={language}
                      setLanguage={setLanguage}
                    />
                  </motion.div>
                </div>

              </div>
            </FocusTrap>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}