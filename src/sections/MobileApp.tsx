"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import iPhoneMock from "@/assets/iphonemock.png"; // ✅ Your mockup
import AppStoreBadge from "@/assets/avatar-1.png"; // ✅ You need these two images
import PlayStoreBadge from "@/assets/avatar-1.png";

export const MobileApp = () => {
  return (
    <section className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-[#1d1d2f] via-[#1A1A2E] to-[#1D1D2F] text-white text-center overflow-hidden">
      
      {/* Floating background gradients */}
      <div className="absolute top-[-150px] left-[-100px] w-[300px] h-[300px] bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-150px] right-[-100px] w-[300px] h-[300px] bg-pink-500 opacity-20 rounded-full blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: "spring" }}
        className="container mx-auto flex flex-col items-center"
      >
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="text-4xl md:text-5xl font-extrabold mb-6"
        >
          🚀 Coming Soon: ZhanCare.AI Mobile App
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          className="text-gray-400 max-w-2xl mx-auto text-lg mb-12"
        >
          Bringing AI-powered healthcare directly to your pocket — experience consultations, diagnostics, and health monitoring anytime, anywhere.
        </motion.p>

        {/* Floating iPhone */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
          className="flex justify-center mb-12"
        >
          <div className="relative w-[220px] h-[440px] md:w-[300px] md:h-[600px]">
            <Image
              src={iPhoneMock}
              alt="Mobile App Preview"
              layout="fill"
              objectFit="contain"
              className="drop-shadow-2xl rounded-3xl"
            />
          </div>
        </motion.div>

        {/* Download Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap gap-6 justify-center"
        >
          <a href="#" aria-label="App Store Coming Soon">
            <Image src={AppStoreBadge} alt="Download on App Store" width={160} height={50} />
          </a>
          <a href="#" aria-label="Google Play Coming Soon">
            <Image src={PlayStoreBadge} alt="Download on Google Play" width={160} height={50} />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};
