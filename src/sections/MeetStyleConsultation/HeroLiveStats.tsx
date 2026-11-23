"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { Bot, Building2, Stethoscope, UserRound } from "lucide-react";
import { useBrand } from "@/context/BrandContext";

/**
 * Hero "live stats" strip — replaces the generic feature cards and the
 * unverifiable trust badges ("500+ консультаций", "4.9/5"). Every number
 * here comes from /public/stats/ (real DB counts, cached 5 min server-side);
 * if the request fails the block simply doesn't render.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

type Lang = "ru" | "kz" | "en" | "uz";

interface Stats {
  doctors: number;
  doctors_online: number;
  clinics: number;
  specialties_count: number;
  specialties: string[];
}

const pluralRu = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const TEXT: Record<Lang, {
  online: (n: number) => string;
  doctors: string; specialties: string; clinics: string; ai: string; aiValue: string;
}> = {
  ru: {
    online: (n) => `${n} ${pluralRu(n, ["врач", "врача", "врачей"])} сейчас на связи`,
    doctors: "врачей на платформе", specialties: "специальностей", clinics: "клиник-партнёров",
    ai: "первый ответ ИИ", aiValue: "10 сек",
  },
  kz: {
    online: (n) => `${n} дәрігер қазір желіде`,
    doctors: "платформадағы дәрігерлер", specialties: "мамандық", clinics: "серіктес клиника",
    ai: "ЖИ-дің алғашқы жауабы", aiValue: "10 сек",
  },
  en: {
    online: (n) => `${n} ${n === 1 ? "doctor" : "doctors"} online now`,
    doctors: "doctors on the platform", specialties: "specialties", clinics: "partner clinics",
    ai: "first AI reply", aiValue: "10 sec",
  },
  uz: {
    online: (n) => `${n} ta shifokor hozir onlayn`,
    doctors: "platformadagi shifokorlar", specialties: "mutaxassislik", clinics: "hamkor klinikalar",
    ai: "AI birinchi javobi", aiValue: "10 son",
  },
};

function CountUp({ to, start }: { to: number; start: boolean }) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!start) return;
    if (reduce) { setValue(to); return; }
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, start, reduce]);
  return <>{value}</>;
}

export default function HeroLiveStats({ language }: { language: string }) {
  const { brand } = useBrand();
  const reduce = useReducedMotion();
  const lang: Lang = (["ru", "kz", "en", "uz"].includes(language) ? language : "ru") as Lang;
  const t = TEXT[lang];
  const [stats, setStats] = useState<Stats | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    let alive = true;
    // uz has no specialization names in the DB — show Russian ones.
    const apiLang = lang === "uz" ? "ru" : lang;
    fetch(`${API}/public/stats/?lang=${apiLang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d || !(d.doctors > 0)) return;
        // Older backends return only {doctors, patients, consultations} —
        // normalise so missing fields hide their cell instead of crashing.
        const specialties: string[] = Array.isArray(d.specialties) ? d.specialties : [];
        setStats({
          doctors: Number(d.doctors) || 0,
          doctors_online: Number(d.doctors_online) || 0,
          clinics: Number(d.clinics) || 0,
          specialties_count: Number(d.specialties_count) || specialties.length,
          specialties,
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [lang]);

  if (!stats) return <div ref={ref} className="min-h-[220px]" aria-hidden="true" />;

  const cells = [
    { icon: UserRound, value: <CountUp to={stats.doctors} start={inView} />, label: t.doctors, show: true },
    { icon: Stethoscope, value: <CountUp to={stats.specialties_count} start={inView} />, label: t.specialties, show: stats.specialties_count > 0 },
    { icon: Building2, value: <CountUp to={stats.clinics} start={inView} />, label: t.clinics, show: stats.clinics > 0 },
    { icon: Bot, value: t.aiValue, label: t.ai, show: true },
  ].filter((c) => c.show);
  const cols = cells.length === 4 ? "grid-cols-2 md:grid-cols-4" : cells.length === 3 ? "grid-cols-3" : "grid-cols-2";

  // Two copies back-to-back → seamless infinite scroll at x: 0 → -50%.
  const marquee = [...stats.specialties, ...stats.specialties];

  return (
    <div ref={ref} className="max-w-4xl mx-auto">
      {/* Live "doctors online" pill */}
      {stats.doctors_online > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex justify-center mb-5"
        >
          <div className="inline-flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-300/25 backdrop-blur-md shadow-[0_0_30px_rgba(52,211,153,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-emerald-100">
              <CountUp to={stats.doctors_online} start={inView} />
              {t.online(stats.doctors_online).replace(/^\d+/, "")}
            </span>
          </div>
        </motion.div>
      )}

      {/* Glass stats panel with a slowly rotating gradient border */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.7, type: "spring", stiffness: 90 }}
        className="relative rounded-3xl p-px overflow-hidden"
      >
        <motion.div
          aria-hidden="true"
          className="absolute -inset-[100%]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${brand.primary} 60deg, #a5b4fc 120deg, transparent 180deg, transparent 360deg)`,
          }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative rounded-3xl bg-[#0b1020]/80 backdrop-blur-xl">
          <div className={`grid ${cols}`}>
            {cells.map((c, i) => (
              <div
                key={i}
                className={`group relative px-4 py-6 md:py-7 text-center border-white/10
                  ${cells.length === 4
                    ? `${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`
                    : i > 0 ? "border-l" : ""}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(99,130,255,0.18),transparent_70%)]" />
                <c.icon className="relative mx-auto mb-2 h-5 w-5 text-[#9db4ff]" strokeWidth={2} />
                <div
                  className="relative text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent tabular-nums"
                  style={{ backgroundImage: "linear-gradient(180deg, #ffffff 0%, #c1d3ff 100%)" }}
                >
                  {c.value}
                </div>
                <div className="relative mt-1 text-xs md:text-sm text-gray-400 leading-snug">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Infinite specialties marquee */}
          {stats.specialties.length > 0 && (
            <div
              className="relative border-t border-white/10 py-3 overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              }}
            >
              <motion.div
                className="flex w-max gap-2.5"
                animate={reduce ? undefined : { x: ["0%", "-50%"] }}
                transition={{ duration: Math.max(20, stats.specialties.length * 3), repeat: Infinity, ease: "linear" }}
              >
                {marquee.map((name, i) => (
                  <span
                    key={i}
                    aria-hidden={i >= stats.specialties.length}
                    className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-200 bg-white/[0.06] border border-white/10"
                  >
                    {name}
                  </span>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
