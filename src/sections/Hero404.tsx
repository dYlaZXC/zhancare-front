"use client";

import { useState } from "react";
import heroVideo from "@/assets/hero-video.mp4";
import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { motion } from "framer-motion";
import AIGame from "@/sections/AIGame";

export default function Hero404() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative min-h-screen flex items-center justify-center text-white text-center overflow-hidden"
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 w-full max-w-3xl px-6 py-10 sm:py-16">
        {!gameStarted ? (
          <>
            <Image
              src={Logo}
              alt="ZhanCare AI Logo"
              className="mx-auto mb-8 sm:mb-10"
              width={160}
              height={160}
              priority
            />

            <motion.h1
              className="text-6xl sm:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              404
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-white/90 italic mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              &quot;Лишь потеряв путь, мы обретаем себя. И лишь встретив других — учимся жить в мире.&quot;
              <br />
              <span className="font-semibold text-white mt-2 block">— Wolf Architect</span>
            </motion.p>

            <motion.div
              className="text-sm text-white/70 space-y-2 mb-8 sm:mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <p>
                Создано в <strong>ZhanCare AI</strong> — <span className="text-white">Адилан Ахрамович</span>, ТОО iTry
              </p>
              <p>
                📞 <a href="tel:+77758249686" className="underline">+7 775 824 9686</a>
              </p>
              <p>
                <a
                  href="https://www.linkedin.com/in/adilan-akhramovich-914132158/"
                  className="underline text-blue-400 hover:text-blue-300 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn Адилана
                </a>
              </p>
              <p>
                <a
                  href="https://kz.linkedin.com/company/itry-with-you"
                  className="underline text-blue-400 hover:text-blue-300 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn компании iTry
                </a>
              </p>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setGameStarted(true)}
              className="px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-lg sm:text-xl font-semibold shadow-lg hover:opacity-90 transition"
            >
              🚀 Начать AI игру
            </motion.button>
          </>
        ) : (
          <AIGame />
        )}
      </div>
    </motion.section>
  );
}
