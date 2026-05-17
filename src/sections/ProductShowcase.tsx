"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ai_diagnostics_ru from "@/assets/ai_diagnostics_ru.png";
import ai_diagnostics_kz from "@/assets/ai_diagnostics_kz.png";
import ai_diagnostics_en from "@/assets/ai_diagnostics_en.png";
import product2 from "@/assets/hero1213.png";
import product3 from "@/assets/hero1214.png";
import product4 from "@/assets/hero1215.png";

import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

// Language-specific image mappings
const languageImages = {
  ru: {
    hero1212: ai_diagnostics_ru.src,
    hero1213: product2.src,
    hero1214: product3.src,
    hero1215: product4.src,
  },
  kz: {
    hero1212: ai_diagnostics_kz.src,
    hero1213: product2.src,
    hero1214: product3.src,
    hero1215: product4.src,
  },
  en: {
    hero1212: ai_diagnostics_en.src,
    hero1213: product2.src,
    hero1214: product3.src,
    hero1215: product4.src,
  },
} as const;

type ImageKey = keyof typeof languageImages.en;
type LanguageType = keyof typeof languageImages;

interface ContentData {
  id: number;
  title: string;
  description: string;
  imageSrc: ImageKey;
}

const mapTranslations = (contentData: any[]): ContentData[] => {
  return contentData.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageSrc: item.imageSrc as ImageKey,
  }));
};

export const ProductShowcase = () => {
  const { language } = useLanguage();
  const { brand } = useBrand();
  
  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.productShowcase;
      case "kz":
        return kz.productShowcase;
      case "en":
        return en.productShowcase;
      default:
        return en.productShowcase;
    }
  };

  // Get language-specific images
  const getCurrentImages = () => {
    const currentLang = language as LanguageType;
    return languageImages[currentLang] || languageImages.en;
  };

  const rawTranslations = getTranslations();
  const contentData: ContentData[] = React.useMemo(() => 
    mapTranslations(rawTranslations.contentData), 
    [rawTranslations.contentData]
  );

  const [activeContent, setActiveContent] = useState<ContentData>(() => contentData[0]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const handleContentChange = (contentId: number) => {
    const selected = contentData.find((c) => c.id === contentId);
    if (selected) {
      setActiveContent(selected);
    }
  };

  // Update active content when language changes
  React.useEffect(() => {
    if (contentData.length > 0) {
      const currentId = activeContent.id;
      const newActiveContent = contentData.find(c => c.id === currentId) || contentData[0];
      setActiveContent(newActiveContent);
    }
  }, [language, activeContent.id, contentData]);

  return (
    <section
      id="modules"
      ref={sectionRef}
      className="bg-gradient-to-b from-white to-[#D2DCFF] py-28 overflow-x-clip relative"
    >
      <div className="absolute top-0 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: brand.primary, opacity: 0.2 }}></div>
      <div className="absolute top-[60%] right-10 w-96 h-96 bg-pink-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative z-10 container mx-auto max-w-7xl px-6 lg:px-10">
        {/* Heading */}
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl laptop-hd:text-4xl desktop-fhd:text-5xl desktop-qhd:text-6xl desktop-4k:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 lg:mb-8"
            style={{ color: brand.secondary }}
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {rawTranslations.title}
          </motion.h2>
          <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
            {rawTranslations.description}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {contentData.map((content) => (
            <button
              key={content.id}
              onClick={() => handleContentChange(content.id)}
              className="px-6 py-2 rounded-full border-2 text-sm font-semibold transition-all"
              style={
                activeContent.id === content.id
                  ? { backgroundColor: brand.secondary, color: "white", borderColor: brand.secondary }
                  : { backgroundColor: "transparent", color: "#374151", borderColor: "#d1d5db" }
              }
              onMouseEnter={(e) => {
                if (activeContent.id !== content.id) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = brand.primary;
                  (e.currentTarget as HTMLButtonElement).style.color = brand.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (activeContent.id !== content.id) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
                  (e.currentTarget as HTMLButtonElement).style.color = "#374151";
                }
              }}
            >
              {content.title}
            </button>
          ))}
        </div>

        {/* Image Showcase */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeContent.imageSrc}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-4xl"
            >
              <Image
                src={getCurrentImages()[activeContent.imageSrc]}
                alt={activeContent.title}
                width={900}
                height={600}
                className="rounded-3xl shadow-2xl mx-auto"
              />
              <div className="text-center mt-6">
                <h3 className="text-2xl font-bold" style={{ color: brand.secondary }}>{activeContent.title}</h3>
                <p className="text-gray-600 mt-2">{activeContent.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};