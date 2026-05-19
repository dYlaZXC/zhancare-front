"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logosaas.png";

const STAGES = [
  { key: "lead",            label: "База клиник",           color: "#94a3b8", dim: "#334155" },
  { key: "contacted",       label: "Написали",              color: "#60a5fa", dim: "#1e3a5f" },
  { key: "responded",       label: "Ответили",              color: "#a78bfa", dim: "#3b1f6e" },
  { key: "demo",            label: "Провели демо",          color: "#fbbf24", dim: "#5c3d00" },
  { key: "negotiating",     label: "Переговоры",            color: "#fb923c", dim: "#5c2800" },
  { key: "contract_review", label: "Согласование договора", color: "#f472b6", dim: "#5c1040" },
  { key: "contract_signed", label: "Подписали договор",     color: "#22d3ee", dim: "#064e63" },
  { key: "invoiced",        label: "Выставлен счёт",        color: "#34d399", dim: "#064e3b" },
  { key: "paid",            label: "Оплачено",              color: "#4ade80", dim: "#14532d" },
  { key: "lost",            label: "Отказ",                 color: "#f87171", dim: "#450a0a" },
];

const FUNNEL = STAGES.filter(s => !["lead", "lost"].includes(s.key));

interface PublicStats {
  total_clinics: number;
  cities_covered: number;
  by_stage: Record<string, number>;
  as_of: string;
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const v = useCountUp(value);
  return <>{v}{suffix}</>;
}

export default function InvestorsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/pipeline/public-stats/`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byStage = stats?.by_stage ?? {};
  const total = stats?.total_clinics ?? 0;
  const cities = stats?.cities_covered ?? 0;
  const signedPlus = (byStage["contract_signed"] ?? 0) + (byStage["invoiced"] ?? 0) + (byStage["paid"] ?? 0);
  const activeTotal = FUNNEL.reduce((s, st) => s + (byStage[st.key] ?? 0), 0);
  const maxFunnel = Math.max(...FUNNEL.map(s => byStage[s.key] ?? 0), 1);

  const asOf = stats?.as_of
    ? new Date(stats.as_of).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg, #0e121d 0%, #1e263e 50%, #0e121d 100%)" }}>

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(#3772ff 1px,transparent 1px),linear-gradient(90deg,#3772ff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Radial glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(55,114,255,0.10) 0%, transparent 70%)" }} />

      {/* Top bar — full width */}
      <header className="relative z-10 border-b px-8 py-4 flex items-center justify-between" style={{ borderColor: "rgba(55,114,255,0.12)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="ZhanCare.AI" height={28} className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {asOf && <span className="text-xs text-white/25 hidden sm:block">Обновлено {asOf}</span>}
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 border border-white/10 px-2.5 py-1 rounded-full">
            Investor View · Read only
          </span>
        </div>
      </header>

      {/* Dashboard body — full width with side padding only */}
      <main className="relative z-10 w-full px-6 md:px-10 lg:px-14 py-10 md:py-14">

        {/* Hero row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-10" style={{ borderBottom: "1px solid rgba(55,114,255,0.1)" }}>
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] mb-5 border px-3 py-1.5 rounded-full" style={{ color: "#3772ff", borderColor: "rgba(55,114,255,0.25)", background: "rgba(55,114,255,0.07)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3772ff" }} />
              Live pipeline data
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">
              Партнёрская{" "}
              <span style={{ background: "linear-gradient(90deg, #3772ff, #ebf1ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                воронка клиник
              </span>
            </h1>
          </div>
          <p className="text-white/35 text-sm max-w-sm leading-relaxed md:text-right">
            ZhanCare.AI интегрирует медицинские клиники Казахстана в единую цифровую платформу.
            Агрегированные данные о прогрессе партнёрства.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-32">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <span className="text-white/30 text-sm">Загрузка данных…</span>
          </div>
        ) : (
          <>
            {/* Key metrics — full width, 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Клиник в базе",       value: total,       suffix: "",  color: "#bcc0ca", glow: "rgba(188,192,202,0.1)" },
                { label: "Городов охвачено",    value: cities,      suffix: "",  color: "#3772ff", glow: "rgba(55,114,255,0.15)" },
                { label: "В активной работе",   value: activeTotal, suffix: "",  color: "#ebf1ff", glow: "rgba(235,241,255,0.1)" },
                { label: "Договоров подписано", value: signedPlus,  suffix: "+", color: "#3772ff", glow: "rgba(55,114,255,0.2)" },
              ].map(({ label, value, suffix, color, glow }) => (
                <div key={label}
                  className="relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: "rgba(40,51,83,0.4)", border: "1px solid rgba(55,114,255,0.12)" }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 70%)` }} />
                  <div className="text-5xl md:text-6xl font-black tabular-nums leading-none mb-3" style={{ color }}>
                    <AnimatedNumber value={value} suffix={suffix} />
                  </div>
                  <div className="text-xs font-medium leading-snug" style={{ color: "#bcc0ca" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Two-column dashboard row: funnel left, stage grid right */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">

              {/* Funnel panel */}
              <div className="rounded-2xl p-7" style={{ background: "rgba(40,51,83,0.3)", border: "1px solid rgba(55,114,255,0.1)" }}>
                <div className="flex items-center justify-between mb-7">
                  <h2 className="text-base font-bold text-white/80">Воронка партнёрства</h2>
                  <span className="text-xs text-white/25">{activeTotal} клиник в работе</span>
                </div>
                <div className="space-y-2.5">
                  {FUNNEL.map((stage) => {
                    const count = byStage[stage.key] ?? 0;
                    const pct = Math.round((count / maxFunnel) * 100);
                    return (
                      <div key={stage.key} className="flex items-center gap-4 group">
                        <div className="w-36 text-xs text-white/40 group-hover:text-white/70 transition-colors shrink-0 font-medium">
                          {stage.label}
                        </div>
                        <div className="flex-1 relative h-8 rounded-lg overflow-hidden" style={{ background: stage.dim }}>
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
                            style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: `linear-gradient(90deg, ${stage.color}aa, ${stage.color})` }}
                          />
                          {count > 0 && (
                            <span className="absolute right-3 inset-y-0 flex items-center text-xs font-bold text-white/80 tabular-nums">
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage grid panel */}
              <div className="rounded-2xl p-7" style={{ background: "rgba(40,51,83,0.3)", border: "1px solid rgba(55,114,255,0.1)" }}>
                <h2 className="text-base font-bold text-white/80 mb-7">Распределение по этапам</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
                  {STAGES.map((stage) => {
                    const count = byStage[stage.key] ?? 0;
                    return (
                      <div key={stage.key}
                        className="relative rounded-xl p-4 overflow-hidden group transition-all duration-300 hover:scale-[1.03]"
                        style={{ background: `linear-gradient(135deg, ${stage.dim}90, rgba(40,51,83,0.5))`, border: `1px solid rgba(55,114,255,0.1)` }}>
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${stage.color}60, transparent)` }} />
                        <div className="text-3xl font-black tabular-nums mb-1.5" style={{ color: stage.color }}>
                          {count > 0 ? <AnimatedNumber value={count} /> : <span className="text-white/20">—</span>}
                        </div>
                        <div className="text-[10px] text-white/40 leading-snug font-medium">{stage.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer disclaimer */}
            <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(55,114,255,0.1)" }}>
              <p className="text-xs max-w-lg leading-relaxed" style={{ color: "#bcc0ca", opacity: 0.5 }}>
                Данные носят агрегированный характер. Названия клиник и контактная информация не раскрываются.
                Предназначено для партнёров и инвесторов ZhanCare.AI.
              </p>
              <Link href="mailto:hello@zhan.care"
                className="text-xs whitespace-nowrap transition-colors"
                style={{ color: "#3772ff" }}
                onMouseOver={e => (e.currentTarget.style.color = "#3267e6")}
                onMouseOut={e => (e.currentTarget.style.color = "#3772ff")}>
                hello@zhan.care →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
