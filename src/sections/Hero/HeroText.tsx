"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import TypingHeading from "./TypingHeading";
import FeatureHighlights from "./FeatureHighlights";
import ActionButtons from "./ActionButtons";
import Statistics from "./Statistics";

interface HeroTextProps {
  translations: any;
  language: string;
  isInView: boolean;
  onBookAppointment: () => void;
  onLearnMore: () => void;
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

export default function HeroText({ 
  translations, 
  language, 
  isInView, 
  onBookAppointment, 
  onLearnMore 
}: HeroTextProps) {
  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8 text-center lg:text-left px-2 sm:px-0">
      <TypingHeading 
        text={translations.content.heroHeading}
        isInView={isInView}
        language={language}
      />

      {/* Description */}
      <motion.div variants={itemVariants}>
        <p className="text-base xs:text-lg sm:text-xl lg:text-2xl text-gray-300 font-light leading-relaxed max-w-xs xs:max-w-sm sm:max-w-2xl mx-auto lg:mx-0">
          {translations.content.heroDescription}
        </p>
      </motion.div>

      <FeatureHighlights language={language} />

      <ActionButtons 
        translations={translations}
        language={language}
        onBookAppointment={onBookAppointment}
        onLearnMore={onLearnMore}
      />

      <Statistics language={language} isInView={isInView} />
    </div>
  );
}