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
    <section className="relative py-20 px-4 md:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#e6ebf3] via-[#d2dcff] to-white">
      {/* 🌀 Blurred Floating Background */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      <div className="container mx-auto relative z-10">

        {/* 📊 Title */}
        <div className="text-center mb-14">
          <motion.h2
            className="text-4xl font-extrabold tracking-tight text-[#001E80]"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {translations.title}
          </motion.h2>
          <p className="text-gray-600 mt-4">{translations.description}</p>
        </div>

        {/* 🔹 Statistics Section */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-center"
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
          {translations.statistics.map((stat, index) => {
            const icon = iconMapping[stat.icon as IconName] || faChartLine;
            return (
              <motion.div
                key={index}
                className="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-transform duration-300 hover:scale-105 hover:-rotate-1"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <FontAwesomeIcon icon={icon} className="text-4xl text-blue-600 mb-4" />
                <h3 className="text-3xl font-bold text-[#001E80]">
                  <CountUp end={parseInt(stat.value)} duration={2} />+
                </h3>
                <p className="text-gray-600 text-sm">{stat.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* 🤖 AI Features */}
        <div className="text-center mt-20 mb-12">
          <motion.h2
            className="text-4xl font-extrabold tracking-tight text-[#001E80]"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {translations.features.title}
          </motion.h2>
          <p className="text-gray-600 mt-4">{translations.features.description}</p>
        </div>

        {/* 🔹 Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
          {translations.features.list.map((feature, index) => {
            const icon = iconMapping[feature.icon as IconName] || faStethoscope;
            return (
              <motion.div
                key={index}
                className="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-transform duration-300 hover:scale-105"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <FontAwesomeIcon icon={icon} className="text-4xl text-blue-600 mb-4" />
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* 🚀 Success Stories */}
        <div className="text-center mt-20 mb-12">
          <motion.h2
            className="text-4xl font-extrabold tracking-tight text-[#001E80]"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {translations.successStories.title}
          </motion.h2>
          <p className="text-gray-600 mt-4">{translations.successStories.description}</p>
        </div>

        {/* 🔹 Success Stories Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.3,
              },
            },
          }}
        >
          {translations.successStories.stories.map((story, index) => {
            const icon = iconMapping[story.icon as IconName] || faGlobe;
            return (
              <motion.div
                key={index}
                className="p-6 bg-white rounded-2xl shadow-md flex flex-col sm:flex-row items-center gap-6 hover:shadow-xl transition-transform duration-300 hover:scale-105"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full">
                  <FontAwesomeIcon icon={icon} className="text-2xl" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold">{story.title}</h3>
                  <p className="text-gray-600 text-sm">{story.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};
