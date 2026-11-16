"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import { isStandalone, isMobileUserAgent, STANDALONE_GATE_DISMISSED_EVENT } from "@/lib/pwaDetect";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import kz from "@/locales/kz.json";
import uz from "@/locales/uz.json";

const DISMISS_KEY = "zhancare_standalone_welcome_dismissed";

/**
 * Installed PWA + phone + not logged in: skip the marketing landing (the
 * person already installed the app, they don't need the pitch again) and
 * go straight to a short branded login/register screen instead — but only
 * here. Regular mobile-browser visits (SEO, ads, cold traffic who haven't
 * installed anything) keep the full landing, or this would cost real
 * conversions from people who don't know the product yet.
 */
export default function StandaloneWelcomeGate({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuth } = useAuth();
  const { language } = useLanguage();
  const { appLogo, brand } = useBrand();
  const [shouldGate, setShouldGate] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const t = (language === "en" ? en : language === "kz" ? kz : language === "uz" ? uz : ru).standaloneWelcome;

  useEffect(() => {
    setShouldGate(isStandalone() && isMobileUserAgent());
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const handleContinueAsGuest = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
    window.dispatchEvent(new Event(STANDALONE_GATE_DISMISSED_EVENT));
  };

  if (loading || user || !shouldGate || dismissed) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center"
      style={{ background: brand.sidebarGradient }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xs flex flex-col items-center gap-6"
      >
        <Image src={appLogo} alt="ZhanCare.AI" width={180} height={180} className="w-36 h-auto object-contain drop-shadow-xl" priority />
        <p className="text-white/90 text-base font-medium">{t.tagline}</p>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="w-full py-3.5 rounded-2xl font-bold text-[#1D1D2F] bg-white shadow-lg"
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => openAuth("register")}
            className="w-full py-3.5 rounded-2xl font-bold text-white border border-white/40"
          >
            {t.register}
          </button>
        </div>

        <button type="button" onClick={handleContinueAsGuest} className="text-white/60 text-sm underline">
          {t.continueAsGuest}
        </button>
      </motion.div>
    </div>
  );
}
