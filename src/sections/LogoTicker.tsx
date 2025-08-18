"use client";

import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";

import Logo0 from "@/assets/itry.png";
import Logo3 from "@/assets/ahlogo.png";
import Logo2 from "@/assets/aqniet.png";
import Logo1 from "@/assets/kazakhemblem.png";
import Logo4 from "@/assets/astanamua.png";
import Logo5 from "@/assets/kazakhemblem.png";
import Logo6 from "@/assets/enactus.png";
import Logo7 from "@/assets/omron.png";

export const LogoTicker = () => {
  const { language } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);
  const controls = useAnimation();

  // Get translations for organization text based on language
  const getOrganizationTexts = () => {
    switch (language) {
      case "ru":
        return {
          digitalMinistry: ["МЦРиАП", "Республики Казахстан"],
          healthMinistry: ["Министерство", "Здравоохранения РК"]
        };
      case "kz":
        return {
          digitalMinistry: ["ҚР СААЖ", "Министрлігі"],
          healthMinistry: ["ҚР Денсаулық", "сақтау министрлігі"]
        };
      case "en":
        return {
          digitalMinistry: ["Ministry of Digital", "Development of Kazakhstan"],
          healthMinistry: ["Ministry of Health", "of Kazakhstan"]
        };
      default:
        return {
          digitalMinistry: ["Ministry of Digital", "Development of Kazakhstan"],
          healthMinistry: ["Ministry of Health", "of Kazakhstan"]
        };
    }
  };

  const organizationTexts = getOrganizationTexts();

  const logos = useMemo(() => [
    { src: Logo0, alt: "Logo0" },
    { src: Logo3, alt: "Logo3" },
    // {
    //   src: Logo2,
    //   alt: "Aqniet Käsipodağy",
    //   text: ["AQNIET", "KÄSIPODAĞY"],
    // },
    { src: Logo7, alt: "Logo7" },
    {
      src: Logo1,
      alt: "Ministry of Digital Kazakhstan",
      text: organizationTexts.digitalMinistry
    },
    { src: Logo4, alt: "Logo4" },
    { src: Logo6, alt: "Logo6" },
    {
      src: Logo5,
      alt: "Ministry of Health Kazakhstan",
      text: organizationTexts.healthMinistry
    },
  ], [organizationTexts]);

  const startAnimation = useCallback(() => {
    controls.start({
      x: ["0%", "-100%"],
      transition: {
        duration: 120,
        repeat: Infinity,
        ease: "linear",
      },
    });
  }, [controls]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  useEffect(() => {
    if (isPaused) {
      controls.stop();
    } else {
      startAnimation();
    }
  }, [isPaused, controls, startAnimation]);

  return (
    <div className="py-16 bg-gradient-to-b from-[#1D1D2F] to-[#1D1D2F] relative overflow-hidden">
      <div
        className="flex overflow-hidden relative cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          maskImage: "linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%)",
          willChange: "transform",
        }}
      >
        <motion.div className="flex gap-12 md:gap-24 items-center" animate={controls}>
          {Array(3).fill(logos).flat().map((logo, index) => (
            <div
              key={`logo_${index}`}
              className="flex flex-col items-center justify-center w-44 h-20 md:w-60 md:h-24 bg-[#292940] rounded-2xl transition-all duration-300 p-2"
            >
              {logo.text ? (
                <div className="flex items-center gap-2 text-white">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    className="h-12 md:h-16 w-auto object-contain"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col text-xs md:text-sm leading-tight">
                    {logo.text.map((line: string, idx: number) => (
                      <span key={idx}>{line}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  className="h-12 md:h-16 w-auto object-contain"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};