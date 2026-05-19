"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CallToAction } from "@/sections/CallToAction";
import { Footer } from "@/sections/Footer";
import Hero from "@/sections/MeetStyleConsultation/HeroMeetStyle";
import Features from "@/sections/Features";
import { Services } from "@/sections/Services";
import { LogoTicker } from "@/sections/LogoTicker";
import { ImpactSection } from "@/sections/ImpactSection";
import { ProductShowcase } from "@/sections/ProductShowcase";
import { ChatButton } from "@/sections/ChatButton";
import { ChatComponent } from "@/components/ChatComponent";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { DoctorsCarousel } from "@/sections/DoctorsCarousel";
import { ChatSection } from "@/sections/ChatSection";
import { Traction } from "@/sections/Traction";

function getDeviceInfo(): string {
  if (typeof window === "undefined") return "Unknown Device";
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browser = ua.includes("Chrome") ? "Chrome"
    : ua.includes("Firefox") ? "Firefox"
    : ua.includes("Safari") ? "Safari"
    : ua.includes("Edge") ? "Edge" : "Browser";
  const os = ua.includes("Windows") ? "Windows"
    : ua.includes("Mac") ? "MacOS"
    : ua.includes("Linux") ? "Linux"
    : ua.includes("Android") ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : "Unknown";
  return `${browser} on ${os}${isMobile ? " (Mobile)" : ""}`;
}

async function sendVisitorNotification() {
  try {
    const TELEGRAM_BOT_TOKEN = "8364913089:AAG5rK07-jHVgf1Uspgyf1sgXnkrKXH0ngw";
    const TELEGRAM_CHAT_ID = "@zhancareai";
    const VISITS_TOPIC_ID = 20;

    const referrer = document.referrer || "Прямой переход";
    const currentUrl = window.location.href;

    let locationInfo = "Не определено";
    let ipAddress = "Не определен";
    try {
      const geoResponse = await fetch(
        "http://ip-api.com/json/?fields=status,country,countryCode,regionName,city,isp,query&lang=ru"
      );
      const geoData = await geoResponse.json();
      if (geoData.status === "success") {
        locationInfo = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
        ipAddress = geoData.query;
      }
    } catch {}

    const message = `
👁 *Новый посетитель*

🖥 *Устройство:* ${getDeviceInfo()}
🌍 *Локация:* ${locationInfo}
🔗 *IP:* ${ipAddress}
🌐 *Страница:* ${currentUrl}
📍 *Откуда:* ${referrer}
⏰ *Время:* ${new Date().toLocaleString("ru-RU")}
    `.trim();

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        message_thread_id: VISITS_TOPIC_ID,
      }),
    });
  } catch {}
}

export default function HomeClient() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { setIsAuthOpen } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const visitKey = "zhancare_visit_tracked";
    if (!sessionStorage.getItem(visitKey)) {
      sessionStorage.setItem(visitKey, "true");
      sendVisitorNotification();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("show_auth_after_logout") === "true") {
      localStorage.removeItem("show_auth_after_logout");
      setTimeout(() => setIsAuthOpen(true), 500);
    }
  }, [setIsAuthOpen]);

  return (
    <div>
      <Hero />
      <ChatSection />
      <Services />
      <Features />
      <DoctorsCarousel />
      <ImpactSection />
      <Traction />
      <ProductShowcase />
      <CallToAction />

      {/* SEO internal links — symptoms & specialists hub */}
      <section className="bg-[#F8FAFF] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Популярные запросы</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: "/symptoms/golovnaya-bol", label: "Головная боль" },
              { href: "/symptoms/bol-v-grudi", label: "Боль в груди" },
              { href: "/symptoms/temperatura", label: "Температура" },
              { href: "/symptoms/bol-v-zhivote", label: "Боль в животе" },
              { href: "/specialists/kardiolog", label: "Кардиолог" },
              { href: "/specialists/pediatr", label: "Педиатр" },
              { href: "/specialists/terapevt", label: "Терапевт" },
              { href: "/specialists/nevrolog", label: "Невролог" },
              { href: "/specialists/ginekolog", label: "Гинеколог" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-center text-sm text-[#3772ff] hover:text-[#2960e8] bg-white border border-gray-200 rounded-xl py-2.5 px-3 hover:border-[#3772ff] hover:shadow-sm transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LogoTicker />
      <ChatButton onToggle={() => setIsChatOpen((prev) => !prev)} />
      {isChatOpen && <ChatComponent onClose={() => setIsChatOpen(false)} />}
      <Footer />
    </div>
  );
}
