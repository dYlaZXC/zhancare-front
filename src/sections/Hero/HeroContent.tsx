"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

export default function HeroContent() {
  const { setIsAuthOpen } = useAuth();
  const { language } = useLanguage();
  const translations = language === "ru" ? ru.hero : kz.hero;

  return (
    <motion.div className="md:flex items-center">
      <div className="md:w-1/2 pt-20 pb-20">
        <motion.h1 className="text-3xl md:text-5xl font-light tracking-tighter leading-tight mt-10 md:mt-20">
          {translations.content.heroHeading}
        </motion.h1>
        <motion.p className="text-lg md:text-xl mt-4 md:mt-6 font-extralight leading-relaxed">
          {translations.content.heroDescription}
        </motion.p>
        <motion.div className="flex gap-4 items-center mt-6 md:mt-8">
          <button
            className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-6 py-3 rounded-lg"
            onClick={() => setIsAuthOpen(true)}
          >
            {translations.content.openDataButton}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
