"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

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
    flagImage: "https://flagcdn.com/24x18/ru.png" // Better size
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

// Custom Flag component that can render emoji or image
const FlagDisplay = ({ language, size = "sm", className = "" }: { 
  language: Language; 
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const [useEmoji, setUseEmoji] = useState(false); // Try images first
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "w-4 h-3",
    md: "w-5 h-4", 
    lg: "w-6 h-5"
  };

  // Force emoji if images fail or useEmoji is true
  if (useEmoji || imageError || !language.flagImage) {
    return (
      <span 
        className={`inline-block text-${size === 'sm' ? 'sm' : size === 'md' ? 'base' : 'lg'} ${className}`}
        style={{ 
          fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px',
          lineHeight: '1',
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif'
        }}
      >
        {language.flag}
      </span>
    );
  }

  // Use image flags with better error handling
  return (
    <img
      src={language.flagImage}
      alt={`${language.name} flag`}
      className={`${sizeClasses[size]} object-cover rounded-sm shadow-sm ${className}`}
      onError={() => {
        console.log(`Flag image failed for ${language.code}, falling back to emoji`);
        setImageError(true);
      }}
      onLoad={() => console.log(`Flag image loaded for ${language.code}`)}
    />
  );
};

export default function LanguageSwitcher({ currentLanguage, setLanguage }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];
  const otherLanguages = languages.filter(lang => lang.code !== currentLanguage);

  // More specific outside click handler
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
    console.log(`Current language in switcher: ${currentLanguage}`);
    console.log(`Attempting to switch to: ${langCode}`);
    
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
      {/* Main Button */}
      <motion.button
        onClick={toggleDropdown}
        className="relative bg-white/10 backdrop-blur-md text-white px-3 py-2 rounded-lg font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center space-x-2 min-w-[95px] justify-center"
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 8px 25px rgba(58, 80, 255, 0.3)"
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Background Glow */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-[#001E80]/20 to-[#3A50FF]/20 rounded-lg blur-sm"
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center space-x-1.5">
          <motion.div
            key={currentLanguage}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
          >
            <FlagDisplay language={currentLang} size="sm" />
          </motion.div>
          <motion.span 
            className="text-sm font-semibold tracking-wide"
            key={`${currentLanguage}-text`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              delay: 0.1 
            }}
          >
            {currentLang.shortName}
          </motion.span>
          
          {/* Chevron Icon */}
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1 w-3 h-3"
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
        
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-lg"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "linear"
          }}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl min-w-[180px] z-[9999] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Dropdown Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#001E80]/5 to-[#3A50FF]/5 rounded-xl" />
            
            <div className="py-2 relative z-10">
              {/* Current Language (Selected) */}
              <div className="px-4 py-2 flex items-center space-x-3 border-b border-white/10">
                <FlagDisplay language={currentLang} size="md" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{currentLang.name}</span>
                  <span className="text-xs text-green-400">Currently selected</span>
                </div>
              </div>

              {/* All Other Languages */}
              {otherLanguages.map((language, index) => (
                <motion.button
                  key={language.code}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLanguageSelect(language.code);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group relative"
                  whileHover={{ 
                    x: 4,
                    backgroundColor: "rgba(255, 255, 255, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  {/* Hover indicator */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#001E80] to-[#3A50FF] rounded-r-full"
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  
                  <motion.div
                    className="group-hover:scale-110 transition-transform duration-200"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <FlagDisplay language={language} size="md" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{language.name}</span>
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

      {/* Conditional mobile backdrop */}
      {isOpen && !document.getElementById('mobile-menu') && (
        <div 
          className="fixed inset-0 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}