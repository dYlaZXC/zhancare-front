"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, MoreVertical, Download, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import kz from "@/locales/kz.json";
import uz from "@/locales/uz.json";

type Platform = "android" | "ios";

// Chrome/Edge fire this instead of letting the browser show its own install
// UI, so the page can offer its own button and trigger the native prompt —
// not fired at all on iOS Safari (no native install prompt there).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's own non-standard flag — no `display-mode` media query support there.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "android";
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "ios" : "android";
}

// Same dark-bowl palette as the "Популярные запросы" SEO strip in
// src/app/HomeClient.tsx — reused verbatim (not brand.primary/secondary) so
// the two dark sections read as one system rather than two different blues.
const ACCENT = "#3772ff";
const CARD_BG = "rgba(55,114,255,0.06)";
const CARD_BORDER = "rgba(55,114,255,0.12)";
const CARD_BG_HOVER = "rgba(55,114,255,0.12)";
const CARD_BORDER_HOVER = "rgba(55,114,255,0.3)";
const TEXT_MUTED = "#bcc0ca";
const TEXT_BRIGHT = "#ebf1ff";

export default function InstallAppSection() {
  const { language } = useLanguage();
  const t = (language === "en" ? en : language === "kz" ? kz : language === "uz" ? uz : ru).installApp;

  const [platform, setPlatform] = useState<Platform>("android");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const steps = platform === "ios" ? t.iosSteps : t.androidSteps;

  return (
    <section
      className="py-16 px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0e121d 0%, #131928 100%)",
        boxShadow:
          "inset 0 40px 80px rgba(0,0,0,0.6), inset 0 -40px 80px rgba(0,0,0,0.6), inset 60px 0 100px rgba(0,0,0,0.4), inset -60px 0 100px rgba(0,0,0,0.4)",
      }}
    >
      {/* Radial centre glow — the "bowl bottom" */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,38,62,0.0) 0%, rgba(8,10,18,0.55) 100%)" }}
      />

      <div className="max-w-4xl mx-auto relative">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(90deg, transparent, rgba(55,114,255,0.3))" }} />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold whitespace-nowrap" style={{ color: ACCENT }}>
            {t.badge}
          </span>
          <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(90deg, rgba(55,114,255,0.3), transparent)" }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: TEXT_BRIGHT }}>
            {t.title}
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: TEXT_MUTED }}>
            {t.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-3xl p-6 md:p-10"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${CARD_BORDER}` }}
        >
          {installed ? (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <CheckCircle2 className="w-12 h-12" style={{ color: ACCENT }} />
              <p className="font-medium" style={{ color: TEXT_MUTED }}>{t.alreadyInstalled}</p>
            </div>
          ) : (
            <>
              {/* Platform tabs */}
              <div className="flex justify-center gap-2 mb-8">
                {(["android", "ios"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={
                      platform === p
                        ? { backgroundColor: ACCENT, color: "#fff" }
                        : { background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT_MUTED }
                    }
                    onMouseOver={(e) => {
                      if (platform === p) return;
                      e.currentTarget.style.background = CARD_BG_HOVER;
                      e.currentTarget.style.borderColor = CARD_BORDER_HOVER;
                      e.currentTarget.style.color = TEXT_BRIGHT;
                    }}
                    onMouseOut={(e) => {
                      if (platform === p) return;
                      e.currentTarget.style.background = CARD_BG;
                      e.currentTarget.style.borderColor = CARD_BORDER;
                      e.currentTarget.style.color = TEXT_MUTED;
                    }}
                  >
                    {p === "android" ? t.androidTabLabel : t.iosTabLabel}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.ol
                  key={platform}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2 max-w-xl mx-auto"
                >
                  {steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-200"
                      style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
                    >
                      <span
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                        style={{ background: ACCENT }}
                      />
                      <span className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>{step}</span>
                    </li>
                  ))}
                </motion.ol>
              </AnimatePresence>

              {platform === "android" && deferredPrompt && (
                <div className="flex justify-center mt-8">
                  <motion.button
                    onClick={handleInstallClick}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Download className="w-5 h-5" />
                    {t.installNow}
                  </motion.button>
                </div>
              )}

              {platform === "android" && !deferredPrompt && (
                <div className="flex justify-center mt-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <MoreVertical className="w-5 h-5" />
                </div>
              )}
              {platform === "ios" && (
                <div className="flex justify-center mt-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Share className="w-5 h-5" />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* left/right edge fade — bowl rim, matches the SEO strip below it */}
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.45), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.45), transparent)" }} />
    </section>
  );
}
