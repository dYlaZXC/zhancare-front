"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { Bell, Download, CheckCircle2, Zap, Smartphone, Apple, Bot } from "lucide-react";
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
// src/app/HomeClient.tsx so the dark sections read as one system.
const ACCENT = "#3772ff";
const CARD_BORDER = "rgba(55,114,255,0.14)";
const TEXT_MUTED = "#bcc0ca";
const TEXT_BRIGHT = "#ebf1ff";
const BENEFIT_ICONS = [Bell, Zap, Smartphone];

/** Phone mockup: real screen recording of the installed app + a push notification sliding in. */
function PhoneMockup({ title, body }: { title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Only fetch the video once the phone is near the viewport.
  const inView = useInView(ref, { once: true, margin: "200px" });
  return (
    <div ref={ref} className="relative mx-auto w-[280px] h-[580px] lg:w-[330px] lg:h-[700px]">
      {/* glow behind the phone */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-60 rounded-full"
           style={{ background: "radial-gradient(circle, rgba(55,114,255,0.45) 0%, transparent 65%)" }} />
      {/* frame */}
      <div className="absolute inset-0 rounded-[44px] lg:rounded-[52px] p-[10px] lg:p-[12px] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
           style={{ background: "linear-gradient(145deg, #2a3142, #0d1018)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative h-full w-full rounded-[36px] lg:rounded-[42px] overflow-hidden bg-[#0f172a]">
          {inView && (
            <video
              src="/video_app.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="ZhanCare.AI на главном экране телефона"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* dynamic island */}
          <div className="absolute top-2.5 lg:top-3 left-1/2 -translate-x-1/2 w-24 h-6 lg:w-28 lg:h-7 rounded-full bg-black z-20" />

          {/* push notification */}
          <motion.div
            className="absolute left-3 right-3 top-12 lg:top-14 z-10 rounded-2xl p-3 backdrop-blur-xl shadow-lg"
            style={{ background: "rgba(30,38,62,0.55)", border: "1px solid rgba(255,255,255,0.18)" }}
            initial={{ y: -90, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 140, damping: 16 }}
          >
            <div className="flex items-start gap-2.5">
              <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg shrink-0" />
              <div className="min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-white truncate">{title}</p>
                  <span className="text-[10px] text-white/60 shrink-0">now</span>
                </div>
                <p className="text-[11px] leading-snug text-white/90 mt-0.5">{body}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function InstallAppSection() {
  const { language } = useLanguage();
  const reduce = useReducedMotion();
  const t = (language === "en" ? en : language === "kz" ? kz : language === "uz" ? uz : ru).installApp;

  const [platform, setPlatform] = useState<Platform>("android");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [activeStep, setActiveStep] = useState(0);

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

  const steps = platform === "ios" ? t.iosSteps : t.androidSteps;

  // Walk through the steps so the eye follows the order.
  useEffect(() => {
    setActiveStep(0);
    if (reduce) return;
    const id = setInterval(() => setActiveStep((s) => (s + 1) % steps.length), 2600);
    return () => clearInterval(id);
  }, [platform, steps.length, reduce]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <section
      className="py-20 px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0e121d 0%, #131928 100%)",
        boxShadow:
          "inset 0 40px 80px rgba(0,0,0,0.6), inset 0 -40px 80px rgba(0,0,0,0.6), inset 60px 0 100px rgba(0,0,0,0.4), inset -60px 0 100px rgba(0,0,0,0.4)",
      }}
    >
      {/* ambient blobs */}
      <div className="absolute -top-24 right-[10%] w-[420px] h-[420px] rounded-full blur-3xl opacity-25 pointer-events-none"
           style={{ background: "radial-gradient(circle, #3772ff, transparent 70%)" }} />
      <div className="absolute -bottom-32 left-[5%] w-[380px] h-[380px] rounded-full blur-3xl opacity-20 pointer-events-none"
           style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />

      <div className="max-w-6xl mx-auto relative grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
        {/* LEFT — copy, platform switch, steps */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(55,114,255,0.1)", border: `1px solid ${CARD_BORDER}` }}
          >
            <Download className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#8fb0ff" }}>{t.badge}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-3xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: TEXT_BRIGHT }}
          >
            {t.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg mb-7 max-w-xl"
            style={{ color: TEXT_MUTED }}
          >
            {t.subtitle}
          </motion.p>

          {/* benefits */}
          <div className="flex flex-wrap gap-2.5 mb-9">
            {t.benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[i] ?? Bot;
              return (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #3772ff, #2956bf)" }}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-sm" style={{ color: TEXT_BRIGHT }}>{b}</span>
                </motion.div>
              );
            })}
          </div>

          {installed ? (
            <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
                 style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <p className="font-medium text-emerald-100">{t.alreadyInstalled}</p>
            </div>
          ) : (
            <div className="rounded-3xl p-5 md:p-6"
                 style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${CARD_BORDER}` }}>
              {/* segmented platform switch with sliding pill */}
              <div className="relative inline-flex p-1 rounded-2xl mb-6"
                   style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {(["android", "ios"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className="relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{ color: platform === p ? "#fff" : TEXT_MUTED }}
                  >
                    {platform === p && (
                      <motion.span
                        layoutId="install-platform-pill"
                        className="absolute inset-0 -z-10 rounded-xl"
                        style={{ background: "linear-gradient(135deg, #3772ff, #2956bf)", boxShadow: "0 6px 20px rgba(55,114,255,0.45)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {p === "android" ? <Bot className="w-4 h-4" /> : <Apple className="w-4 h-4" />}
                    {p === "android" ? t.androidTabLabel : t.iosTabLabel}
                  </button>
                ))}
              </div>

              {/* timeline steps */}
              <AnimatePresence mode="wait">
                <motion.ol
                  key={platform}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="relative"
                >
                  {/* connector line */}
                  <div className="absolute left-[17px] top-5 bottom-5 w-px"
                       style={{ background: "linear-gradient(180deg, rgba(55,114,255,0.6), rgba(55,114,255,0.08))" }} />
                  {steps.map((step, i) => {
                    const active = i === activeStep;
                    const done = i < activeStep;
                    return (
                      <li
                        key={i}
                        onMouseEnter={() => setActiveStep(i)}
                        className="relative flex items-start gap-4 py-2.5 cursor-default"
                      >
                        <motion.span
                          className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          animate={{
                            scale: active ? 1.08 : 1,
                            boxShadow: active ? "0 0 0 6px rgba(55,114,255,0.18), 0 0 24px rgba(55,114,255,0.6)" : "0 0 0 0 rgba(0,0,0,0)",
                          }}
                          style={{
                            background: active || done ? "linear-gradient(135deg, #3772ff, #2956bf)" : "#141a2b",
                            border: `1px solid ${active || done ? "transparent" : "rgba(55,114,255,0.3)"}`,
                            color: active || done ? "#fff" : "#8fb0ff",
                          }}
                        >
                          {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </motion.span>
                        <div className="pt-1.5">
                          <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5"
                             style={{ color: active ? "#8fb0ff" : "rgba(188,192,202,0.5)" }}>
                            {t.stepLabel} {i + 1}
                          </p>
                          <p className="text-sm md:text-[15px] leading-relaxed transition-colors duration-300"
                             style={{ color: active ? TEXT_BRIGHT : TEXT_MUTED }}>
                            {step}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </motion.ol>
              </AnimatePresence>

              {platform === "android" && deferredPrompt && (
                <motion.button
                  onClick={handleInstallClick}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #3772ff, #2956bf)", boxShadow: "0 10px 30px rgba(55,114,255,0.45)" }}
                >
                  <Download className="w-5 h-5" />
                  {t.installNow}
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -3 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", stiffness: 70 }}
          className="hidden md:block"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <PhoneMockup title={t.notifTitle} body={t.notifBody} />
          </motion.div>
        </motion.div>
      </div>

      {/* left/right edge fade — bowl rim, matches the SEO strip below it */}
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.45), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.45), transparent)" }} />
    </section>
  );
}
