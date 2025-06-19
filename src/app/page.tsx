"use client";

import React, { useState } from "react";
import { CallToAction } from "@/sections/CallToAction";
import { Footer } from "@/sections/Footer";
import Hero  from "@/sections/Hero";
import Features from "@/sections/Features";
import { Services } from "@/sections/Services";
import { LogoTicker } from "@/sections/LogoTicker";
import { ImpactSection } from "@/sections/ImpactSection"
import { Pricing } from "@/sections/Pricing"
import { ProductShowcase } from "@/sections/ProductShowcase";
import { ChatButton } from "@/sections/ChatButton";
import { ChatComponent } from "@/components/ChatComponent";
import { useLanguage } from "@/context/LanguageContext";
import { DoctorsCarousel } from "@/sections/DoctorsCarousel";
import { MobileApp } from "@/sections/MobileApp";


export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  return (
    <div>

      {/* Hero Section */}
      <Hero />
      {/* Services Section */}
      <Services />
      
      {/* Features Section */}
      <Features />
      <DoctorsCarousel />
      <ImpactSection />
      
      {/* Product Showcase Section */}
      <ProductShowcase />
      {/* Call To Action Section */}
      <CallToAction />

      
      {/* <Pricing /> */}
      {/* Logo Ticker Section */}
      <LogoTicker />
      {/* Chat Button */}
      <ChatButton onToggle={() => setIsChatOpen((prev) => !prev)} />
      {isChatOpen && <ChatComponent onClose={() => setIsChatOpen(false)} />}
      {/* Footer */}
      {/* <MobileApp /> */}
      <Footer />
    </div>
  );
}
