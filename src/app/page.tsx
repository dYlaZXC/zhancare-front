"use client";

import React, { useState, useEffect } from "react";
import { CallToAction } from "@/sections/CallToAction";
import { Footer } from "@/sections/Footer";
import Hero  from "@/sections/MeetStyleConsultation/HeroMeetStyle";
import Features from "@/sections/Features";
import { Services } from "@/sections/Services";
import { LogoTicker } from "@/sections/LogoTicker";
import { ImpactSection } from "@/sections/ImpactSection"
import { Pricing } from "@/sections/Pricing"
import { ProductShowcase } from "@/sections/ProductShowcase";
import { ChatButton } from "@/sections/ChatButton";
import { ChatComponent } from "@/components/ChatComponent";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { DoctorsCarousel } from "@/sections/DoctorsCarousel";
import { ChatSection } from "@/sections/ChatSection";
import { MobileApp } from "@/sections/MobileApp";
import  Hero404  from "@/sections/Hero404";
import { Traction } from "@/sections/Traction";


export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { setIsAuthOpen } = useAuth();

  // Get device info for visitor tracking
  const getDeviceInfo = (): string => {
    if (typeof window === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const browser = ua.includes('Chrome') ? 'Chrome' :
                   ua.includes('Firefox') ? 'Firefox' :
                   ua.includes('Safari') ? 'Safari' :
                   ua.includes('Edge') ? 'Edge' : 'Browser';
    const os = ua.includes('Windows') ? 'Windows' :
              ua.includes('Mac') ? 'MacOS' :
              ua.includes('Linux') ? 'Linux' :
              ua.includes('Android') ? 'Android' :
              ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : 'Unknown';
    return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
  };

  // Send visitor notification to Telegram
  const sendVisitorNotification = async () => {
    try {
      const TELEGRAM_BOT_TOKEN = "8364913089:AAG5rK07-jHVgf1Uspgyf1sgXnkrKXH0ngw";
      const TELEGRAM_CHAT_ID = "@zhancareai";
      const VISITS_TOPIC_ID = 20;
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

      const referrer = document.referrer || 'Прямой переход';
      const currentUrl = window.location.href;

      // Get location from IP using free geolocation API
      let locationInfo = 'Не определено';
      let ipAddress = 'Не определен';
      try {
        const geoResponse = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,regionName,city,isp,query&lang=ru');
        const geoData = await geoResponse.json();
        if (geoData.status === 'success') {
          locationInfo = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
          ipAddress = geoData.query;
        }
      } catch (geoError) {
        console.error('Geolocation error:', geoError);
      }

      const message = `
👁 *Новый посетитель*

🖥 *Устройство:* ${getDeviceInfo()}
🌍 *Локация:* ${locationInfo}
🔗 *IP:* ${ipAddress}
🌐 *Страница:* ${currentUrl}
📍 *Откуда:* ${referrer}
⏰ *Время:* ${new Date().toLocaleString('ru-RU')}
      `.trim();

      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          message_thread_id: VISITS_TOPIC_ID,
        }),
      });
    } catch (error) {
      console.error('Visitor notification error:', error);
    }
  };

  // Track visitor on page load (once per session)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visitKey = 'zhancare_visit_tracked';
      const hasVisited = sessionStorage.getItem(visitKey);

      if (!hasVisited) {
        sessionStorage.setItem(visitKey, 'true');
        sendVisitorNotification();
      }
    }
  }, []);

  // Check if user just logged out and auto-open auth popup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const shouldShowAuth = localStorage.getItem("show_auth_after_logout");
      if (shouldShowAuth === "true") {
        // Remove the flag
        localStorage.removeItem("show_auth_after_logout");
        // Open auth popup after a short delay to ensure page is loaded
        setTimeout(() => {
          setIsAuthOpen(true);
        }, 500);
      }
    }
  }, [setIsAuthOpen]);

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
      
      {/* Traction / Timeline Section */}
      <Traction />

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