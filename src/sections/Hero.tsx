"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import heroVideo from "@/assets/hero-video.mp4";
import Header from "@/sections/Hero/Header";
import HeroContent from "@/sections/Hero/HeroContent";
// import HeroChat from "@/sections/Hero/HeroChat";
import HeroStats from "@/sections/Hero/HeroStats";

const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

export default function Hero() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative overflow-hidden min-h-screen laptop-hd:min-h-[768px] laptop-hd:h-[768px] desktop-fhd:min-h-[1080px] desktop-fhd:h-[1080px] pb-20 md:pb-10 laptop-hd:pb-8 desktop-fhd:pb-12"
      id="hero"
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full min-h-screen laptop-hd:min-h-[768px] desktop-fhd:min-h-[1080px] object-cover -z-10 scale-105"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Fallback Background for any gaps */}
      <div className="absolute inset-0 bg-gray-900 -z-20" />

      {/* Black Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/60 laptop-hd:bg-black/65 desktop-fhd:bg-black/50 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Header with Navbar */}
      <Header />

      {/* Hero Main Content */}
      <div className="relative z-10 container mx-auto text-white px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 laptop-hd:px-6 laptop-hd:max-w-none desktop-fhd:px-8 desktop-fhd:max-w-none">
        <div className="pt-8 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-24 laptop-hd:pt-12 desktop-fhd:pt-16">
          <div className="laptop-hd:transform laptop-hd:scale-90 laptop-hd:origin-top-left desktop-fhd:transform desktop-fhd:scale-100 desktop-fhd:origin-top">
            <HeroContent />
            {/* <HeroChat /> */}
            {/* <HeroStats /> */}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <ToastContainer />
    </motion.section>
  );
}