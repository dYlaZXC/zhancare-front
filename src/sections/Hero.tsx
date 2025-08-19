"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import heroVideo from "@/assets/hero-video.mp4";
import Header from "@/sections/Hero/Header";
import HeroContent from "@/sections/Hero/HeroContent";
// import HeroChat from "@/sections/Hero/HeroChat";
import HeroStats from "@/sections/Hero/HeroStats";

const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

export default function Hero() {
  const [screenType, setScreenType] = useState<string>('default');

  useEffect(() => {
    const detectScreenType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // More reliable screen detection without complex media queries
      if (width >= 3840 && height >= 2000) {
        setScreenType('4k');
      } else if (width >= 2560 && height >= 1400) {
        setScreenType('qhd');
      } else if (width >= 1920 && height >= 1000) {
        setScreenType('fhd');
      } else if (width >= 1366 && width <= 1440 && height >= 700 && height <= 800) {
        setScreenType('laptop-hd');
      } else {
        setScreenType('default');
      }
    };

    detectScreenType();
    window.addEventListener('resize', detectScreenType);
    
    return () => window.removeEventListener('resize', detectScreenType);
  }, []);

  // Dynamic classes based on screen type
  const getResponsiveClasses = () => {
    const baseClasses = "relative overflow-hidden min-h-screen pb-20 md:pb-10";
    
    switch (screenType) {
      case 'laptop-hd':
        return `${baseClasses} min-h-[768px] h-[768px] pb-8`;
      case 'fhd':
        return `${baseClasses} min-h-[1080px] h-[1080px] pb-12`;
      case 'qhd':
        return `${baseClasses} min-h-[1440px] h-[1440px] pb-16`;
      case '4k':
        return `${baseClasses} min-h-[2160px] h-[2160px] pb-24`;
      default:
        return baseClasses;
    }
  };

  const getVideoClasses = () => {
    const baseClasses = "absolute inset-0 w-full h-full min-h-screen object-cover -z-10 scale-105";
    
    switch (screenType) {
      case 'laptop-hd':
        return `${baseClasses} min-h-[768px]`;
      case 'fhd':
        return `${baseClasses} min-h-[1080px]`;
      case 'qhd':
        return `${baseClasses} min-h-[1440px]`;
      case '4k':
        return `${baseClasses} min-h-[2160px]`;
      default:
        return baseClasses;
    }
  };

  const getOverlayClasses = () => {
    const baseClasses = "absolute inset-0 -z-9";
    
    switch (screenType) {
      case 'laptop-hd':
        return `${baseClasses} bg-black/65`;
      case 'fhd':
        return `${baseClasses} bg-black/50`;
      case 'qhd':
        return `${baseClasses} bg-black/45`;
      case '4k':
        return `${baseClasses} bg-black/40`;
      default:
        return `${baseClasses} bg-black/60`;
    }
  };

  const getContentClasses = () => {
    const baseClasses = "relative z-10 container mx-auto text-white px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16";
    
    switch (screenType) {
      case 'laptop-hd':
        return `${baseClasses} px-6 max-w-none`;
      case 'fhd':
        return `${baseClasses} px-8 max-w-none`;
      case 'qhd':
        return `${baseClasses} px-12 max-w-none`;
      case '4k':
        return `${baseClasses} px-16 max-w-none`;
      default:
        return baseClasses;
    }
  };

  const getPaddingClasses = () => {
    const baseClasses = "pt-8 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-24";
    
    switch (screenType) {
      case 'laptop-hd':
        return "pt-12";
      case 'fhd':
        return "pt-16";
      case 'qhd':
        return "pt-20";
      case '4k':
        return "pt-32";
      default:
        return baseClasses;
    }
  };

  const getScaleClasses = () => {
    switch (screenType) {
      case 'laptop-hd':
        return "transform scale-90 origin-top-left";
      case 'fhd':
        return "transform scale-100 origin-top";
      case 'qhd':
        return "transform scale-110 origin-top";
      case '4k':
        return "transform scale-125 origin-top";
      default:
        return "";
    }
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={getResponsiveClasses()}
      id="hero"
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className={getVideoClasses()}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Fallback Background for any gaps */}
      <div className="absolute inset-0 bg-gray-900 -z-20" />

      {/* Black Overlay */}
      <motion.div
        className={getOverlayClasses()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Header with Navbar */}
      <Header />

      {/* Hero Main Content */}
      <div className={getContentClasses()}>
        <div className={getPaddingClasses()}>
          <div className={getScaleClasses()}>
            <HeroContent />
            {/* <HeroChat /> */}
            {/* <HeroStats /> */}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <ToastContainer />
    </motion.section>
  );
}