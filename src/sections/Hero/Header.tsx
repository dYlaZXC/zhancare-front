"use client";
import Image from "next/image";
import MenuIcon from "@/assets/menu.svg";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import uz from "@/locales/uz.json";
import LanguageSwitcher from "./LanguageSwitcher";
import UserDropdown from "./UserDropdown";
import MobileMenu from "./MobileMenu";
import { Rocket } from "lucide-react";

// Constants
const SCROLL_THRESHOLD = 50;
const SCROLL_OPTIONS = { passive: true };

export default function Header() {
  const { setIsAuthOpen, user, logoutUser } = useAuth();
  const { appLogo, brand } = useBrand();
  const { language, setLanguage } = useLanguage();
    
  // Debug: Log language changes
  useEffect(() => {
    // console.log(`Header component language changed to: ${language}`);
  }, [language]);
    
  // Memoize translations to prevent unnecessary re-renders
  const translations = useMemo(() => {
    switch (language) {
      case "ru": return ru.hero;
      case "en": return en.hero;
      case "kz": return kz.hero;
      case "uz": return uz.hero;
      default: return ru.hero;
    }
  }, [language]);
    
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tractionOpen, setTractionOpen] = useState(false);
  const tractionRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll handler - always visible, just changes background
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
        
    // Update background blur state with smoother transition
    setIsScrolled(currentScrollY > SCROLL_THRESHOLD);
        
    // Calculate scroll progress safely
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min((currentScrollY / maxScroll) * 100, 100);
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, SCROLL_OPTIONS);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // IMPROVED: More specific outside click handler that excludes language switcher
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
            
      // Don't close if clicking on language dropdown elements
      if (target.closest('[data-language-dropdown]')) {
        return;
      }
            
      // Don't close if clicking on mobile menu elements
      if (target.closest('[data-mobile-menu]')) {
        return;
      }
            
      // Don't close if clicking on user dropdown elements
      if (target.closest('[data-user-dropdown]')) {
        return;
      }
            
      // Close menu if clicking outside
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Close traction dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (tractionRef.current && !tractionRef.current.contains(e.target as Node)) {
        setTractionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleScrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
            
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
      });
    }
    setIsMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logoutUser();
    // Redirect to homepage after logout
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  }, [logoutUser]);



  // Get auth button text for current language
  const getAuthButtonText = useCallback(() => {
    switch (language) {
      case "ru": return "Войти";
      case "en": return "Sign In";
      case "kz": return "Кіру";
      case "uz": return "Kirish";
      default: return "Sign In";
    }
  }, [language]);

  // Get menu aria label for current language
  const getMenuAriaLabel = useCallback(() => {
    switch (language) {
      case "ru": return isMenuOpen ? "Закрыть меню" : "Открыть меню";
      case "en": return isMenuOpen ? "Close menu" : "Open menu";
      case "kz": return isMenuOpen ? "Мәзірді жабу" : "Мәзірді ашу";
      case "uz": return isMenuOpen ? "Menyuni yopish" : "Menyuni ochish";
      default: return isMenuOpen ? "Close menu" : "Open menu";
    }
  }, [language, isMenuOpen]);

  // Get navigation aria label for current language
  const getNavAriaLabel = useCallback(() => {
    switch (language) {
      case "ru": return "Основная навигация";
      case "en": return "Main navigation";
      case "kz": return "Негізгі навигация";
      case "uz": return "Asosiy navigatsiya";
      default: return "Main navigation";
    }
  }, [language]);

  // Memoize navigation keys — "traction" is rendered separately as a dropdown
  const navigationKeys = useMemo(() =>
    (Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>)
      .filter(k => k !== 'traction'),
    [translations]
  );

  const tractionDropdownLabels = useMemo(() => {
    const map: Record<string, { journey: string }> = {
      ru: { journey: 'Наш путь' },
      en: { journey: 'Our Journey' },
      kz: { journey: 'Біздің жол' },
      uz: { journey: "Bizning yo'l" },
    };
    return map[language] ?? map.ru;
  }, [language]);

  // Animation classes - always visible sticky header
  const headerClasses = useMemo(() => {
    const baseClasses = "fixed top-0 w-full z-50 transition-all duration-500 ease-out";
    const backgroundClasses = isScrolled 
      ? "bg-[#1D1D2F]/95 backdrop-blur-xl shadow-xl"
      : "bg-[#1D1D2F]/0 backdrop-blur-none";
        
    return `${baseClasses} ${backgroundClasses}`;
  }, [isScrolled]);

  return (
    <>
      <header className={headerClasses} role="banner">
        <div className="py-1.5 xs:py-2 sm:py-3 md:py-3 laptop-hd:py-2 desktop-fhd:py-3">
          <div className="container mx-auto flex items-center justify-between px-3 xs:px-4 sm:px-6 max-w-7xl laptop-hd:max-w-none desktop-fhd:max-w-none laptop-hd:px-6 desktop-fhd:px-8">
            {/* Logo */}
            <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
              <Image
                src={appLogo}
                alt={brand.name + " logo"}
                className="h-5 xs:h-6 sm:h-8 md:h-10 lg:h-12 laptop-hd:h-8 desktop-fhd:h-10 w-auto transition-transform hover:scale-105"
                priority
                width={140}
                height={140}
              />
            </div>

            {/* FIXED: Mobile menu button with better positioning and sizing */}
            <button
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0 min-w-[40px] xs:min-w-[44px] min-h-[40px] xs:min-h-[44px] flex items-center justify-center"
              onClick={toggleMenu}
              aria-label={getMenuAriaLabel()}
              aria-expanded={isMenuOpen}
              data-mobile-menu="trigger"
            >
              <MenuIcon 
                className={`h-5 w-5 transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-90' : 'rotate-0'
                }`}
              />
            </button>

            {/* Desktop navigation */}
            <nav
              className="hidden md:flex flex-wrap items-center gap-1 lg:gap-2 xl:gap-3 laptop-hd:gap-1.5 desktop-fhd:gap-2 text-white text-xs sm:text-sm lg:text-base laptop-hd:text-sm desktop-fhd:text-base flex-shrink-0"
              role="navigation"
              aria-label={getNavAriaLabel()}
            >
              <div className="flex flex-wrap items-center gap-1 lg:gap-2 laptop-hd:gap-1.5 desktop-fhd:gap-2">
                {navigationKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleScrollToSection(key)}
                    className="group relative px-2 py-3 lg:px-3 laptop-hd:px-2.5 desktop-fhd:px-3 rounded-full border border-white/30 hover:bg-white hover:text-[#1D1D2F] transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white/50 text-xs lg:text-sm laptop-hd:text-xs desktop-fhd:text-sm"
                  >
                    <span className="relative z-10">{translations.navigation[key]}</span>
                    <div className="absolute inset-0 bg-white rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </button>
                ))}

                {/* "Наш путь" dropdown */}
                <div ref={tractionRef} className="relative">
                  <button
                    onClick={() => setTractionOpen(prev => !prev)}
                    className="group relative flex items-center gap-1 px-2 py-3 lg:px-3 laptop-hd:px-2.5 desktop-fhd:px-3 rounded-full border border-white/30 hover:bg-white hover:text-[#1D1D2F] transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white/50 text-xs lg:text-sm laptop-hd:text-xs desktop-fhd:text-sm"
                    aria-haspopup="true"
                    aria-expanded={tractionOpen}
                  >
                    <span className="relative z-10">{translations.navigation['traction']}</span>
                    <svg
                      className={`relative z-10 w-3 h-3 transition-transform duration-200 ${tractionOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </button>

                  {/* Dropdown menu */}
                  {tractionOpen && (
                    <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50"
                         style={{ background: 'rgba(29,29,47,0.97)', backdropFilter: 'blur(20px)' }}>
                      {/* Item 1 — scroll to Traction section */}
                      <button
                        onClick={() => { handleScrollToSection('traction'); setTractionOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10 transition-colors"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}><Rocket size={14} className="text-white" /></span>
                        <div>
                          <div className="font-semibold leading-tight">{tractionDropdownLabels.journey}</div>
                          <div className="text-xs text-white/50 mt-0.5">
                            {language === 'ru' ? 'Наша история' : language === 'kz' ? 'Біздің тарих' : language === 'uz' ? "Bizning tarix" : 'Our story'}
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 lg:gap-2 laptop-hd:gap-1.5 desktop-fhd:gap-2 ml-1 lg:ml-2 laptop-hd:ml-1.5 desktop-fhd:ml-2">
                {/* Language switcher */}
                <LanguageSwitcher
                  currentLanguage={language}
                  setLanguage={setLanguage}
                />

                {/* Authentication */}
                {user ? (
                  <UserDropdown user={user} onLogout={handleLogout} />
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="group text-white rounded-xl px-4 py-3 font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 relative overflow-hidden text-sm whitespace-nowrap"
                    style={{ background: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.primary} 100%)` }}
                  >
                    <span className="relative z-10">
                      {getAuthButtonText()}
                    </span>
                    <div className="absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }} />
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* Progress indicator - only show when scrolling and has progress */}
        {isScrolled && scrollProgress > 0 && (
          <div 
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#001E80] to-[#3A50FF] transition-opacity duration-300"
            style={{
              width: `${scrollProgress}%`,
              opacity: scrollProgress > 1 ? 1 : 0
            }}
          />
        )}
      </header>

      {/* Mobile menu - handles its own overlay */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onScrollToSection={handleScrollToSection}
      />
    </>
  );
}