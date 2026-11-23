"use client";

import { motion } from "framer-motion";
import HeroContentNew from "./HeroContentNew";
import Header from "./Header";
import heroVideo from "@/assets/hero-video.mp4";

/**
 * HeroSwitcher - A component that allows switching between different hero designs
 * Currently showing the new Google Meet-inspired design with background video
 */
export default function HeroSwitcher() {
  return (
    <section className="relative min-h-screen overflow-hidden" id="hero">
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

      {/* Dark Overlay for better text readability */}
      <motion.div
        className="absolute inset-0 bg-black/50 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Header */}
      <Header />

      {/* Hero Content */}
      <HeroContentNew />
    </section>
  );
}
