"use client";

import heroVideo from "@/assets/hero-video.mp4";
import Logo from "@/assets/logosaas.png";
import MenuIcon from "@/assets/menu.svg";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUserMd, faSignOutAlt, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

const ToastContainer = dynamic(() => import("react-toastify").then((mod) => mod.ToastContainer), { ssr: false });

const LanguageSwitcher = ({ toggleLanguage, currentLanguage }: { toggleLanguage: () => void; currentLanguage: string }) => (
  <button className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition" onClick={toggleLanguage}>
    {currentLanguage === "ru" ? "Қазақша" : "Русский"}
  </button>
);

const UserDropdown = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-lg px-5 py-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faUserMd} className="text-xl" />
        {user.first_name}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg overflow-hidden">
          <a href={user.role === "doctor" ? "/doctor-profile" : "/profile"} className="block px-4 py-3 hover:bg-gray-200 flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} />
            Личный кабинет
          </a>
          <button onClick={onLogout} className="w-full text-left px-4 py-3 hover:bg-gray-200 flex items-center gap-2">
            <FontAwesomeIcon icon={faSignOutAlt} />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};

const statsItemAnimation = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const Hero = () => {
  const { isAuthOpen, setIsAuthOpen, user, logoutUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const translations = language === "ru" ? ru.hero : kz.hero;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    toast.success("Вы успешно вышли!", { position: "top-right", autoClose: 3000 });
  };

  const navigationKeys = Object.keys(translations.navigation) as Array<keyof typeof translations.navigation>;

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative pb-20 md:pb-10 overflow-hidden" id="hero">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-screen h-[110vh] object-cover -z-10">
        <source src={heroVideo} type="video/mp4" />
      </video>
      <motion.div
        className="absolute inset-0 bg-black/60 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <header className={`fixed top-0 w-full z-50 transition-all ${isScrolled ? "bg-[#1D1D2F]/80 backdrop-blur-md" : "bg-transparent"}`}>
        <div className="py-4">
          <div className="container mx-auto flex items-center justify-between px-4">
            <Image src={Logo} alt="Logo" height={300} width={300} />
            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <MenuIcon className="h-6 w-6" />
            </button>
            <nav className="hidden md:flex gap-6 text-white items-center">
              {navigationKeys.map((key) => (
                <button key={key} onClick={() => handleScrollToSection(key)} className="hover:text-gray-300">
                  {translations.navigation[key]}
                </button>
              ))}
              <LanguageSwitcher toggleLanguage={() => setLanguage(language === "ru" ? "kz" : "ru")} currentLanguage={language} />
              {user ? <UserDropdown user={user} onLogout={handleLogout} /> : (
                <button onClick={() => setIsAuthOpen(true)} className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-lg px-5 py-2">
                  {language === "ru" ? "Войти" : "Кіру"}
                </button>
              )}
              <ToastContainer />
            </nav>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
          <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>
          <nav className="flex flex-col gap-8 text-center">
            {navigationKeys.map((key) => (
              <button key={key} onClick={() => handleScrollToSection(key)} className="hover:text-gray-300">
                {translations.navigation[key]}
              </button>
            ))}
            <LanguageSwitcher toggleLanguage={() => setLanguage(language === "ru" ? "kz" : "ru")} currentLanguage={language} />
            {user ? (
              <button onClick={() => window.location.href = user.role === "doctor" ? "/doctor-profile" : "/profile"} className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-lg px-6 py-3">
                <FontAwesomeIcon icon={faUserMd} className="text-xl" /> {user.first_name}
              </button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-lg px-6 py-3">
                {language === "ru" ? "Войти" : "Кіру"}
              </button>
            )}
          </nav>
        </div>
      )}

      <div className="relative z-10 container mx-auto text-white px-4">
        <motion.div className="md:flex items-center">
          <div className="md:w-1/2 pt-20 pb-20">
            <motion.h1 className="text-3xl md:text-5xl font-light tracking-tighter leading-tight mt-10 md:mt-20">
              {translations.content.heroHeading}
            </motion.h1>
            <motion.p className="text-lg md:text-xl mt-4 md:mt-6 font-extralight leading-relaxed">
              {translations.content.heroDescription}
            </motion.p>
            <motion.div className="flex gap-4 items-center mt-6 md:mt-8">
              <button className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-6 py-3 rounded-lg" onClick={() => handleScrollToSection("modules")}>
                {translations.content.openDataButton}
              </button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {translations.statistics.map((stat, index) => (
            <motion.div
              key={index}
              variants={statsItemAnimation}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="text-4xl font-bold">{stat.value}</p>
              <p className="text-lg text-gray-200">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};
