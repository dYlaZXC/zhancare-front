"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faStethoscope,
  faNotesMedical,
  faBell,
  faUserMd,
  faHeartbeat,
  faPills,
  faClinicMedical,
  faChartLine,
  faHouse,
  faPlane
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

const iconMapping = {
  faVideo, faStethoscope, faNotesMedical, faBell,
  faUserMd, faHeartbeat, faPills, faClinicMedical, faChartLine,
  faHouse, faPlane
} as const;

type IconName = keyof typeof iconMapping;

interface Service {
  icon: IconName;
  title: string;
  description: string;
  details: string[];
}

export const Services = () => {
  const { language } = useLanguage();
  
  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.services;
      case "kz":
        return kz.services;
      case "en":
        return en.services;
      default:
        return en.services;
    }
  };

  const translations = getTranslations();
  
  // Get static text translations
  const getStaticTranslations = () => {
    switch (language) {
      case "ru":
        return {
          learnMore: "Подробнее",
          whatIncluded: "Что включено:",
          back: "← Назад"
        };
      case "kz":
        return {
          learnMore: "Толығырақ",
          whatIncluded: "Не кіреді:",
          back: "← Артқа"
        };
      case "en":
        return {
          learnMore: "Learn More",
          whatIncluded: "What's included:",
          back: "← Back"
        };
      default:
        return {
          learnMore: "Learn More",
          whatIncluded: "What's included:",
          back: "← Back"
        };
    }
  };

  const staticTranslations = getStaticTranslations();
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // Take only first 3 services
  const services: Service[] = translations.list.slice(0, 3).map((service) => ({
    ...service,
    icon: service.icon as IconName,
  }));

  const handleCardFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <>
      <section id="services" className="relative py-24 bg-gradient-to-b from-[#f0f4f8] to-[#e6ebf3] overflow-hidden">
        {/* Floating Background */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl font-extrabold text-[#001E80]">{translations.servicesHeader}</h1>
            <p className="text-lg text-gray-600 mt-4">{translations.servicesDescription}</p>
          </motion.div>

          {/* Services Cards - 3 cards in a row */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2,
                },
              },
            }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative"
                style={{ perspective: "1000px" }}
              >
                <motion.div
                  className="relative w-full h-96 cursor-pointer"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: flippedCards.has(index) ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  onClick={() => handleCardFlip(index)}
                >
                  {/* Front of Card */}
                  <div
                    className="absolute inset-0 w-full h-full bg-white shadow-lg rounded-2xl p-8 text-center group hover:scale-[1.05] hover:shadow-2xl hover:-rotate-1 transition-all duration-500"
                    style={{ 
                      backfaceVisibility: "hidden",
                      transform: "rotateY(0deg)"
                    }}
                  >
                    <div className="flex flex-col items-center space-y-4 h-full justify-center">
                      <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-md group-hover:scale-110 transition-all duration-300">
                        <FontAwesomeIcon icon={iconMapping[service.icon]} className="text-3xl" />
                      </div>
                      <h5 className="text-2xl font-bold text-gray-800">{service.title}</h5>
                      <p className="text-gray-500 leading-relaxed">{service.description}</p>
                      
                      {/* Learn More Button */}
                      <motion.div
                        className="mt-6"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          className="
                            relative px-6 py-3 bg-transparent border-2 border-blue-600 text-blue-600 
                            rounded-full font-semibold text-sm transition-all duration-300 
                            hover:bg-blue-600 hover:text-white hover:shadow-lg
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            group/btn overflow-hidden
                          "
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Background animation on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                            style={{ borderRadius: "inherit" }}
                          />
                          
                          {/* Button content */}
                          <span className="relative z-10 flex items-center space-x-2">
                            <span>{staticTranslations.learnMore}</span>
                            <motion.span
                              className="inline-block"
                              animate={{ x: [0, 3, 0] }}
                              transition={{ 
                                duration: 1.5, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                            >
                              →
                            </motion.span>
                          </span>
                          
                          {/* Shine effect */}
                          <motion.div
                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.6 }}
                            style={{ borderRadius: "inherit" }}
                          />
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#001E80] to-[#3A50FF] shadow-lg rounded-2xl p-8 text-white"
                    style={{ 
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div className="inline-flex p-4 bg-white/20 text-white rounded-xl shadow-lg mb-4 backdrop-blur-sm">
                          <FontAwesomeIcon icon={iconMapping[service.icon]} className="text-2xl" />
                        </div>
                        <h5 className="text-xl font-bold mb-2">{service.title}</h5>
                        <div className="w-16 h-0.5 bg-white/30 mx-auto"></div>
                      </div>
                      
                      {/* Details List */}
                      <div className="flex-1">
                        <h6 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                          {staticTranslations.whatIncluded}
                        </h6>
                        <ul className="space-y-3">
                          {service.details.map((detail, i) => (
                            <motion.li
                              key={i}
                              className="flex items-start space-x-3 text-sm text-white/90"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ 
                                opacity: flippedCards.has(index) ? 1 : 0, 
                                x: flippedCards.has(index) ? 0 : -20 
                              }}
                              transition={{ delay: flippedCards.has(index) ? i * 0.1 + 0.3 : 0 }}
                            >
                              <span className="w-2 h-2 bg-white/60 rounded-full flex-shrink-0 mt-2"></span>
                              <span className="leading-relaxed">{detail}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Back to front button */}
                      <div className="text-center pt-4 border-t border-white/20">
                        <motion.button
                          className="
                            px-4 py-2 bg-white/20 backdrop-blur-sm text-white 
                            rounded-full text-sm font-medium transition-all duration-300
                            hover:bg-white/30 hover:scale-105 focus:outline-none 
                            focus:ring-2 focus:ring-white/50
                          "
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {staticTranslations.back}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Custom styles for 3D flip effect */}
      <style jsx>{`
        [style*="backface-visibility: hidden"] {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        [style*="transform-style: preserve-3d"] {
          -webkit-transform-style: preserve-3d;
          transform-style: preserve-3d;
        }
        
        /* Ensure proper 3D rendering */
        .group [style*="rotateY(0deg)"] {
          transform: rotateY(0deg);
        }
        
        .group [style*="rotateY(180deg)"] {
          transform: rotateY(180deg);
        }
      `}</style>
    </>
  );
};