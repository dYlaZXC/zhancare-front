"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface TypingHeadingProps {
  text: string;
  isInView: boolean;
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

export default function TypingHeading({ text, isInView, language }: TypingHeadingProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Typing animation effect
  useEffect(() => {
    if (!isInView) return;
    
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }
    }, 50); // Adjust speed here
    
    return () => clearTimeout(timer);
  }, [currentIndex, text, isInView]);

  // Reset typing animation when language changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [language]);

  return (
    <motion.div variants={itemVariants}>
      <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-light tracking-tight leading-tight xs:leading-[1.1] text-white">
        <span className="block">
          {displayedText}
          <motion.span
            className="inline-block w-0.5 h-8 xs:h-10 sm:h-12 md:h-16 lg:h-16 xl:h-20 2xl:h-20 bg-gradient-to-b from-[#3A50FF] to-[#001E80] ml-1"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </span>
      </h1>
    </motion.div>
  );
}