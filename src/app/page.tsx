"use client";

import React, { useState } from "react";
import { CallToAction } from "@/sections/CallToAction";
import { Footer } from "@/sections/Footer";
import Hero  from "@/sections/HeroMeetStyle";
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
import { ChatSection } from "@/sections/ChatSection";
import { MobileApp } from "@/sections/MobileApp";
import  Hero404  from "@/sections/Hero404";


export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      {/* Hero404 Section */}
      {/* <Hero404/> */}

      {/* Hero Section */}
      <Hero />

      {/* Chat Section */}
      <ChatSection />

      {/* Services Section */}
      <Services />
      
      {/* Features Section */}
      <Features />
      
      {/* DoctorsCarousel Section */}
      <DoctorsCarousel />
      
      {/* Impact Section */}
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
      
      
      {/* MobileApp */}
      {/* <MobileApp /> */}

      {/* Footer */}
      <Footer />
    </div>
  );
}