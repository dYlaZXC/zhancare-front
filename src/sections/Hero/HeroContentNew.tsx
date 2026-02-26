"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Language translations
const translations = {
  en: {
    newConsultation: "New consultation",
    join: "Join",
    patient: "Patient",
    doctor: "Doctor",
  },
  ru: {
    newConsultation: "Новая консультация",
    join: "Присоединиться",
    patient: "Пациент",
    doctor: "Доктор",
  },
  kz: {
    newConsultation: "Жаңа консультация",
    join: "Қосылу",
    patient: "Пациент",
    doctor: "Дәрігер",
  },
};

export default function HeroContentNew() {
  const router = useRouter();
  const [language] = useState<"en" | "ru" | "kz">("ru");
  const t = translations[language];

  const handleNewConsultation = () => {
    router.push("/consultation/symptoms");
  };

  const handleJoin = () => {
    router.push("/consultation/join");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto w-full">
        {/* Main Content Container */}
        <div className="relative">
          {/* Central Circle with Patient/Doctor Visualization */}
          <div className="relative mx-auto" style={{ width: "500px", height: "500px" }}>
            {/* Security Shield - Top Position with Subtle Pulse */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <motion.div
                className="relative w-14 h-14 bg-[#3772ff] rounded-2xl shadow-[0_4px_20px_rgba(55,114,255,0.5)] flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {/* Shield Icon */}
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>

                {/* Subtle Pulse Rings */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-[#3772ff]"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-[#3772ff]"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
                />
              </motion.div>
            </div>

            {/* AI Icon - Bottom Position (Opposite of Shield) */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
              <motion.div
                className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-[0_4px_20px_rgba(168,85,247,0.5)] flex items-center justify-center"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <div className="text-white text-xl font-bold">AI</div>
              </motion.div>
            </div>

            {/* Patient Avatar - Left Side (Blue - Brand Colors) */}
            <motion.div
              className="absolute left-[15%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full shadow-2xl overflow-hidden"
              initial={{ x: -200, opacity: 0, scale: 0.5 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#c1d3ff] via-[#3772ff] to-[#2956bf]"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Eyes - BIGGER, BLACK */}
                <div className="absolute top-7 w-full flex justify-center gap-4">
                  <motion.div
                    className="w-4 h-4 bg-gray-800 rounded-full"
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                  <motion.div
                    className="w-4 h-4 bg-gray-800 rounded-full"
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                </div>

                {/* Smile - BIGGER, BLACK */}
                <motion.div
                  className="absolute top-14 left-1/2 -translate-x-1/2 w-10 h-5 border-b-4 border-gray-800 rounded-b-full"
                  animate={{ scaleX: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>

            {/* Patient Label */}
            <motion.div
              className="absolute left-[15%] top-[65%] -translate-x-1/2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <span className="text-white text-sm font-medium">{t.patient}</span>
              </div>
            </motion.div>

            {/* Doctor Avatar - Right Side (White body, Black features) */}
            <motion.div
              className="absolute right-[15%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full shadow-2xl overflow-hidden"
              initial={{ x: 200, opacity: 0, scale: 0.5 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                {/* Eyes - BLACK, BIGGER */}
                <div className="absolute top-7 w-full flex justify-center gap-4">
                  <motion.div
                    className="w-4 h-4 bg-gray-800 rounded-full"
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
                  />
                  <motion.div
                    className="w-4 h-4 bg-gray-800 rounded-full"
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
                  />
                </div>

                {/* Smile - BLACK, BIGGER */}
                <motion.div
                  className="absolute top-14 left-1/2 -translate-x-1/2 w-10 h-5 border-b-4 border-gray-800 rounded-b-full"
                  animate={{ scaleX: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </motion.div>
            </motion.div>

            {/* Doctor Label */}
            <motion.div
              className="absolute right-[15%] top-[65%] translate-x-1/2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <span className="text-white text-sm font-medium">{t.doctor}</span>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {/* New Consultation Button */}
            <motion.button
              onClick={handleNewConsultation}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(55,114,255,0.4)] hover:shadow-[0_6px_30px_rgba(55,114,255,0.6)] transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{t.newConsultation}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#2956bf] to-[#3772ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>

            {/* Join Button */}
            <motion.button
              onClick={handleJoin}
              className="group relative px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{t.join}</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
