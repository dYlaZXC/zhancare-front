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
import { useState } from "react";
import heroVideo from "@/assets/hero-video.mp4";
import Header from "@/sections/Hero/Header";

export default function HeroMeetStyle() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

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
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-screen h-full object-cover -z-10"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay for better text readability */}
      <motion.div
        className="absolute inset-0 bg-black/50 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Header with Navbar */}
      <Header />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faUserMd} className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ZhanCare AI
              </span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
          >
            Консультация врача
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              за 5 минут
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto"
          >
            Опишите симптомы → ИИ подберет врача → Оплата → Видео консультация
          </motion.p>

          {/* Main Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            {/* Start Consultation Button */}
            <button
              onClick={handleStartConsultation}
              disabled={isStarting}
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-3">
                <FontAwesomeIcon
                  icon={faVideo}
                  className={`text-xl ${isStarting ? 'animate-pulse' : ''}`}
                />
                <span>{isStarting ? 'Запуск...' : 'Начать консультацию'}</span>
              </div>
            </button>

            {/* Schedule Meeting Button */}
            <button
              onClick={handleScheduleMeeting}
              className="group relative w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-gray-200 hover:border-blue-400"
            >
              <div className="flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faCalendarPlus} className="text-xl text-blue-600" />
                <span>Запланировать встречу</span>
              </div>
            </button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {/* Feature 1 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:bg-white/95 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto">
                <FontAwesomeIcon icon={faClock} className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Быстро</h3>
              <p className="text-gray-700 text-sm">
                Консультация начнется через 5 минут после оплаты
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:bg-white/95 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto">
                <FontAwesomeIcon icon={faUserMd} className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Умный подбор</h3>
              <p className="text-gray-700 text-sm">
                ИИ автоматически подберет подходящего врача
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:bg-white/95 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto">
                <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Безопасно</h3>
              <p className="text-gray-700 text-sm">
                Все данные защищены и конфиденциальны
              </p>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-100"
          >
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
              <span>Лицензированные врачи</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
              <span>Более 500+ консультаций</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
              <span>Рейтинг 4.9/5</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
    </motion.section>
  );
}
