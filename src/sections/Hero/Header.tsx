"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import MenuIcon from "@/assets/menu.svg";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import LanguageSwitcher from "./LanguageSwitcher";
import UserDropdown from "./UserDropdown";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const { setIsAuthOpen, user, logoutUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const translations = language === "ru" ? ru.hero : kz.hero;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleScrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const handleLogout = () => logoutUser();

  const navigationKeys = Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>;

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all ${isScrolled ? "bg-[#1D1D2F]/80 backdrop-blur-md" : "bg-transparent"}`}>
        <div className="py-4">
          <div className="container mx-auto flex items-center justify-between px-4">
            <Image src={Logo} alt="Logo" height={300} width={300} />
            <button className="md:hidden text-white" onClick={toggleMenu}>
              <MenuIcon className="h-6 w-6" />
            </button>
            <nav className="hidden md:flex gap-6 text-white items-center">
              {navigationKeys.map((key) => (
                <button key={key} onClick={() => handleScrollToSection(key)} className="hover:text-gray-300">
                  {translations.navigation[key]}
                </button>
              ))}
              <LanguageSwitcher toggleLanguage={() => setLanguage(language === "ru" ? "kz" : "ru")} currentLanguage={language} />
              {user ? (
                <UserDropdown user={user} onLogout={handleLogout} />
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-lg px-5 py-2"
                >
                  {language === "ru" ? "Войти" : "Кіру"}
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onScrollToSection={handleScrollToSection}
      />
    </>
  );
}
