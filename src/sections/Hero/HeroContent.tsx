"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import Chat from "./Chat"; // Ensure Chat.tsx is in correct path

export default function HeroContent() {
  const { setIsAuthOpen } = useAuth();
  const { language } = useLanguage();
  const translations = language === "ru" ? ru.hero : kz.hero;

  return (
    <motion.div className="flex flex-col items-center text-center px-4 md:px-16 pt-20 pb-0">
      <div className="max-w-3xl">
        <motion.h1 className="text-3xl md:text-5xl font-light tracking-tighter leading-tight mt-10 md:mt-20 text-white">
          {translations.content.heroHeading}
        </motion.h1>
        <motion.p className="text-lg md:text-xl mt-4 md:mt-6 font-extralight leading-relaxed text-white">
          {translations.content.heroDescription}
        </motion.p>
        {/* <motion.div className="mt-6 md:mt-8">
          <button
            className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-6 py-3 rounded-lg"
            onClick={() => setIsAuthOpen(true)}
          >
            {translations.content.openDataButton}
          </button>
        </motion.div> */}
      </div>

      {/* Chat centered below */}
      <motion.div
        className="mt-10 w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Chat />
      </motion.div>
    </motion.div>
  );
}
