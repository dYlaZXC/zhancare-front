"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import {
  UserPlus, CalendarCheck, FlaskConical, CheckCircle2,
  RefreshCw, Route,
} from "lucide-react";
import { BRAND, COLORS, SectionTitle, KPICard } from "./dashboardUI";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SourceJourney {
  source: string;
  source_label: string;
  registered: number;
  booked_visit: number;
  referred_diagnostics: number;
  completed_visit: number;
  booked_rate: number;
  diagnostics_rate: number;
  completed_rate: number;
}

interface JourneyData {
  by_source: SourceJourney[];
  totals: {
    registered: number;
    booked_visit: number;
    referred_diagnostics: number;
    completed_visit: number;
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniFunnel({ stages }: { stages: { label: string; count: number; rate: number }[] }) {
  const max = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-32 text-right flex-shrink-0">{s.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2.5 transition-all duration-700"
              style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 4 : 0)}%`, background: COLORS[i % COLORS.length] }}
            >
              {s.count > 0 && <span className="text-white text-[11px] font-bold">{s.count}</span>}
            </div>
          </div>
          <span className="text-xs font-bold text-gray-700 w-11 flex-shrink-0 text-right">{s.rate}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PatientJourneyView({ user }: { user: any }) {
  const today = new Date().toISOString().split("T")[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get<JourneyData>(`/reports/patient-journey/?start=${startDate}&end=${endDate}`);
      setData(res.data);
    } catch (err) {
      console.error("Patient journey fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: BRAND }} />
        <p className="text-gray-500 font-medium animate-pulse">Загрузка пути пациента...</p>
      </div>
    );
  }

  if (!data) return null;

  const { totals, by_source } = data;
  const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 1000) / 10 : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Date range + refresh */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <span className="text-gray-300 text-sm">—</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <button onClick={() => fetchData(true)}
          className="p-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="Обновить">
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Зарегистрировано" value={totals.registered.toLocaleString("ru-RU")}
          icon={UserPlus} color="#3772ff" />
        <KPICard label="Записались на приём" value={totals.booked_visit.toLocaleString("ru-RU")}
          sub={`${pct(totals.booked_visit, totals.registered)}% от зарегистрированных`}
          icon={CalendarCheck} color="#8b5cf6" />
        <KPICard label="Направлены на диагностику" value={totals.referred_diagnostics.toLocaleString("ru-RU")}
          sub={`${pct(totals.referred_diagnostics, totals.registered)}% от зарегистрированных`}
          icon={FlaskConical} color="#f59e0b" />
        <KPICard label="Прошли приём" value={totals.completed_visit.toLocaleString("ru-RU")}
          sub={`${pct(totals.completed_visit, totals.registered)}% от зарегистрированных`}
          icon={CheckCircle2} color="#10b981" />
      </div>

      {/* Per-source funnel */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <SectionTitle>Воронка по источникам привлечения</SectionTitle>

        {by_source.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Route className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Нет данных за выбранный период</p>
            <p className="text-sm text-gray-400 mt-1">Измените диапазон дат или дождитесь новых регистраций</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {by_source.map((s) => (
              <div key={s.source} className="rounded-2xl border-2 border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">{s.source_label}</span>
                  <span className="text-xs font-semibold text-gray-400">{s.registered} чел.</span>
                </div>
                <MiniFunnel stages={[
                  { label: "Зарегистрировано", count: s.registered, rate: 100 },
                  { label: "Записались", count: s.booked_visit, rate: s.booked_rate },
                  { label: "На диагностику", count: s.referred_diagnostics, rate: s.diagnostics_rate },
                  { label: "Прошли приём", count: s.completed_visit, rate: s.completed_rate },
                ]} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
