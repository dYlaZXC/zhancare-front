"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Share, MoreVertical, Download, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
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

export default function InstallAppSection() {
  const { language } = useLanguage();
  const { brand } = useBrand();
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
    <section className="relative py-20 bg-gradient-to-b from-[#e6ebf3] to-[#f8faff] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4"
              style={{ background: `linear-gradient(to right, ${brand.secondary}, ${brand.primary})` }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {t.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{t.title}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10"
          >
            {installed ? (
              <div className="flex flex-col items-center text-center gap-3 py-6">
                <CheckCircle2 className="w-12 h-12" style={{ color: brand.primary }} />
                <p className="text-gray-700 font-medium">{t.alreadyInstalled}</p>
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
                      className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                      style={
                        platform === p
                          ? { background: `linear-gradient(to right, ${brand.secondary}, ${brand.primary})`, color: "#fff" }
                          : { backgroundColor: "#f1f3f9", color: "#6b7280" }
                      }
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
                    className="space-y-4 max-w-xl mx-auto"
                  >
                    {steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: brand.primary }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{step}</span>
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
                      style={{ background: `linear-gradient(to right, ${brand.secondary}, ${brand.primary})` }}
                    >
                      <Download className="w-5 h-5" />
                      {t.installNow}
                    </motion.button>
                  </div>
                )}

                {platform === "android" && !deferredPrompt && (
                  <div className="flex justify-center mt-8 text-gray-400">
                    <MoreVertical className="w-5 h-5" />
                  </div>
                )}
                {platform === "ios" && (
                  <div className="flex justify-center mt-8 text-gray-400">
                    <Share className="w-5 h-5" />
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
