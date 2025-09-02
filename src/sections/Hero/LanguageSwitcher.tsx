"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Props = {
  currentLanguage: string;
  setLanguage: (lang: "ru" | "en" | "kz") => void;
};

interface Language {
  code: "ru" | "en" | "kz";
  name: string;
  flag: string;
  shortName: string;
  flagImage?: string; // Optional image URL
}  

const languages: Language[] = [
  { 
    code: "ru", 
    name: "Русский", 
    flag: "🇷🇺", 
    shortName: "РУС",
    flagImage: "https://flagcdn.com/24x18/ru.png"
  },
  { 
    code: "en", 
    name: "English", 
    flag: "🇺🇸", 
    shortName: "EN",
    flagImage: "https://flagcdn.com/24x18/us.png"
  },
  { 
    code: "kz", 
    name: "Қазақша", 
    flag: "🇰🇿", 
    shortName: "ҚАЗ",
    flagImage: "https://flagcdn.com/24x18/kz.png"
  }
];

// Compact Flag component for mobile
const FlagDisplay = ({ language, size = "sm", className = "" }: {
  language: Language;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);
    
  const sizeClasses = {
    sm: "w-3 h-2.5",
    md: "w-4 h-3", 
    lg: "w-5 h-4"
  };

  // Use emoji if images fail
  if (imageError || !language.flagImage) {
    return (
      <span 
        className={`inline-block ${className}`}
        style={{
          fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
          lineHeight: '1'
        }}
      >
        {language.flag}
      </span>
    );
  }

  const dimensionMap = {
    sm: { width: 12, height: 10 },
    md: { width: 16, height: 12 },
    lg: { width: 20, height: 16 }
  };

  return (
    <Image
      src={language.flagImage}
      alt={`${language.name} flag`}
      width={dimensionMap[size].width}
      height={dimensionMap[size].height}
      className={`${sizeClasses[size]} object-cover rounded-sm ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export default function LanguageSwitcher({ currentLanguage, setLanguage }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
    
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];
  const otherLanguages = languages.filter(lang => lang.code !== currentLanguage);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
            
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
            
      if (target.closest('#mobile-menu') && !dropdownRef.current?.contains(target)) {
        const isDropdownClick = target.closest('[data-language-dropdown]');
        if (!isDropdownClick) {
          setIsOpen(false);
        }
      } else if (!target.closest('#mobile-menu')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleLanguageSelect = (langCode: "ru" | "en" | "kz") => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const toggleDropdown = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div 
      className="relative"
      ref={dropdownRef}
      data-language-dropdown="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Compact Main Button */}
      <motion.button
        onClick={toggleDropdown}
        className="relative bg-white/10 backdrop-blur-md text-white px-2 py-1.5 rounded-lg font-medium border border-white/20 hover:bg-white/20 flex items-center space-x-1.5 min-w-[60px] justify-center"
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 4px 15px rgba(58, 80, 255, 0.2)"
        }}
        whileTap={{ scale: 0.98 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Background Glow */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-[#001E80]/20 to-[#3A50FF]/20 rounded-lg blur-sm"
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
                
        {/* Content */}
        <div className="relative z-10 flex items-center space-x-1">
          <motion.div
            key={currentLanguage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <FlagDisplay language={currentLang} size="sm" />
          </motion.div>
          <motion.span 
            className="text-xs font-semibold tracking-wide"
            key={`${currentLanguage}-text`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {currentLang.shortName}
          </motion.span>
                    
          {/* Compact Chevron Icon */}
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </motion.svg>
        </div>
      </motion.button>

      {/* Compact Dropdown Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[9999] overflow-hidden min-w-[120px]"
            initial={{
              opacity: 0,
              scaleY: 0,
              transformOrigin: "top center"
            }}
            animate={{
              opacity: 1,
              scaleY: 1
            }}
            exit={{
              opacity: 0,
              scaleY: 0,
              transformOrigin: "top center"
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Dropdown Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#001E80]/5 to-[#3A50FF]/5 rounded-xl" />
                        
            <div className="py-1.5 relative z-10">
              {/* Current Language (Selected) */}
              <div className="px-3 py-1.5 flex items-center space-x-2 border-b border-white/10">
                <FlagDisplay language={currentLang} size="sm" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white">{currentLang.name}</span>
                  <span className="text-xs text-green-400">Current</span>
                </div>
              </div>

              {/* Other Languages */}
              {otherLanguages.map((language, index) => (
                <motion.button
                  key={language.code}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLanguageSelect(language.code);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2 group relative"
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: 0.05 + index * 0.03,
                    duration: 0.2
                  }}
                >
                  {/* Hover indicator */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#001E80] to-[#3A50FF] rounded-r-full"
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.15 }}
                  />
                                    
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>
                    <FlagDisplay language={language} size="sm" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{language.name}</span>
                    <span className="text-xs text-white/60">Switch to {language.shortName}</span>
                  </div>
                </motion.button>
              ))}
            </div>
                        
            {/* Bottom border glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      {isOpen && !document.getElementById('mobile-menu') && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}