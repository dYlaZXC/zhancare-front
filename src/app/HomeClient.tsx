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
import InstallAppSection from "@/sections/InstallAppSection";
import { api } from "@/utils/api";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import kz from "@/locales/kz.json";
import uz from "@/locales/uz.json";

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

    await api.post("/tg/site-notify/", {
      type: "visitor",
      device: getDeviceInfo(),
      location: locationInfo,
      ip: ipAddress,
      url: currentUrl,
      referrer,
    });
  } catch {}
}

export default function HomeClient() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { setIsAuthOpen } = useAuth();
  const { language } = useLanguage();
  const tQueries = (language === "en" ? en : language === "kz" ? kz : language === "uz" ? uz : ru).popularQueries;

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
      <InstallAppSection />
      {/* <ChatSection /> */}
      <Services />
      <Features />
      <div className="bg-[#d2dcff]">
        <DoctorsCarousel />
        <ImpactSection />
      </div>
      {/* <Traction /> */}
      <ProductShowcase />
      <CallToAction />

      {/* SEO internal links — symptoms & specialists hub */}
      <section className="py-16 px-4 relative overflow-hidden" style={{
        background: "linear-gradient(180deg, #0e121d 0%, #131928 100%)",
        boxShadow: "inset 0 40px 80px rgba(0,0,0,0.6), inset 0 -40px 80px rgba(0,0,0,0.6), inset 60px 0 100px rgba(0,0,0,0.4), inset -60px 0 100px rgba(0,0,0,0.4)",
      }}>
        {/* Radial centre glow — the "bowl bottom" */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,38,62,0.0) 0%, rgba(8,10,18,0.55) 100%)",
        }} />
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(90deg, transparent, rgba(55,114,255,0.3))" }} />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: "#3772ff" }}>{tQueries.badge}</span>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(90deg, rgba(55,114,255,0.3), transparent)" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Symptoms */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-medium mb-3 pl-1">{tQueries.symptomsLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {tQueries.symptoms.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
                    style={{ background: "rgba(55,114,255,0.06)", border: "1px solid rgba(55,114,255,0.12)", color: "#bcc0ca" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(55,114,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "#ebf1ff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(55,114,255,0.3)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(55,114,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#bcc0ca"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(55,114,255,0.12)"; }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#3772ff" }} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Specialists */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-medium mb-3 pl-1">{tQueries.specialistsLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {tQueries.specialists.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
                    style={{ background: "rgba(55,114,255,0.06)", border: "1px solid rgba(55,114,255,0.12)", color: "#bcc0ca" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(55,114,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "#ebf1ff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(55,114,255,0.3)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(55,114,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#bcc0ca"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(55,114,255,0.12)"; }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#3772ff" }} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* left/right edge fade — bowl rim */}
        <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.45), transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.45), transparent)" }} />
      </section>

      <LogoTicker />
      <ChatButton onToggle={() => setIsChatOpen((prev) => !prev)} />
      {isChatOpen && <ChatComponent onClose={() => setIsChatOpen(false)} />}
      <Footer />
    </div>
  );
}
