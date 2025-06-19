"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

const statsItemAnimation = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function HeroStats() {
  const { language } = useLanguage();
  const translations = language === "ru" ? ru.hero : kz.hero;

  return (
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
  );
}
