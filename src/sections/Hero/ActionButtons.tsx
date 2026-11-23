"use client";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useBrand } from "@/context/BrandContext";

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
  }
};

export default function ActionButtons({
  translations,
  language,
  onBookAppointment,
  onLearnMore
}: ActionButtonsProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const secondaryButtonRef = useRef<HTMLButtonElement>(null);
  const { brand } = useBrand();

  const getSecondaryButtonText = () => {
    switch (language) {
      case "ru":
        return "Узнать больше";
      case "kz":
        return "Көбірек білу";
      case "en":
        return "Learn More";
      case "uz":
        return "Ko'proq bilish";
      default:
        return "Learn More";
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center lg:justify-start max-w-xs xs:max-w-md sm:max-w-lg mx-auto lg:mx-0">
        {/* Primary Button with Stable Glow */}
        <motion.button
          ref={primaryButtonRef}
          className="group relative text-white px-4 xs:px-6 sm:px-8 py-3 xs:py-3.5 sm:py-4 rounded-xl font-medium text-sm xs:text-base sm:text-lg shadow-lg hover:shadow-xl transition-shadow w-full xs:w-auto"
          style={{ background: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.primary} 100%)` }}
          onClick={onBookAppointment}
          variants={buttonVariants}
        >
          {/* Stable Glow Effect */}
          <div className="absolute inset-0 rounded-xl blur-md opacity-50 -z-10" style={{ background: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.primary} 100%)` }}></div>

          <span className="relative z-10 flex items-center justify-center">
            <span className="truncate">
              {translations.content.openDataButton}
            </span>
            <svg
              className="ml-2 w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>

          {/* Hover overlay */}
          <div className="absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-xl" style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }} />
        </motion.button>

        {/* Secondary Button with Stable Glow */}
        <motion.button
          ref={secondaryButtonRef}
          className="group relative px-4 xs:px-6 sm:px-8 py-3 xs:py-3.5 sm:py-4 rounded-xl border border-white/20 text-white font-medium text-sm xs:text-base sm:text-lg hover:bg-white/5 transition-all duration-300 w-full xs:w-auto"
          onClick={onLearnMore}
          variants={buttonVariants}
        >
          {/* Stable Subtle Glow Effect */}
          <div className="absolute inset-0 rounded-xl border border-white/30 blur-sm opacity-40 -z-10"></div>
          <div className="absolute inset-0 rounded-xl bg-white/5 blur-md opacity-20 -z-20"></div>

          <span className="relative z-10 truncate">
            {getSecondaryButtonText()}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}