"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

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

const GlowEffect = ({ isActive, color = "#4A5DFF" }: { isActive: boolean; color?: string }) => {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-visible transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Big blur glow */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="12"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray="3 7"
          pathLength="10"
          className="animate-glow-big"
          style={{
            filter: 'blur(20px)',
            opacity: 0.6
          }}
        />
        
        {/* Medium blur glow */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="12"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray="3 7"
          pathLength="10"
          className="animate-glow-medium"
          style={{
            filter: 'blur(10px)',
            opacity: 0.8
          }}
        />
        
        {/* Small blur glow */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="12"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="3 7"
          pathLength="10"
          className="animate-glow-small"
          style={{
            filter: 'blur(4px)'
          }}
        />
        
        {/* Core solid line */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="12"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="3 7"
          pathLength="10"
          className="animate-glow-core"
          style={{
            filter: 'brightness(1.5)'
          }}
        />
      </svg>
      
      <style jsx>{`
        @keyframes glowMove {
          0% {
            stroke-dashoffset: 10;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }
        
        .animate-glow-big {
          animation: glowMove 3s ease-in-out infinite;
        }
        
        .animate-glow-medium {
          animation: glowMove 3s ease-in-out infinite 0.1s;
        }
        
        .animate-glow-small {
          animation: glowMove 3s ease-in-out infinite 0.2s;
        }
        
        .animate-glow-core {
          animation: glowMove 3s ease-in-out infinite 0.3s;
        }
      `}</style>
    </div>
  );
};

export default function ActionButtons({
  translations,
  language,
  onBookAppointment,
  onLearnMore
}: ActionButtonsProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const secondaryButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <motion.div variants={itemVariants}>
      <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center lg:justify-start max-w-xs xs:max-w-md sm:max-w-lg mx-auto lg:mx-0">
        {/* Primary Button with Professional Glow */}
        <motion.button
          ref={primaryButtonRef}
          className="group relative bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-4 xs:px-6 sm:px-8 py-3 xs:py-3.5 sm:py-4 rounded-xl font-medium text-sm xs:text-base sm:text-lg overflow-visible shadow-lg hover:shadow-xl transition-shadow w-full xs:w-auto"
          onClick={onBookAppointment}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {/* Professional SVG Glow Effect */}
          <GlowEffect isActive={true} color="#4A5DFF" />
          
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

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0029A3] to-[#4A5DFF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-xl" />
        </motion.button>

        {/* Secondary Button with Subtle Glow */}
        <motion.button
          ref={secondaryButtonRef}
          className="group relative px-4 xs:px-6 sm:px-8 py-3 xs:py-3.5 sm:py-4 rounded-xl border border-white/20 text-white font-medium text-sm xs:text-base sm:text-lg hover:bg-white/5 transition-all duration-300 w-full xs:w-auto overflow-visible"
          onClick={onLearnMore}
          variants={buttonVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Subtle Glow Effect on Hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <GlowEffect isActive={true} color="rgba(255, 255, 255, 0.8)" />
          </div>

          <span className="relative z-10 truncate">
            {language === "ru" ? "Узнать больше" : "Көбірек білу"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}