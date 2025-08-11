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
      {/* All screens: Single column, 4 rows */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto lg:mx-0">
        {features.map((feature, index) => (
          <motion.div 
            key={index} 
            className="flex items-center space-x-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
            whileHover={{ 
              scale: 1.02,
              x: 5,
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
          >
            <motion.div 
              className="w-2.5 h-2.5 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full flex-shrink-0"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.4
              }}
            />
            <span className="text-gray-300 text-sm sm:text-base font-normal leading-tight group-hover:text-white transition-colors duration-300">
              {getFeatureText(feature, language)}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}