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

interface CityCount { city_name: string; count: number; }

interface PublicStats {
  total_clinics: number;
  cities_covered: number;
  top_cities: CityCount[];
  by_stage: Record<string, number>;
  active_total: number;
  signed_plus: number;
  win_rate: number;
  lead_to_deal_pct: number;
  outreach_response_pct: number;
  demo_to_deal_pct: number;
  added_this_month: number;
  added_last_month: number;
  mom_growth_pct: number | null;
  active_7d: number;
  active_30d: number;
  as_of: string;
}

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function Num({ v, suffix = "" }: { v: number; suffix?: string }) {
  const n = useCountUp(v);
  return <>{n}{suffix}</>;
}

function MomBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-white/20 text-xs">н/д</span>;
  const up = pct >= 0;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
      color: up ? "#4ade80" : "#f87171",
      background: up ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
    }}>
      {up ? "+" : ""}{pct}% MoM
    </span>
  );
}

function RatioBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  );
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

  const s = stats;
  const byStage = s?.by_stage ?? {};
  const maxFunnel = Math.max(...FUNNEL.map(st => byStage[st.key] ?? 0), 1);
  const maxCity = Math.max(...(s?.top_cities ?? []).map(c => c.count), 1);

  const asOf = s?.as_of
    ? new Date(s.as_of).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg, #0e121d 0%, #1e263e 50%, #0e121d 100%)" }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#3772ff 1px,transparent 1px),linear-gradient(90deg,#3772ff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(55,114,255,0.08) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="relative z-10 border-b px-8 py-4 flex items-center justify-between" style={{ borderColor: "rgba(55,114,255,0.12)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="ZhanCare.AI" height={28} className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {asOf && <span className="text-xs text-white/20 hidden sm:block">Данные на {asOf}</span>}
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 border border-white/10 px-2.5 py-1 rounded-full">
            Investor View · Read only
          </span>
        </div>
      </header>

      <main className="relative z-10 w-full px-6 md:px-10 lg:px-14 py-10 md:py-14">

        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-10"
          style={{ borderBottom: "1px solid rgba(55,114,255,0.1)" }}>
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] mb-5 border px-3 py-1.5 rounded-full"
              style={{ color: "#3772ff", borderColor: "rgba(55,114,255,0.25)", background: "rgba(55,114,255,0.07)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3772ff" }} />
              Live pipeline data
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">
              Партнёрская{" "}
              <span style={{ background: "linear-gradient(90deg, #3772ff, #ebf1ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", paddingRight: "0.08em" }}>
                воронка клиник
              </span>
            </h1>
          </div>
          <p className="text-white/30 text-sm max-w-sm leading-relaxed md:text-right">
            ZhanCare.AI интегрирует медицинские клиники Казахстана в единую цифровую платформу.
            Агрегированные данные о прогрессе партнёрства.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-40">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
            <span className="text-white/30 text-sm">Загрузка данных…</span>
          </div>
        ) : (
          <>
            {/* ── Row 1: 6 primary KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {[
                { label: "Клиник в базе",       value: s?.total_clinics ?? 0,  suffix: "",  color: "#bcc0ca" },
                { label: "Городов охвачено",    value: s?.cities_covered ?? 0, suffix: "",  color: "#3772ff" },
                { label: "В активной работе",   value: s?.active_total ?? 0,   suffix: "",  color: "#ebf1ff" },
                { label: "Договоров подписано", value: s?.signed_plus ?? 0,    suffix: "+", color: "#22d3ee" },
                { label: "Добавлено за месяц",  value: s?.added_this_month ?? 0, suffix: "", color: "#4ade80" },
                { label: "Активны за 7 дней",   value: s?.active_7d ?? 0,     suffix: "",  color: "#fbbf24" },
              ].map(({ label, value, suffix, color }) => (
                <div key={label} className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: "rgba(40,51,83,0.4)", border: "1px solid rgba(55,114,255,0.12)" }}>
                  <div className="text-4xl font-black tabular-nums leading-none mb-2" style={{ color }}>
                    <Num v={value} suffix={suffix} />
                  </div>
                  <div className="text-[11px] font-medium leading-snug text-white/40">{label}</div>
                </div>
              ))}
            </div>

            {/* ── Row 2: conversion ratios ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Win Rate",               pct: s?.win_rate ?? 0,               color: "#4ade80", hint: "Оплачено / (оплачено + отказ)" },
                { label: "Lead → Deal",            pct: s?.lead_to_deal_pct ?? 0,        color: "#3772ff", hint: "Договоров от всей базы" },
                { label: "Outreach → Ответ",       pct: s?.outreach_response_pct ?? 0,   color: "#a78bfa", hint: "Из написавших — ответили" },
                { label: "Демо → Договор",         pct: s?.demo_to_deal_pct ?? 0,        color: "#fbbf24", hint: "Из демо — дошли до договора" },
              ].map(({ label, pct, color, hint }) => (
                <div key={label} className="rounded-2xl p-5"
                  style={{ background: "rgba(40,51,83,0.35)", border: "1px solid rgba(55,114,255,0.1)" }}>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-xs text-white/40 font-medium">{label}</span>
                    <span className="text-2xl font-black tabular-nums" style={{ color }}>{pct}%</span>
                  </div>
                  <RatioBar pct={pct} color={color} />
                  <p className="text-[10px] text-white/20 mt-2">{hint}</p>
                </div>
              ))}
            </div>

            {/* ── Row 3: funnel + cities + activity ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

              {/* Funnel — spans 2 cols */}
              <div className="xl:col-span-2 rounded-2xl p-7" style={{ background: "rgba(40,51,83,0.3)", border: "1px solid rgba(55,114,255,0.1)" }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-white/70">Воронка партнёрства</h2>
                  <span className="text-xs text-white/25">{s?.active_total ?? 0} клиник в работе</span>
                </div>
                <div className="space-y-2">
                  {FUNNEL.map((stage) => {
                    const count = byStage[stage.key] ?? 0;
                    const pct = Math.round((count / maxFunnel) * 100);
                    const fromTotal = s?.total_clinics ? Math.round(count / s.total_clinics * 100) : 0;
                    return (
                      <div key={stage.key} className="flex items-center gap-3 group">
                        <div className="w-40 text-xs text-white/35 group-hover:text-white/65 transition-colors shrink-0">{stage.label}</div>
                        <div className="flex-1 relative h-7 rounded-lg overflow-hidden" style={{ background: stage.dim }}>
                          <div className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
                            style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: `linear-gradient(90deg, ${stage.color}99, ${stage.color})` }} />
                          {count > 0 && (
                            <span className="absolute right-3 inset-y-0 flex items-center text-xs font-bold text-white/80 tabular-nums">{count}</span>
                          )}
                        </div>
                        <div className="w-10 text-right text-[11px] tabular-nums shrink-0" style={{ color: stage.color }}>{fromTotal}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cities + MoM */}
              <div className="flex flex-col gap-5">

                {/* Top cities */}
                <div className="flex-1 rounded-2xl p-6" style={{ background: "rgba(40,51,83,0.3)", border: "1px solid rgba(55,114,255,0.1)" }}>
                  <h2 className="text-sm font-bold text-white/70 mb-5">Топ городов</h2>
                  <div className="space-y-3">
                    {(s?.top_cities ?? []).map((city) => {
                      const pct = Math.round((city.count / maxCity) * 100);
                      return (
                        <div key={city.city_name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/50">{city.city_name || "Не указан"}</span>
                            <span className="text-white/70 font-semibold tabular-nums">{city.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(55,114,255,0.1)" }}>
                            <div className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3772ff88, #3772ff)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly growth card */}
                <div className="rounded-2xl p-6" style={{ background: "rgba(40,51,83,0.3)", border: "1px solid rgba(55,114,255,0.1)" }}>
                  <h2 className="text-sm font-bold text-white/70 mb-4">Прирост клиник</h2>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-3xl font-black tabular-nums" style={{ color: "#4ade80" }}>
                        <Num v={s?.added_this_month ?? 0} />
                      </div>
                      <div className="text-[11px] text-white/30 mt-1">этот месяц</div>
                    </div>
                    <div className="text-right">
                      <MomBadge pct={s?.mom_growth_pct ?? null} />
                      <div className="text-xs text-white/25 mt-2">прошлый: {s?.added_last_month ?? 0}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/30">Активны за 30д</span>
                      <span className="text-white/60 font-semibold">{s?.active_30d ?? 0}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Row 4: stage tiles full width ── */}
            <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(40,51,83,0.25)", border: "1px solid rgba(55,114,255,0.08)" }}>
              <h2 className="text-sm font-bold text-white/70 mb-5">Распределение по всем этапам</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                {STAGES.map((stage) => {
                  const count = byStage[stage.key] ?? 0;
                  const pct = s?.total_clinics ? Math.round(count / s.total_clinics * 100) : 0;
                  return (
                    <div key={stage.key} className="relative rounded-xl p-3 overflow-hidden transition-all duration-300 hover:scale-[1.04]"
                      style={{ background: `${stage.dim}99`, border: `1px solid ${stage.color}22` }}>
                      <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${stage.color}80, transparent)` }} />
                      <div className="text-2xl font-black tabular-nums mb-0.5" style={{ color: stage.color }}>
                        {count > 0 ? <Num v={count} /> : <span className="text-white/15">—</span>}
                      </div>
                      <div className="text-[9px] text-white/35 leading-tight font-medium mb-1">{stage.label}</div>
                      {count > 0 && <div className="text-[10px] font-bold" style={{ color: `${stage.color}99` }}>{pct}%</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ borderTop: "1px solid rgba(55,114,255,0.08)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "#bcc0ca", opacity: 0.4 }}>
                Данные носят агрегированный характер. Названия клиник и контактная информация не раскрываются.
                Предназначено для партнёров и инвесторов ZhanCare.AI.
              </p>
              <Link href="mailto:hello@zhan.care" className="text-xs whitespace-nowrap transition-colors"
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
