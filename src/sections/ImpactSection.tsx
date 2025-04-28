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
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

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
  const translations = language === "kz" ? kz.impactSection : ru.impactSection;

  return (
    <section id="impact" className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-[#d2dcff] via-[#d2dcff] to-white text-center overflow-hidden">
      {/* Floating Background */}
      <div className="absolute top-[-0px] left-[-150px] w-[300px] h-[300px] bg-blue-300 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-40%] right-[-150px] w-[300px] h-[300px] bg-pink-300 opacity-20 rounded-full blur-3xl"></div>

      <div className="container mx-auto relative z-10">
        {/* Title */}
        <motion.h2
          className="text-5xl font-extrabold tracking-tight text-[#001E80] mb-6"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {translations.title}
        </motion.h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-16">
          {translations.description}
        </p>

        {/* Statistics Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 mb-24"
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
                className="group p-8 bg-white backdrop-blur-md border border-white/20 rounded-3xl shadow-md hover:shadow-2xl transition-transform duration-300 ease-out hover:-translate-y-3 flex flex-col items-center"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="flex justify-center items-center w-16 h-16 mb-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:scale-110 transition-all duration-300">
                  <FontAwesomeIcon icon={icon} className="text-3xl text-white" />
                </div>
                <h3 className="text-4xl font-bold text-[#001E80] mb-2">
                  <CountUp end={stat.value} duration={2} />{stat.currency ? stat.currency : stat.percent ? "%" : "+"}
                </h3>
                <p className="text-gray-600 text-base mt-2">{stat.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-extrabold text-[#001E80] mb-6">{translations.features.title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">{translations.features.description}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
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
                className="p-8 bg-white backdrop-blur-md border border-white/20 rounded-3xl shadow-md hover:shadow-2xl transition-transform duration-300 ease-out hover:-translate-y-3 flex flex-col items-center text-center"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="flex justify-center items-center w-16 h-16 mb-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                  <FontAwesomeIcon icon={icon} className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-base">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Success Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-24 mb-16"
        >
          <h2 className="text-4xl font-extrabold text-[#001E80] mb-6">{translations.successStories.title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">{translations.successStories.description}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.3 } },
          }}
        >
          {translations.successStories.stories.map((story, index) => {
            const icon = iconMapping[story.icon as IconName] || faGlobe;
            return (
              <motion.div
                key={index}
                className="flex flex-col sm:flex-row items-center gap-6 p-8 bg-white backdrop-blur-md border border-white/20 rounded-3xl shadow-md hover:shadow-2xl transition-transform duration-300 ease-out hover:-translate-y-3"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <FontAwesomeIcon icon={icon} className="text-2xl" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold mb-1">{story.title}</h3>
                  <p className="text-gray-600 text-base">{story.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};