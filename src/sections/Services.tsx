"use client";

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
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

const iconMapping = {
  faVideo, faStethoscope, faNotesMedical, faBell,
  faUserMd, faHeartbeat, faPills, faClinicMedical, faChartLine,
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
  const translations = language === "ru" ? ru.services : kz.services;

  const services: Service[] = translations.list.map((service) => ({
    ...service,
    icon: service.icon as IconName,
  }));

  return (
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

        {/* Services Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
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
              className="
                relative bg-white shadow-lg rounded-2xl p-8 text-center transition-all duration-500 
                group cursor-pointer hover:scale-[1.05] hover:shadow-2xl hover:-rotate-1
              "
            >
              {/* Overlay */}
              <div
                className="
                  absolute inset-0 bg-gradient-to-br from-[#001E80] to-[#3A50FF] 
                  transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 
                  transition-all duration-[800ms] ease-in-out rounded-2xl flex flex-col items-center justify-center
                "
              >
                {/* Details List */}
                <ul className="list-none text-white text-lg space-y-4 opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] delay-200">
                  {service.details.map((detail, i) => (
                    <li 
                      key={i}
                      className="opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0"
                      style={{ transitionDelay: `${i * 100 + 300}ms` }}
                    >
                      - {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Main Card */}
              <div className="relative z-10">
                <div className="flex flex-col items-center space-y-4 transition-opacity duration-500 group-hover:opacity-0">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-md group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={iconMapping[service.icon]} className="text-3xl" />
                  </div>
                  <h5 className="text-2xl font-bold text-gray-800">{service.title}</h5>
                  <p className="text-gray-500">{service.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
