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
  faPlane,
  faGraduationCap,
  faTruck,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

const iconMapping = {
  faVideo, faStethoscope, faNotesMedical, faBell,
  faUserMd, faHeartbeat, faPills, faClinicMedical, faChartLine,
  faHouse, faPlane, faGraduationCap, faTruck, faArrowUpRightFromSquare,
} as const;

type IconName = keyof typeof iconMapping;

interface Service {
  icon: IconName;
  title: string;
  description: string;
  details: string[];
  href?: string;
}

export const Services = () => {
  const { language } = useLanguage();
  const { brand } = useBrand();
  
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

  // Take only first 3 services from translations
  const translatedServices: Service[] = translations.list.slice(0, 3).map((service) => ({
    ...service,
    icon: service.icon as IconName,
  }));

  // Static extra cards (second row)
  const extraServices: Service[] = [
    {
      icon: "faGraduationCap",
      title: language === "kz" ? "Академия" : language === "en" ? "Academy" : "Академия",
      description:
        language === "kz"
          ? "Медицина мамандары мен пациенттерге арналған білім беру платформасы"
          : language === "en"
          ? "Educational platform for medical professionals and patients"
          : "Образовательная платформа для медицинских специалистов и пациентов",
      details:
        language === "en"
          ? ["Online courses for doctors", "Patient health education", "Certificates & CME credits", "Expert-led webinars"]
          : language === "kz"
          ? ["Дәрігерлерге арналған онлайн курстар", "Пациенттерге денсаулық білімі", "Сертификаттар мен кредиттер", "Сарапшы вебинарлары"]
          : ["Онлайн-курсы для врачей", "Обучение пациентов здоровью", "Сертификаты и кредиты", "Вебинары от экспертов"],
      href: "https://academy.zhan.care/",
    },
    {
      icon: "faTruck",
      title:
        language === "kz" ? "Дәрі-дәрмек жеткізу" : language === "en" ? "Medicine Delivery" : "Доставка лекарств",
      description:
        language === "kz"
          ? "Дәрі-дәрмекті үйге жылдам және ыңғайлы жеткізу"
          : language === "en"
          ? "Fast and convenient medicine delivery to your door"
          : "Быстрая и удобная доставка лекарств прямо на дом",
      details:
        language === "en"
          ? ["Prescription & OTC medicines", "Delivery within 2 hours", "Track your order in real-time", "Safe contactless delivery"]
          : language === "kz"
          ? ["Рецепттік және рецептсіз дәрілер", "2 сағат ішінде жеткізу", "Тапсырысты нақты уақытта қадағалау", "Қауіпсіз байланыссыз жеткізу"]
          : ["Рецептурные и безрецептурные препараты", "Доставка в течение 2 часов", "Отслеживание заказа в реальном времени", "Безопасная бесконтактная доставка"],
    },
    {
      icon: "faClinicMedical",
      title:
        language === "kz" ? "Клиникаларға арналған CRM/МИС" : language === "en" ? "CRM / HIS for Clinics" : "CRM / МИС для клиник",
      description:
        language === "kz"
          ? "Медициналық мекемелер үшін бірыңғай басқару жүйесі"
          : language === "en"
          ? "Unified management system for medical institutions"
          : "Единая система управления для медицинских учреждений",
      details:
        language === "en"
          ? ["Patient records & EHR", "Appointment scheduling", "Billing & insurance management", "Analytics & reporting dashboard"]
          : language === "kz"
          ? ["Пациент жазбалары және ЭМЖ", "Қабылдауды жоспарлау", "Есеп-қисап және сақтандыру", "Аналитика және есептер"]
          : ["Ведение карт и ЭМК пациентов", "Запись на приём и расписание", "Выставление счетов и страхование", "Аналитика и отчётность"],
    },
  ];

  const services: Service[] = [...translatedServices, ...extraServices];

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
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: brand.primary, opacity: 0.2 }}></div>
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl laptop-hd:text-4xl desktop-fhd:text-5xl desktop-qhd:text-6xl desktop-4k:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 lg:mb-8" style={{ color: brand.secondary }}>{translations.servicesHeader}</h2>
            <p className="text-lg text-gray-600 mt-4">{translations.servicesDescription}</p>
          </motion.div>

          {/* Services Cards - 3 per row */}
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
                  className="relative w-full h-[440px] cursor-pointer"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: !service.href && flippedCards.has(index) ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  onClick={() => service.href ? window.open(service.href, "_blank", "noopener,noreferrer") : handleCardFlip(index)}
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
                      <div className="p-6 text-white rounded-full shadow-md group-hover:scale-110 transition-all duration-300" style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}>
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
                            relative px-6 py-3 bg-transparent border-2
                            rounded-full font-semibold text-sm transition-all duration-300
                            hover:text-white hover:shadow-lg
                            focus:outline-none focus:ring-2 focus:ring-offset-2
                            group/btn overflow-hidden
                          "
                          style={{ borderColor: brand.primary, color: brand.primary }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = brand.primary;
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Background animation on hover */}
                          <motion.div
                            className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                            style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`, borderRadius: "inherit" }}
                          />
                          
                          {/* Button content */}
                          <span className="relative z-10 flex items-center space-x-2">
                            <span>{staticTranslations.learnMore}</span>
                            {service.href ? (
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                            ) : (
                              <motion.span
                                className="inline-block"
                                animate={{ x: [0, 3, 0] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                →
                              </motion.span>
                            )}
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
                    className="absolute inset-0 w-full h-full shadow-lg rounded-2xl p-6 text-white overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.primary} 100%)`,
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <div className="inline-flex p-3 bg-white/20 text-white rounded-xl shadow-lg mb-3 backdrop-blur-sm">
                          <FontAwesomeIcon icon={iconMapping[service.icon]} className="text-xl" />
                        </div>
                        <h5 className="text-lg font-bold mb-2">{service.title}</h5>
                        <div className="w-16 h-0.5 bg-white/30 mx-auto"></div>
                      </div>
                      
                      {/* Details List */}
                      <div className="flex-1">
                        <h6 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
                          {staticTranslations.whatIncluded}
                        </h6>
                        <ul className="space-y-2">
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
                      <div className="text-center pt-3 mt-2 border-t border-white/20 flex-shrink-0">
                        <motion.button
                          className="
                            px-4 py-2 bg-white/20 backdrop-blur-sm text-white
                            rounded-full text-sm font-medium transition-all duration-300
                            hover:bg-white/30 hover:scale-105 focus:outline-none
                            focus:ring-2 focus:ring-white/50
                          "
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); handleCardFlip(index); }}
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