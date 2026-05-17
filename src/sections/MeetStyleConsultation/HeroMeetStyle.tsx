"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faCalendarPlus,
  faUserMd,
  faShieldAlt,
  faClock,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import heroVideo from "@/assets/hero-video.mp4";
import Header from "@/sections/Hero/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import uz from "@/locales/uz.json";
import kz from "@/locales/kz.json";

export default function HeroMeetStyle() {
  const router = useRouter();
  const { language } = useLanguage();
  const { brand } = useBrand();
  const [isStarting, setIsStarting] = useState(false);

  const t = useMemo(() => {
    switch (language) {
      case "en": return en.heroMeetStyle;
      case "kz": return kz.heroMeetStyle;
      case "uz": return uz.heroMeetStyle;
      default: return ru.heroMeetStyle;
    }
  }, [language]);

  const handleStartConsultation = () => {
    setIsStarting(true);
    // Redirect to AI symptom checker flow
    router.push("/consultation/symptoms");
  };

  const handleScheduleMeeting = () => {
    // Redirect to scheduling page
    router.push("/consultation/schedule");
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative min-h-screen overflow-hidden"
      id="hero"
    >
      {/* Background Video with Enhanced Blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-screen h-full object-cover blur-md"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      </div>

      {/* Enhanced Dark Overlay - Increased opacity */}
      <motion.div
        className="absolute inset-0 bg-black/60 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Radial Gradient Overlay - Centered dark spotlight */}
      <div
        className="absolute inset-0 -z-8"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Header with Navbar */}
      <Header />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faUserMd} className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ZhanCare AI
              </span>
            </div> */}
          </motion.div>

          {/* Main Heading - Enhanced with better gradients */}
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white drop-shadow-2xl"
          >
            {t.heading}
            <br />
            <span className="bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(55,114,255,0.5)]" style={{ backgroundImage: `linear-gradient(to right, #c1d3ff, ${brand.primary}, ${brand.secondary})` }}>
              {t.headingHighlight}
            </span>
          </motion.h1>

          {/* Subtitle - Enhanced */}
          <motion.p
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
            className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-medium drop-shadow-lg"
          >
            {t.subtitle}
          </motion.p>

          {/* Main Action Buttons - Premium Upgrade */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            {/* Start Consultation Button - Premium Irresistible Version */}
            <motion.button
              onClick={handleStartConsultation}
              disabled={isStarting}
              className="group relative w-full sm:w-auto text-white px-12 py-6 rounded-3xl font-bold text-lg shadow-[0_10px_40px_rgba(55,114,255,0.5)] hover:shadow-[0_15px_50px_rgba(55,114,255,0.7)] focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              style={{ background: `linear-gradient(to right, ${brand.secondary}, ${brand.primary})` }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Enhanced Multi-layer Outer Glow */}
              <div className="absolute inset-0 rounded-3xl blur-xl opacity-70 -z-10" style={{ background: `linear-gradient(to right, ${brand.secondary}, ${brand.primary})` }}></div>
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-50 -z-20 group-hover:opacity-70 transition-opacity duration-300" style={{ background: `linear-gradient(to right, ${brand.primary}, #7A8FFF)` }}></div>
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30 -z-30 group-hover:opacity-50 transition-opacity duration-300" style={{ backgroundColor: brand.primary }}></div>

              {/* Animated Shine Effect */}
              <div className="absolute inset-0 -top-full group-hover:top-full transition-all duration-1000 ease-out bg-gradient-to-b from-transparent via-white/25 to-transparent" />

              <span className="relative z-10 flex items-center justify-center gap-3">
                <FontAwesomeIcon
                  icon={faVideo}
                  className={`text-xl ${isStarting ? 'animate-pulse' : ''}`}
                />
                <span>{isStarting ? t.startingButton : t.startButton}</span>
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ x: 0 }}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>

              {/* Hover Gradient Overlay - More Pronounced */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" style={{ background: `linear-gradient(to right, ${brand.secondary}, ${brand.primary}, #5A6FFF)` }} />
            </motion.button>

            {/* Schedule Meeting Button - Premium Version */}
            <motion.button
              onClick={handleScheduleMeeting}
              className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 hover:border-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Subtle Premium Glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-white/40 blur-md opacity-30 group-hover:opacity-50 -z-10 transition-opacity duration-300"></div>
              <div className="absolute inset-0 rounded-2xl bg-white/5 blur-lg opacity-20 group-hover:opacity-30 -z-20 transition-opacity duration-300"></div>

              <span className="relative z-10 flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faCalendarPlus} className="text-xl" />
                <span>{t.scheduleButton}</span>
              </span>
            </motion.button>
          </motion.div>

          {/* Features Grid - Premium Glassmorphism Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {/* Feature 1 - Premium Glassmorphism with Depth */}
            <motion.div
              className="group relative bg-white/[0.08] backdrop-blur-lg rounded-2xl p-7 border border-white/20 hover:bg-white/[0.12] hover:border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(55,114,255,0.4)] transition-all duration-300 cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {/* Subtle Inner Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Icon with Brand Colors */}
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-[0_4px_20px_rgba(55,114,255,0.4)]"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})` }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FontAwesomeIcon icon={faClock} className="text-white text-2xl" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3 text-center group-hover:text-[#c1d3ff] transition-colors">
                {t.features[0].title}
              </h3>
              <p className="text-gray-300 text-sm text-center leading-relaxed group-hover:text-gray-200 transition-colors">
                {t.features[0].description}
              </p>

              {/* Premium Hover Gradient Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(135deg, ${brand.accentRgba}0.1), ${brand.accentRgba}0.06))` }} />
            </motion.div>

            {/* Feature 2 - Premium Glassmorphism with Depth */}
            <motion.div
              className="group relative bg-white/[0.08] backdrop-blur-lg rounded-2xl p-7 border border-white/20 hover:bg-white/[0.12] hover:border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(55,114,255,0.4)] transition-all duration-300 cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              {/* Subtle Inner Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Icon with Brand Colors */}
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-[0_4px_20px_rgba(55,114,255,0.4)]"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})` }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FontAwesomeIcon icon={faUserMd} className="text-white text-2xl" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3 text-center group-hover:text-[#c1d3ff] transition-colors">
                {t.features[1].title}
              </h3>
              <p className="text-gray-300 text-sm text-center leading-relaxed group-hover:text-gray-200 transition-colors">
                {t.features[1].description}
              </p>

              {/* Premium Hover Gradient Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(135deg, ${brand.accentRgba}0.1), ${brand.accentRgba}0.06))` }} />
            </motion.div>

            {/* Feature 3 - Premium Glassmorphism with Depth */}
            <motion.div
              className="group relative bg-white/[0.08] backdrop-blur-lg rounded-2xl p-7 border border-white/20 hover:bg-white/[0.12] hover:border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(55,114,255,0.4)] transition-all duration-300 cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              {/* Subtle Inner Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Icon with Brand Colors */}
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-[0_4px_20px_rgba(55,114,255,0.4)]"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})` }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FontAwesomeIcon icon={faShieldAlt} className="text-white text-2xl" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3 text-center group-hover:text-[#c1d3ff] transition-colors">
                {t.features[2].title}
              </h3>
              <p className="text-gray-300 text-sm text-center leading-relaxed group-hover:text-gray-200 transition-colors">
                {t.features[2].description}
              </p>

              {/* Premium Hover Gradient Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(135deg, ${brand.accentRgba}0.1), ${brand.accentRgba}0.06))` }} />
            </motion.div>
          </motion.div>

          {/* Trust Indicators - Integrated & Subtle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, type: "spring", stiffness: 100 }}
            className="mt-8 mb-10 sm:mb-6 flex flex-wrap items-center justify-center gap-3 text-xs"
          >
            <motion.div
              className="group flex items-center gap-2 bg-white/[0.06] backdrop-blur-md px-4 py-2 rounded-full border border-white/15 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-sm opacity-80" style={{ color: brand.primary }} />
              </motion.div>
              <span className="text-gray-300 font-medium group-hover:text-gray-200 transition-colors opacity-90">
                {t.trust[0]}
              </span>
            </motion.div>
            <motion.div
              className="group flex items-center gap-2 bg-white/[0.06] backdrop-blur-md px-4 py-2 rounded-full border border-white/15 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-sm opacity-80" style={{ color: brand.primary }} />
              </motion.div>
              <span className="text-gray-300 font-medium group-hover:text-gray-200 transition-colors opacity-90">
                {t.trust[1]}
              </span>
            </motion.div>
            <motion.div
              className="group flex items-center gap-2 bg-white/[0.06] backdrop-blur-md px-4 py-2 rounded-full border border-white/15 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-sm opacity-80" style={{ color: brand.primary }} />
              </motion.div>
              <span className="text-gray-300 font-medium group-hover:text-gray-200 transition-colors opacity-90">
                {t.trust[2]}
              </span>
            </motion.div>
          </motion.div>
        </div>
        </div>
      </div>

      {/* Bottom Wave - Reduced ambient glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/8 to-transparent" />
    </motion.section>
  );
}
