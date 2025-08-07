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
      className="relative pb-20 md:pb-10 overflow-hidden"
      id="hero"
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-screen h-[110vh] object-cover -z-10"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Black Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/60 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Header with Navbar */}
      <Header />

      {/* Hero Main Content */}
      <div className="relative z-10 container mx-auto text-white px-4">
        <HeroContent />
        {/* <HeroChat /> */}
        <HeroStats />
      </div>

      {/* Toast Notification */}
      <ToastContainer />
    </motion.section>
  );
}
