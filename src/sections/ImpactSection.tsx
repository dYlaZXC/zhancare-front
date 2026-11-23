"use client";

import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserMd,
  faStethoscope,
  faHeartbeat,
  faNotesMedical,
  faVideo,
  faChartLine,
  faClinicMedical,
  faBell,
  faPills,
  faClock,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import CountUp from "react-countup";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import uz from "@/locales/uz.json";
import enactusLogo from "@/assets/enactus-logo-white.png";
import astanamuaLogo from "@/assets/astanamua.png";
import akimatLogo from "@/assets/kazakhemblem.png";
import omronLogo from "@/assets/omron.png";
import impactVideo from "@/assets/impact_video.mp4";
import enactusVideo from "@/assets/impact_video_enactus.mp4";

type IconName =
  | "faUserMd"
  | "faStethoscope"
  | "faHeartbeat"
  | "faNotesMedical"
  | "faVideo"
  | "faChartLine"
  | "faClinicMedical"
  | "faBell"
  | "faPills"
  | "faClock"
  | "faGlobe";

const iconMapping: Record<IconName, any> = {
  faUserMd, faStethoscope, faHeartbeat, faNotesMedical, faVideo,
  faChartLine, faClinicMedical, faBell, faPills, faClock, faGlobe,
};

export const ImpactSection = () => {
  const { language } = useLanguage();
  const { brand } = useBrand();
  
  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.impactSection;
      case "kz":
        return kz.impactSection;
      case "en":
        return en.impactSection;
      case "uz":
        return uz.impactSection;
      default:
        return en.impactSection;
    }
  };

  const translations = getTranslations();

  return (
    <section 
      id="impact" 
      className="relative -mt-px py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 laptop-hd:py-24 desktop-fhd:py-32 desktop-qhd:py-40 desktop-4k:py-48 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 laptop-hd:px-8 desktop-fhd:px-12 desktop-qhd:px-16 desktop-4k:px-24 bg-gradient-to-b from-[#d2dcff] via-[#d2dcff] to-white text-center overflow-hidden"
    >
      {/* Responsive Floating Background */}
      <div className="absolute top-[80px] sm:top-[60px] lg:top-[40px] left-[-75px] sm:left-[-100px] lg:left-[-150px] w-[150px] sm:w-[200px] lg:w-[300px] desktop-qhd:w-[400px] desktop-4k:w-[500px] h-[150px] sm:h-[200px] lg:h-[300px] desktop-qhd:h-[400px] desktop-4k:h-[500px] rounded-full blur-2xl sm:blur-3xl" style={{ backgroundColor: brand.primary, opacity: 0.2 }}></div>
      <div className="absolute bottom-[-20%] sm:bottom-[-30%] lg:bottom-[-40%] right-[-75px] sm:right-[-100px] lg:right-[-150px] w-[150px] sm:w-[200px] lg:w-[300px] desktop-qhd:w-[400px] desktop-4k:w-[500px] h-[150px] sm:h-[200px] lg:h-[300px] desktop-qhd:h-[400px] desktop-4k:h-[500px] bg-pink-300 opacity-20 rounded-full blur-2xl sm:blur-3xl"></div>

      <div className="container mx-auto relative z-10 max-w-7xl laptop-hd:max-w-6xl desktop-fhd:max-w-7xl desktop-qhd:max-w-8xl desktop-4k:max-w-9xl">
        {/* Responsive Title */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl laptop-hd:text-4xl desktop-fhd:text-5xl desktop-qhd:text-6xl desktop-4k:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 lg:mb-8"
          style={{ color: brand.secondary }}
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {translations.title}
        </motion.h2>
        <p className="text-gray-600 max-w-xl sm:max-w-2xl lg:max-w-3xl desktop-qhd:max-w-4xl desktop-4k:max-w-5xl mx-auto text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl mb-12 sm:mb-16 lg:mb-20 desktop-qhd:mb-24 desktop-4k:mb-28">
          {translations.description}
        </p>

        {/* Responsive Statistics Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 desktop-qhd:gap-12 desktop-4k:gap-16 mb-16 sm:mb-20 lg:mb-24 desktop-qhd:mb-28 desktop-4k:mb-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          {translations.statistics.map((stat, index) => {
            const icon = iconMapping[stat.icon as IconName] || faChartLine;
            return (
              <motion.div
                key={index}
                className="group p-4 sm:p-6 lg:p-8 desktop-qhd:p-10 desktop-4k:p-12 bg-white backdrop-blur-md border border-white/20 rounded-2xl lg:rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-2 lg:hover:-translate-y-3 flex flex-col items-center"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="flex justify-center items-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 desktop-qhd:w-20 desktop-qhd:h-20 desktop-4k:w-24 desktop-4k:h-24 mb-4 sm:mb-6 rounded-full group-hover:scale-110 transition-all duration-300" style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}>
                  <FontAwesomeIcon icon={icon} className="text-xl sm:text-2xl lg:text-3xl desktop-qhd:text-4xl desktop-4k:text-5xl text-white" />
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl desktop-qhd:text-5xl desktop-4k:text-6xl font-bold mb-2" style={{ color: brand.secondary }}>
                  <CountUp end={stat.value} duration={2} />{stat.currency ? stat.currency : stat.percent ? "%" : "+"}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base desktop-qhd:text-lg desktop-4k:text-xl mt-2 text-center leading-relaxed">{stat.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Responsive Features Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20 desktop-qhd:mb-24 desktop-4k:mb-28"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl laptop-hd:text-4xl desktop-fhd:text-5xl desktop-qhd:text-6xl desktop-4k:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 lg:mb-8" style={{ color: brand.secondary }}>
            {translations.features.title}
          </h2>
          <p className="text-gray-600 max-w-xl sm:max-w-2xl lg:max-w-3xl desktop-qhd:max-w-4xl desktop-4k:max-w-5xl mx-auto text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl">
            {translations.features.description}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 desktop-qhd:gap-12 desktop-4k:gap-16 mb-16 sm:mb-20 lg:mb-24 desktop-qhd:mb-28 desktop-4k:mb-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          {translations.features.list.map((feature, index) => {
            const icon = iconMapping[feature.icon as IconName] || faStethoscope;
            return (
              <motion.div
                key={index}
                className="p-4 sm:p-6 lg:p-8 desktop-qhd:p-10 desktop-4k:p-12 bg-white backdrop-blur-md border border-white/20 rounded-2xl lg:rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-2 lg:hover:-translate-y-3 flex flex-col items-center text-center"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="flex justify-center items-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 desktop-qhd:w-20 desktop-qhd:h-20 desktop-4k:w-24 desktop-4k:h-24 mb-4 sm:mb-6 rounded-full" style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}>
                  <FontAwesomeIcon icon={icon} className="text-xl sm:text-2xl lg:text-3xl desktop-qhd:text-4xl desktop-4k:text-5xl text-white" />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl desktop-qhd:text-3xl desktop-4k:text-4xl font-bold mb-2 sm:mb-3 lg:mb-4">
                  {feature.title}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base desktop-qhd:text-lg desktop-4k:text-xl leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Responsive Success Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20 desktop-qhd:mb-24 desktop-4k:mb-28"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl laptop-hd:text-4xl desktop-fhd:text-5xl desktop-qhd:text-6xl desktop-4k:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 lg:mb-8" style={{ color: brand.secondary }}>
            {translations.successStories.title}
          </h2>
          <p className="text-gray-600 max-w-xl sm:max-w-2xl lg:max-w-3xl desktop-qhd:max-w-4xl desktop-4k:max-w-5xl mx-auto text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl">
            {translations.successStories.description}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 desktop-qhd:gap-12 desktop-4k:gap-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.3 } },
          }}
        >
          {/* Reorder stories so Enactus and OMRON are on the same row */}
          {[
            translations.successStories.stories[0], // Enactus
            translations.successStories.stories[3], // OMRON
            translations.successStories.stories[1], // Astana MUA
            translations.successStories.stories[2]  // Ministry
          ].map((story, index) => {
            // Map logos to match the reordered stories
            const logos = [enactusLogo.src, omronLogo.src, astanamuaLogo.src, akimatLogo.src];
            const logoAlts = ["Enactus Logo", "OMRON Logo", "Astana MUA Logo", "Министерства Республики Казахстан"];
            const logoSrc = logos[index] || logos[0];
            const logoAlt = logoAlts[index] || logoAlts[0];

            return (
              <motion.div
                key={index}
                className="group flex flex-col items-center text-center p-6 sm:p-8 lg:p-10 desktop-qhd:p-12 desktop-4k:p-14 bg-white backdrop-blur-md border border-white/30 rounded-3xl lg:rounded-4xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-105"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="w-full mb-6 sm:mb-8 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl group-hover:scale-105 group-hover:from-gray-700 group-hover:to-gray-800 transition-all duration-300">
                  {index === 3 ? (
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src={logoSrc}
                        alt={logoAlt}
                        className="h-20 sm:h-24 lg:h-28 desktop-qhd:h-32 desktop-4k:h-36 object-contain flex-shrink-0"
                      />
                      <p className="text-white text-base sm:text-lg lg:text-xl desktop-qhd:text-2xl desktop-4k:text-3xl font-medium text-center">
                        {story.title}
                      </p>
                    </div>
                  ) : index === 0 ? (
                    <div className="space-y-4">
                      <img
                        src={logoSrc}
                        alt={logoAlt}
                        className="w-full h-16 sm:h-20 lg:h-24 desktop-qhd:h-28 desktop-4k:h-32 object-contain"
                      />
                      <video
                        src={enactusVideo}
                        className="w-full h-32 sm:h-36 lg:h-40 desktop-qhd:h-44 desktop-4k:h-48 object-cover rounded-lg"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : index === 1 ? (
                    <div className="space-y-4">
                      <img
                        src={logoSrc}
                        alt={logoAlt}
                        className="w-full h-16 sm:h-20 lg:h-24 desktop-qhd:h-28 desktop-4k:h-32 object-contain"
                      />
                      <video
                        src={impactVideo}
                        className="w-full h-32 sm:h-36 lg:h-40 desktop-qhd:h-44 desktop-4k:h-48 object-cover rounded-lg"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <img
                      src={logoSrc}
                      alt={logoAlt}
                      className="w-full h-20 sm:h-24 lg:h-28 desktop-qhd:h-32 desktop-4k:h-36 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-lg sm:text-xl lg:text-2xl desktop-qhd:text-3xl desktop-4k:text-4xl font-bold mb-3 sm:mb-4 transition-colors duration-300" style={{ color: brand.secondary }}>
                    {story.title}
                  </p>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl leading-relaxed max-w-md mx-auto">
                    {story.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};