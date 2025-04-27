"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import product1 from "@/assets/hero1212.png";
import product2 from "@/assets/hero1213.png";
import product3 from "@/assets/hero1214.png";
import product4 from "@/assets/hero1215.png";

import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

const images = {
  hero1212: product1.src,
  hero1213: product2.src,
  hero1214: product3.src,
  hero1215: product4.src,
} as const;

type ImageKey = keyof typeof images;

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
  const rawTranslations = language === "ru" ? ru.productShowcase : kz.productShowcase;
  const contentData: ContentData[] = mapTranslations(rawTranslations.contentData);

  const [activeContent, setActiveContent] = useState<ContentData>(contentData[0]);
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

  return (
    <section
      id="modules"
      ref={sectionRef}
      className="bg-gradient-to-b from-white to-[#D2DCFF] py-28 overflow-x-clip relative"
    >
      {/* Floating blurred background blobs */}
      <motion.div
        className="absolute top-20 left-10 w-80 h-80 bg-blue-300 opacity-20 rounded-full blur-3xl hidden lg:block"
        style={{ translateY }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-pink-300 opacity-20 rounded-full hidden lg:block"
        style={{ translateY }}
      />

      <div className="relative z-10 container mx-auto max-w-7xl px-6 lg:px-10">
        {/* Heading */}
        <div className="text-center mb-12">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-[#001E80]"
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
              className={`px-6 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                activeContent.id === content.id
                  ? "bg-blue-700 text-white border-blue-700"
                  : "border-gray-300 text-gray-700 hover:border-blue-500 hover:text-[#001E80]"
              }`}
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
                src={images[activeContent.imageSrc]}
                alt={activeContent.title}
                width={900}
                height={600}
                className="rounded-3xl shadow-2xl mx-auto"
              />
              <div className="text-center mt-6">
                <h3 className="text-2xl font-bold text-[#001E80]">{activeContent.title}</h3>
                <p className="text-gray-600 mt-2">{activeContent.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
