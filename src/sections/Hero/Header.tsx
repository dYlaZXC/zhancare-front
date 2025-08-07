"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import MenuIcon from "@/assets/menu.svg";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import LanguageSwitcher from "./LanguageSwitcher";
import UserDropdown from "./UserDropdown";
import MobileMenu from "./MobileMenu";

// Constants
const SCROLL_THRESHOLD = 50;
const SCROLL_OPTIONS = { passive: true };

export default function Header() {
  const { setIsAuthOpen, user, logoutUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  
  // Memoize translations to prevent unnecessary re-renders
  const translations = useMemo(() => 
    language === "ru" ? ru.hero : kz.hero, 
    [language]
  );
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('[data-mobile-menu]')) {
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
  }, [logoutUser]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ru" ? "kz" : "ru");
  }, [language, setLanguage]);

  // Memoize navigation keys
  const navigationKeys = useMemo(() => 
    Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>,
    [translations.navigation]
  );

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
        <div className="py-3 md:py-4">
          <div className="container mx-auto flex items-center justify-between px-4 max-w-7xl">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src={Logo}
                alt="ZhanCare.AI logo"
                className="h-8 w-auto md:h-20 transition-transform hover:scale-105"
                priority
                width={140}
                height={140}
              />
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMenuOpen}
              data-mobile-menu
            >
              <MenuIcon 
                className={`h-6 w-6 transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-90' : 'rotate-0'
                }`} 
              />
            </button>

            {/* Desktop navigation */}
            <nav 
              className="hidden md:flex flex-wrap items-center gap-1 lg:gap-2 xl:gap-3 text-white text-xs sm:text-sm lg:text-base flex-shrink-0"
              role="navigation"
              aria-label="Основная навигация"
            >
              <div className="flex flex-wrap items-center gap-1 lg:gap-2">
                {navigationKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleScrollToSection(key)}
                    className="group relative px-2 py-1 lg:px-3 lg:py-1.5 rounded-full border border-white/30 hover:bg-white hover:text-[#1D1D2F] transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white/50 text-xs lg:text-sm"
                  >
                    <span className="relative z-10">{translations.navigation[key]}</span>
                    <div className="absolute inset-0 bg-white rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 lg:gap-2 ml-1 lg:ml-2">
                {/* Language switcher */}
                <LanguageSwitcher
                  toggleLanguage={toggleLanguage}
                  currentLanguage={language}
                />

                {/* Authentication */}
                {user ? (
                  <UserDropdown user={user} onLogout={handleLogout} />
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="group bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 relative overflow-hidden text-xs lg:text-sm whitespace-nowrap"
                  >
                    <span className="relative z-10">
                      {language === "ru" ? "Войти" : "Кіру"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0029A3] to-[#4A5DFF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
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

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onScrollToSection={handleScrollToSection}
      />

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}