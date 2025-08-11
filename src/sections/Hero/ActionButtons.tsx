"use client";

import { motion } from "framer-motion";

interface ActionButtonsProps {
  translations: any;
  language: string;
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

const buttonVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20 
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
      delay: 0.8
    }
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

export default function ActionButtons({ 
  translations, 
  language, 
  onBookAppointment, 
  onLearnMore 
}: ActionButtonsProps) {
  return (
    <motion.div variants={itemVariants}>
      <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center lg:justify-start max-w-xs xs:max-w-md sm:max-w-lg mx-auto lg:mx-0">
        <motion.button
          className="group relative bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-4 xs:px-6 sm:px-8 py-3 xs:py-3.5 sm:py-4 rounded-xl font-medium text-sm xs:text-base sm:text-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-full xs:w-auto"
          onClick={onBookAppointment}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <span className="relative z-10 flex items-center justify-center">
            <span className="truncate">
              {translations.content.openDataButton}
            </span>
            <motion.svg
              className="ml-2 w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0029A3] to-[#4A5DFF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </motion.button>
        
        <motion.button
          className="group px-4 xs:px-6 sm:px-8 py-3 xs:py-3.5 sm:py-4 rounded-xl border border-white/20 text-white font-medium text-sm xs:text-base sm:text-lg hover:bg-white/5 transition-all duration-300 w-full xs:w-auto"
          onClick={onLearnMore}
          variants={buttonVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="truncate">
            {language === "ru" ? "Узнать больше" : "Көбірек білу"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}