"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRef, useMemo } from "react";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import HeroText from "./HeroText";
import HeroVisualization from "./HeroVisualization";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

export default function HeroContent() {
  const { setIsAuthOpen } = useAuth();
  const { language } = useLanguage();
  
  // Fixed translations logic to handle all 3 languages
  const translations = useMemo(() => {
    switch (language) {
      case "ru": return ru.hero;
      case "en": return en.hero;
      case "kz": return kz.hero;
      default: return ru.hero;
    }
  }, [language]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  // Scroll-based animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 1, 1, 0.8]);

  const handleBookAppointment = () => {
    setIsAuthOpen(true);
  };

  const handleLearnMore = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-3 xs:px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
      style={{ y, opacity }}
    >
      <div className="max-w-7xl mx-auto w-full">
        <motion.div 
          className="grid lg:grid-cols-2 gap-8 xs:gap-10 sm:gap-12 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <HeroText 
            translations={translations}
            language={language}
            isInView={isInView}
            onBookAppointment={handleBookAppointment}
            onLearnMore={handleLearnMore}
          />
          
          <div className="order-first lg:order-last">
            <HeroVisualization isInView={isInView} language={language} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}