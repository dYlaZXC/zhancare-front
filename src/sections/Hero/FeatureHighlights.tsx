"use client";

import { motion } from "framer-motion";

interface FeatureHighlightsProps {
  language: string;
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 0.6
    }
  }
};

const features = [
  {
    ru: "ИИ-диагностика",
    kz: "AI диагностикасы",
    en: "AI Diagnostics"
  },
  {
    ru: "24/7 Доступность",
    kz: "24/7 Қолжетімділік",
    en: "24/7 Availability"
  },
  {
    ru: "Удаленные консультации",
    kz: "Қашықтан консультациялар",
    en: "Remote Consultations"
  },
  {
    ru: "Безопасные данные",
    kz: "Қауіпсіз деректер",
    en: "Secure Data"
  }
];

// Helper function to get the correct translation
const getFeatureText = (feature: typeof features[0], language: string): string => {
  switch (language) {
    case "ru": return feature.ru;
    case "en": return feature.en;
    case "kz": return feature.kz;
    default: return feature.ru;
  }
};

export default function FeatureHighlights({ language }: FeatureHighlightsProps) {
  return (
    <motion.div variants={itemVariants}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-w-2xl mx-auto lg:mx-0">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="w-2 h-2 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full"></div>
            <span className="text-gray-300 text-sm sm:text-base">
              {getFeatureText(feature, language)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}