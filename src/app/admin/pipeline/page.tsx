"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, List, Search, Map, BarChart2,
  Instagram, Phone, Globe, MessageCircle, ChevronDown,
  MapPin, Star, RefreshCw, X, Edit3, Check, ExternalLink, Upload, Flame,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Clinic {
  id: number;
  name: string;
  description?: string;
  address?: string;
  district_name?: string;
  working_hours?: string;
  rating?: number;
  review_count?: number;
  phones?: string[];
  emails?: string[];
  websites?: string[];
  instagram?: string;
  facebook?: string;
  whatsapp?: string[];
  telegram?: string[];
  has_instagram: boolean;
  is_private: boolean;
  priority?: "A" | "B" | "C" | null;
  priority_display?: string;
  priority_reason?: string;
  recommended_channel?: string;
  pipeline_stage: string;
  pipeline_stage_display: string;
  next_step?: string;
  next_step_date?: string;
  responsible?: string;
  sales_comment?: string;
  categories?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

interface Stats {
  total: number;
  has_instagram: number;
  is_private: number;
  by_stage: Record<string, number>;
  by_priority: Record<string, number>;
  by_district: Array<{ district__name_ru: string; total: number; a: number }>;
  by_city: string[];
}

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES = [
  { key: "lead",            label: "База клиник",           color: "#94a3b8", bg: "bg-slate-100",   text: "text-slate-700",   border: "border-slate-300" },
  { key: "contacted",       label: "Написали",              color: "#3b82f6", bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-300" },
  { key: "responded",       label: "Ответили",              color: "#8b5cf6", bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-300" },
  { key: "demo",            label: "Провели демо",          color: "#f59e0b", bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-300" },
  { key: "negotiating",     label: "Переговоры",            color: "#f97316", bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-300" },
  { key: "contract_review", label: "Согласовывают договор", color: "#ec4899", bg: "bg-pink-50",     text: "text-pink-700",    border: "border-pink-300" },
  { key: "contract_signed", label: "Подписали договор",     color: "#06b6d4", bg: "bg-cyan-50",     text: "text-cyan-700",    border: "border-cyan-300" },
  { key: "invoiced",        label: "Оплачивает счёт",       color: "#10b981", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-300" },
  { key: "paid",            label: "Оплатил",               color: "#22c55e", bg: "bg-green-50",    text: "text-green-700",   border: "border-green-400" },
  { key: "lost",            label: "Отказ",                 color: "#ef4444", bg: "bg-red-50",      text: "text-red-700",     border: "border-red-300" },
];

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  A: { label: "A — высокий", bg: "bg-red-100",    text: "text-red-700" },
  B: { label: "B — средний", bg: "bg-yellow-100", text: "text-yellow-700" },
  C: { label: "C — низкий",  bg: "bg-gray-100",   text: "text-gray-600" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) return null;
  const cfg = PRIORITY_CONFIG[priority];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGES.find(s => s.key === stage);
  if (!cfg) return <span className="text-xs text-gray-500">{stage}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Clinic card (kanban) ──────────────────────────────────────────────────────

function ClinicKanbanCard({ clinic, onStageChange }: { clinic: Clinic; onStageChange: (id: number, stage: string) => void }) {
  const [open, setOpen] = useState(false);
  const [stageMenu, setStageMenu] = useState(false);

  const firstPhone = clinic.phones?.[0];
  const firstTelegram = clinic.telegram?.[0];
  const firstWhatsapp = Array.isArray(clinic.whatsapp) ? clinic.whatsapp[0] : clinic.whatsapp;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-3 space-y-2 cursor-default">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{clinic.name}</p>
          {clinic.district_name && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{clinic.district_name}
            </p>
          )}
        </div>
        <PriorityBadge priority={clinic.priority} />
      </div>

      {/* Description */}
      {clinic.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{clinic.description}</p>
      )}

      {/* Contact icons */}
      <div className="flex items-center gap-2 flex-wrap">
        {clinic.instagram && (
          <a href={clinic.instagram} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-[10px] text-pink-600 hover:text-pink-700 font-medium">
            <Instagram className="w-3 h-3" />Instagram
          </a>
        )}
        {firstPhone && (
          <a href={`tel:${firstPhone}`}
             className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium">
            <Phone className="w-3 h-3" />{firstPhone.slice(0, 15)}
          </a>
        )}
        {firstTelegram && (
          <a href={firstTelegram} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-700 font-medium">
            <MessageCircle className="w-3 h-3" />Telegram
          </a>
        )}
        {clinic.websites?.[0] && (
          <a href={clinic.websites[0]} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 font-medium">
            <Globe className="w-3 h-3" />Сайт
          </a>
        )}
      </div>

      {/* Rating */}
      {clinic.rating != null && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
          {clinic.rating} · {clinic.review_count ?? 0} отзывов
        </div>
      )}

      {/* Next step */}
      {clinic.next_step && (
        <p className="text-[10px] text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1 line-clamp-1">
          → {clinic.next_step}
        </p>
      )}

      {/* Stage change */}
      <div className="relative">
        <button
          onClick={() => setStageMenu(v => !v)}
          className="w-full flex items-center justify-between text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
        >
          <span>Переместить</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {stageMenu && (
          <div className="absolute bottom-full left-0 mb-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-56 overflow-y-auto">
            {STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => { onStageChange(clinic.id, s.key); setStageMenu(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 ${s.key === clinic.pipeline_stage ? 'font-bold text-blue-600' : 'text-gray-700'}`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function PipelinePage() {
  const { user } = useAuth();
  const isSuperAdmin = !!(user?.profiles?.admin as any)?.is_super_admin;

  const [view, setView] = useState<"kanban" | "table" | "map" | "analytics">("kanban");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStage, setEditStage] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/pipeline/stats/");
      setStats(data);
    } catch {}
  }, []);

  const fetchClinics = useCallback(async (p: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const pageSize = view === "map" ? 2000 : PAGE_SIZE;
      const params: Record<string, string | number> = { page: p, page_size: pageSize };
      if (search)         params.search   = search;
      if (filterPriority) params.priority = filterPriority;
      if (filterDistrict) params.district = filterDistrict;
      if (filterStage)    params.stage    = filterStage;
      if (filterCity)     params.city     = filterCity;
      const { data } = await api.get("/pipeline/", { params });
      setClinics(prev => append ? [...prev, ...data.results] : data.results);
      setCurrentPage(p);
      setHasMore(p < data.pages);
    } catch {}
    if (append) setLoadingMore(false); else setLoading(false);
  }, [view, search, filterPriority, filterDistrict, filterStage, filterCity]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchClinics(1); }, [fetchClinics]);

  // Infinite scroll — only for kanban/table views
  useEffect(() => {
    if (view === "map" || view === "analytics") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchClinics(currentPage + 1, true);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, currentPage, fetchClinics, view]);

  const handleStageChange = async (clinicId: number, newStage: string) => {
    try {
      await api.patch(`/pipeline/${clinicId}/`, { pipeline_stage: newStage });
      setClinics(prev => prev.map(c => c.id === clinicId
        ? { ...c, pipeline_stage: newStage, pipeline_stage_display: STAGES.find(s => s.key === newStage)?.label ?? newStage }
        : c
      ));
      fetchStats();
    } catch (e) {
      console.error("Stage update failed", e);
    }
  };

  // Group clinics by stage for kanban
  const byStage = STAGES.reduce((acc, s) => {
    acc[s.key] = clinics.filter(c => c.pipeline_stage === s.key);
    return acc;
  }, {} as Record<string, Clinic[]>);

  const priorityOptions = ["A", "B", "C"];
  const districtOptions = stats?.by_district.map(d => d.district__name_ru).filter(Boolean) ?? [];
  const cityOptions = stats?.by_city ?? [];

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl">🔒</div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Нет доступа</h2>
          <p className="text-sm text-gray-500 mt-1">Pipeline клиник доступен только супер-администраторам</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Pipeline клиник
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats?.total ?? "—"} клиник · управление этапами продаж
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Импорт Excel
          </button>
          <button
            onClick={() => { fetchClinics(1); fetchStats(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            {([
              { key: "kanban",    icon: <LayoutGrid className="w-4 h-4" />, label: "Канбан" },
              { key: "table",     icon: <List className="w-4 h-4" />,       label: "Таблица" },
              { key: "map",       icon: <Map className="w-4 h-4" />,        label: "Карта" },
              { key: "analytics", icon: <BarChart2 className="w-4 h-4" />,  label: "Аналитика" },
            ] as const).map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {stats && view !== "map" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Всего клиник"     value={stats.total}                         color="text-gray-900" />
          <StatCard label="A-приоритет"       value={stats.by_priority?.A ?? 0}           color="text-red-600"     sub="Высокий" />
          <StatCard label="Есть Instagram"   value={stats.has_instagram}                 color="text-pink-600"    sub={`${Math.round((stats.has_instagram / stats.total) * 100)}%`} />
          <StatCard label="Вероятно частные" value={stats.is_private}                   color="text-indigo-600"  sub={`${Math.round((stats.is_private / stats.total) * 100)}%`} />
        </div>
      )}

      {/* Stage progress bar */}
      {stats?.by_stage && view !== "map" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Воронка по этапам</p>
          <div className="space-y-2">
            {STAGES.map(s => {
              const count = stats.by_stage[s.key] ?? 0;
              const pct   = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-40 truncate flex-shrink-0">{s.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию или адресу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Все приоритеты</option>
          {priorityOptions.map(p => <option key={p} value={p}>{p === "A" ? "A — высокий" : p === "B" ? "B — средний" : "C — низкий"}</option>)}
        </select>

        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Все этапы</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {cityOptions.length > 0 && (
          <select
            value={filterCity}
            onChange={e => { setFilterCity(e.target.value); setFilterDistrict(""); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Все города</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <select
          value={filterDistrict}
          onChange={e => setFilterDistrict(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Все районы</option>
          {districtOptions.map(d => d && <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading && view !== "map" ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : view === "kanban" ? (
        /* ── Kanban ── */
        <>
          <div className="overflow-x-auto pb-4 min-w-0">
            <div className="flex gap-3" style={{ width: `${STAGES.length * 272}px` }}>
              {STAGES.map(stage => (
                <div key={stage.key} className="w-64 flex-none" style={{ minWidth: "256px", maxWidth: "256px" }}>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${stage.bg} ${stage.border}`}>
                    <span className={`text-xs font-bold ${stage.text}`}>{stage.label}</span>
                    <span className={`text-xs font-black ${stage.text}`}>
                      {stats?.by_stage?.[stage.key] ?? byStage[stage.key]?.length ?? 0}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                    {(byStage[stage.key] ?? []).map(c => (
                      <ClinicKanbanCard key={c.id} clinic={c} onStageChange={handleStageChange} />
                    ))}
                    {(byStage[stage.key] ?? []).length === 0 && (
                      <div className="text-center text-xs text-gray-300 py-6 border-2 border-dashed border-gray-100 rounded-xl">
                        Нет клиник
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-2 flex justify-center">
            {loadingMore && <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />}
            {!loadingMore && hasMore && <div className="text-xs text-gray-400">Прокрутите вниз для загрузки</div>}
          </div>
        </>
      ) : view === "table" ? (
        /* ── Table ── */
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Клиника</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Район</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Приоритет</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Этап</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Контакт</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Следующий шаг</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Ответственный</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clinics.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 leading-tight">{c.name}</div>
                        {c.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{c.description}</div>}
                        {c.rating != null && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" />{c.rating} ({c.review_count ?? 0})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.district_name ?? "—"}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3">
                        {editingId === c.id ? (
                          <div className="flex items-center gap-1">
                            <select value={editStage} onChange={e => setEditStage(e.target.value)}
                              className="text-xs border border-blue-300 rounded-lg px-2 py-1 focus:outline-none">
                              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <button onClick={() => { handleStageChange(c.id, editStage); setEditingId(null); }}
                              className="p-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <StageBadge stage={c.pipeline_stage} />
                            <button onClick={() => { setEditingId(c.id); setEditStage(c.pipeline_stage); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-600">
                              <Edit3 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {c.instagram && <a href={c.instagram} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-pink-600 hover:underline"><Instagram className="w-2.5 h-2.5" />Instagram</a>}
                          {c.phones?.[0] && <a href={`tel:${c.phones[0]}`}
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"><Phone className="w-2.5 h-2.5" />{c.phones[0].slice(0, 18)}</a>}
                          {c.telegram?.[0] && <a href={c.telegram[0]} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-sky-600 hover:underline"><MessageCircle className="w-2.5 h-2.5" />Telegram</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px]">
                        <div className="truncate">{c.next_step ?? "—"}</div>
                        {c.next_step_date && <div className="text-[10px] text-gray-400">{c.next_step_date}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.responsible ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loadingMore && <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />}
            {!loadingMore && hasMore && <div className="text-xs text-gray-400">Загрузка следующих клиник...</div>}
            {!hasMore && clinics.length > 0 && <div className="text-xs text-gray-300">Все клиники загружены · {clinics.length} из {stats?.total ?? clinics.length}</div>}
          </div>
        </>
      ) : view === "map" ? (
        /* ── Map ── */
        <PipelineMapView clinics={clinics} loading={loading} />
      ) : (
        /* ── Analytics ── */
        <PipelineAnalyticsView stats={stats} clinics={clinics} />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => { setShowImport(false); fetchClinics(1); fetchStats(); }}
        />
      )}
    </div>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose }: { onClose: () => void }) {
  const [pipelineFile, setPipelineFile] = useState<File | null>(null);
  const [clinicsFile, setClinicsFile] = useState<File | null>(null);
  const [doUpdate, setDoUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pipeline?: any; clinics?: any } | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async () => {
    if (!pipelineFile && !clinicsFile) {
      setError("Выберите хотя бы один файл");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      if (pipelineFile) fd.append("pipeline_file", pipelineFile);
      if (clinicsFile)  fd.append("clinics_file",  clinicsFile);
      if (doUpdate)     fd.append("update_existing", "true");
      const { data } = await api.post("/pipeline/import/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Ошибка при загрузке файла");
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-800">Импорт из Excel</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Pipeline file */}
          <FileDropZone
            label="Файл pipeline (zhancare_pipeline_kliniki_po_raionam.xlsx)"
            accept=".xlsx,.xls"
            file={pipelineFile}
            onChange={setPipelineFile}
          />

          {/* Clinics file */}
          <FileDropZone
            label="Файл клиник (zhancare_kliniki_tashkenta.xlsx)"
            accept=".xlsx,.xls"
            file={clinicsFile}
            onChange={setClinicsFile}
          />

          {/* Update checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setDoUpdate(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${doUpdate ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${doUpdate ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700">Обновить существующие клиники</span>
          </label>

          {/* Error */}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          {/* Result */}
          {result && (
            <div className="space-y-2 bg-emerald-50 rounded-xl px-4 py-3 text-sm">
              {result.pipeline && !result.pipeline.error && (
                <>
                  <p className="text-emerald-700">
                    Pipeline: <b>{result.pipeline.created}</b> создано, <b>{result.pipeline.updated}</b> обновлено
                  </p>
                  {result.pipeline.columns_detected && (
                    <p className="text-gray-500 text-xs break-all">
                      Колонки pipeline: {result.pipeline.columns_detected.join(", ")}
                    </p>
                  )}
                  {result.pipeline.row_errors?.length > 0 && (
                    <div className="text-red-600 text-xs mt-1 space-y-0.5">
                      {result.pipeline.row_errors.map((e: string, i: number) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                </>
              )}
              {result.pipeline?.error && (
                <p className="text-red-600">Pipeline ошибка: {result.pipeline.error}</p>
              )}
              {result.clinics && !result.clinics.error && (
                <>
                  <p className="text-emerald-700">
                    Клиники: <b>{result.clinics.created}</b> создано, <b>{result.clinics.updated}</b> обновлено
                    {result.clinics.skipped > 0 && <>, <b>{result.clinics.skipped}</b> пропущено</>}
                  </p>
                  {result.clinics.columns_detected && (
                    <p className="text-gray-500 text-xs break-all">
                      Колонки клиник: {result.clinics.columns_detected.join(", ")}
                    </p>
                  )}
                  {result.clinics.row_errors?.length > 0 && (
                    <div className="text-red-600 text-xs mt-1 space-y-0.5">
                      {result.clinics.row_errors.map((e: string, i: number) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                </>
              )}
              {result.clinics?.error && (
                <p className="text-red-600">Клиники ошибка: {result.clinics.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {result ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Закрыть и обновить список
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (!pipelineFile && !clinicsFile)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Загрузка...</>
                ) : (
                  <><Upload className="w-4 h-4" />Загрузить</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function FileDropZone({ label, accept, file, onChange }: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1.5">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${
          file ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-emerald-700 font-medium truncate">{file.name}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Нажмите или перетащите файл .xlsx</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Map view ────────────────────────────────────────────────────────────────

const MAP_TILES = {
  dark:      { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",        attr: "© CartoDB"  },
  light:     { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",       attr: "© CartoDB"  },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
};

const STAGE_COLOR_MAP: Record<string, string> = {
  lead:            "#64748b",
  contacted:       "#3b82f6",
  responded:       "#8b5cf6",
  demo:            "#f59e0b",
  negotiating:     "#f97316",
  contract_review: "#ec4899",
  contract_signed: "#06b6d4",
  invoiced:        "#10b981",
  paid:            "#22c55e",
  lost:            "#ef4444",
};

const PRIORITY_BG: Record<string, string> = {
  A: "#ef4444", B: "#f97316", C: "#94a3b8",
};

function PipelineMapView({ clinics, loading }: { clinics: Clinic[]; loading: boolean }) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapRef2       = useRef<any>(null);   // leaflet map instance
  const clusterRef    = useRef<any>(null);   // L.markerClusterGroup
  const heatRef       = useRef<any>(null);   // L.heatLayer
  const baseTileRef   = useRef<any>(null);   // current base TileLayer
  const lblTileRef    = useRef<any>(null);   // hybrid label overlay
  const [mapReady,    setMapReady]    = useState(false);
  const [mapType,     setMapType]     = useState("dark");
  const [showHeatmap, setShowHeatmap] = useState(true);

  // ── Init Leaflet map ────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef2.current || !mapRef.current) return;
    let alive = true;

    (async () => {
      const Lmod = await import("leaflet");
      // @ts-ignore — no type declarations for leaflet.heat
      await import("leaflet.heat").catch(() => {});
      await import("leaflet.markercluster").catch(() => {});
      if (!alive || !mapRef.current) return;

      const L = (Lmod.default ?? Lmod) as any;
      const map = L.map(mapRef.current, { center: [41.2995, 69.2401], zoom: 11, zoomControl: true });

      baseTileRef.current = L.tileLayer(MAP_TILES.dark.url, {
        attribution: MAP_TILES.dark.attr, maxZoom: 19, subdomains: "abcd",
      }).addTo(map);

      // Let the container fully lay out before adding data layers
      await new Promise<void>(r => setTimeout(r, 100));
      if (!alive) return;
      map.invalidateSize();

      heatRef.current = (L as any).heatLayer([], {
        radius: 28, blur: 20, maxZoom: 17, max: 1.0, minOpacity: 0.01,
        gradient: { 0.2: "lime", 0.5: "yellow", 0.75: "orange", 1.0: "red" },
      }).addTo(map);

      clusterRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 60, spiderfyOnMaxZoom: true, showCoverageOnHover: false,
        iconCreateFunction: (cluster: any) => {
          const n  = cluster.getChildCount();
          const sz = n < 10 ? 38 : n < 50 ? 46 : n < 200 ? 54 : 62;
          return L.divIcon({
            html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);border:3px solid white;box-shadow:0 4px 16px rgba(59,130,246,0.45);display:flex;align-items:center;justify-content:center;font-size:${n < 100 ? 13 : 11}px;font-weight:800;color:white">${n}</div>`,
            className: "", iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
          });
        },
      });
      map.addLayer(clusterRef.current);
      mapRef2.current = { map, L };
      setMapReady(true);
    })();

    return () => {
      alive = false;
      if (mapRef2.current) { mapRef2.current.map.remove(); mapRef2.current = null; }
    };
  }, []);

  // ── Map type switch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef2.current) return;
    const { map, L } = mapRef2.current;
    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    if (lblTileRef.current) { map.removeLayer(lblTileRef.current); lblTileRef.current = null; }
    const tile = mapType === "satellite" ? MAP_TILES.satellite
               : mapType === "light"     ? MAP_TILES.light
               :                           MAP_TILES.dark;
    baseTileRef.current = L.tileLayer(tile.url, {
      attribution: tile.attr, maxZoom: 19, subdomains: "abcd",
    }).addTo(map);
  }, [mapType, mapReady]);

  // ── Heatmap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !heatRef.current || !mapRef2.current) return;
    const { map } = mapRef2.current;
    if (showHeatmap) {
      const pts = clinics
        .filter(c => c.latitude && c.longitude)
        .map(c => {
          const w = c.priority === "A" ? 1.0 : c.priority === "B" ? 0.65 : 0.35;
          return [c.latitude!, c.longitude!, w];
        });
      heatRef.current.setLatLngs(pts);
      // hide clusters while heatmap is active
      if (map.hasLayer(clusterRef.current)) map.removeLayer(clusterRef.current);
    } else {
      heatRef.current.setLatLngs([]);
      // restore clusters
      if (!map.hasLayer(clusterRef.current)) map.addLayer(clusterRef.current);
    }
  }, [mapReady, clinics, showHeatmap]);

  // ── Markers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef2.current) return;
    const { map, L } = mapRef2.current;
    clusterRef.current.clearLayers();

    const geo = clinics.filter(c => c.latitude && c.longitude);
    const markers = geo.map(c => {
      const sc        = STAGE_COLOR_MAP[c.pipeline_stage] ?? "#64748b";
      const pb        = PRIORITY_BG[c.priority ?? ""] ?? "transparent";
      const stageName = STAGES.find(s => s.key === c.pipeline_stage)?.label ?? c.pipeline_stage;
      const prBg      = c.priority === "A" ? "#fee2e2" : c.priority === "B" ? "#fef3c7" : "#f1f5f9";
      const prTxt     = c.priority === "A" ? "#dc2626" : c.priority === "B" ? "#d97706" : "#64748b";
      const sz        = 38;
      const html = `
        <div style="position:relative;width:${sz}px;height:${sz + 12}px;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.22));cursor:pointer">
          <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${sc};border:3px solid rgba(255,255,255,0.95)"></div>
          ${c.priority ? `<div style="position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:50%;background:${pb};border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:white;line-height:1">${c.priority}</div>` : ""}
          <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:14px solid ${sc}"></div>
        </div>`;
      const icon   = L.divIcon({ html, className: "", iconSize: [sz, sz + 12], iconAnchor: [sz / 2, sz + 12] });
      const marker = L.marker([c.latitude!, c.longitude!], { icon });
      marker.bindPopup(`
        <div style="min-width:220px;font-family:system-ui">
          <div style="font-size:14px;font-weight:700;color:#0f172a;padding-bottom:6px;border-bottom:1px solid #f1f5f9;margin-bottom:6px">${c.name}</div>
          <div style="font-size:12px;line-height:1.9;color:#475569">
            ${c.district_name ? `<div>📍 <b>${c.district_name}</b></div>` : ""}
            ${c.description   ? `<div style="color:#64748b;margin-top:2px">${c.description.slice(0, 120)}${c.description.length > 120 ? "…" : ""}</div>` : ""}
            ${c.phones?.[0]   ? `<div>📞 ${c.phones[0]}</div>` : ""}
            ${c.instagram     ? `<div>📸 <a href="${c.instagram}" target="_blank" style="color:#e1306c;font-weight:600">Instagram</a></div>` : ""}
            <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap">
              <span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44">${stageName}</span>
              ${c.priority ? `<span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:${prBg};color:${prTxt}">Приоритет ${c.priority}</span>` : ""}
            </div>
          </div>
        </div>`);
      return marker;
    });

    clusterRef.current.addLayers(markers);
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 14 });
    }
  }, [mapReady, clinics]);

  const withCoords = clinics.filter(c => c.latitude).length;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200/60"
      style={{ height: "calc(100vh - 260px)", minHeight: 540 }}
    >
      <div ref={mapRef} className="w-full h-full" />

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        {/* Map type switcher */}
        <div className="flex overflow-hidden rounded-xl shadow-lg border border-white/50 bg-white/90 backdrop-blur-md">
          {[
            { key: "dark",      label: "Тёмная"  },
            { key: "light",     label: "Светлая" },
            { key: "satellite", label: "Спутник" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMapType(key)}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                mapType === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Heatmap / Markers toggle */}
        <button
          onClick={() => setShowHeatmap(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg border transition-all backdrop-blur-md ${
            showHeatmap
              ? "bg-blue-600 text-white border-blue-700 shadow-blue-200"
              : "bg-white/90 text-gray-600 border-white/50 hover:bg-white"
          }`}
        >
          {showHeatmap ? <Flame className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
          {showHeatmap ? "Тепловая карта" : "Маркеры"}
        </button>
      </div>

      {/* Stage legend — bottom left */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-white/92 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 px-4 py-3 max-w-[240px]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Этапы воронки</p>
        <div className="grid grid-cols-1 gap-y-1.5">
          {STAGES.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-[11px] text-gray-600 leading-none">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2">
          {loading
            ? <><div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" /><span className="text-[11px] text-blue-500">Загрузка...</span></>
            : <span className="text-[11px] text-gray-500 font-semibold">{withCoords} точек на карте</span>
          }
        </div>
      </div>

      {/* Priority hint — top left */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-white/50 text-[11px]">
        <span className="text-gray-500 font-medium">Приоритет:</span>
        {[["A","#ef4444"],["B","#f97316"],["C","#94a3b8"]].map(([p,c]) => (
          <span key={p} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
            <span className="font-bold text-gray-700">{p}</span>
          </span>
        ))}
        <span className="text-gray-400 ml-1 text-[10px]">= бейдж внутри маркера</span>
      </div>

    </div>
  );
}

// ─── Analytics view ───────────────────────────────────────────────────────────

function PipelineAnalyticsView({ stats, clinics }: { stats: Stats | null; clinics: Clinic[] }) {
  if (!stats) return <div className="py-20 text-center text-gray-400">Загрузка аналитики...</div>;

  const maxDistrict = Math.max(...(stats.by_district?.map(d => d.total) ?? [1]));
  const channelCounts = clinics.reduce((acc, c) => {
    if (c.recommended_channel) acc[c.recommended_channel] = (acc[c.recommended_channel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const channelLabels: Record<string, string> = {
    instagram: "Instagram", telegram: "Telegram", whatsapp: "WhatsApp",
    phone: "Телефон", website: "Сайт", find: "Найти контакт",
  };
  const totalWithChannel = Object.values(channelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Priority distribution */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Распределение по приоритету</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "A", label: "A — Высокий", color: "bg-red-500", textColor: "text-red-700" },
            { key: "B", label: "B — Средний", color: "bg-yellow-400", textColor: "text-yellow-700" },
            { key: "C", label: "C — Низкий",  color: "bg-gray-300", textColor: "text-gray-600" },
          ].map(({ key, label, color, textColor }) => {
            const count = stats.by_priority?.[key] ?? 0;
            const pct = stats.total ? Math.round(count / stats.total * 100) : 0;
            return (
              <div key={key} className="text-center p-4 rounded-xl bg-gray-50">
                <div className={`text-3xl font-black ${textColor}`}>{count}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
                <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* District breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">По районам Ташкента</h3>
        <div className="space-y-2.5">
          {(stats.by_district ?? []).sort((a, b) => b.total - a.total).map(d => {
            const pct = maxDistrict ? Math.round(d.total / maxDistrict * 100) : 0;
            const aPct = d.total ? Math.round(d.a / d.total * 100) : 0;
            return (
              <div key={d.district__name_ru} className="flex items-center gap-3">
                <div className="w-44 text-xs text-gray-600 truncate flex-shrink-0">{d.district__name_ru}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-[10px] text-white font-semibold drop-shadow">{d.total}</span>
                  </div>
                </div>
                <div className="w-20 text-[10px] text-gray-400 flex-shrink-0">
                  <span className="text-red-600 font-semibold">{d.a}</span> A-приор. ({aPct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel recommendations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Рекомендуемые каналы связи</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(channelCounts).sort((a, b) => b[1] - a[1]).map(([ch, cnt]) => {
            const pct = totalWithChannel ? Math.round(cnt / totalWithChannel * 100) : 0;
            const ICONS: Record<string, string> = { instagram: "📸", telegram: "✈️", whatsapp: "💬", phone: "📞", website: "🌐", find: "🔍" };
            return (
              <div key={ch} className="p-3 rounded-xl bg-gray-50 flex items-center gap-3">
                <span className="text-xl">{ICONS[ch] ?? "📡"}</span>
                <div>
                  <div className="text-sm font-bold text-gray-800">{cnt}</div>
                  <div className="text-[10px] text-gray-500">{channelLabels[ch] ?? ch} · {pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline stage funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Воронка по этапам</h3>
        <div className="space-y-2">
          {STAGES.map(s => {
            const cnt = stats.by_stage?.[s.key] ?? 0;
            const pct = stats.total ? Math.round(cnt / stats.total * 100) : 0;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-44 text-xs text-gray-600 flex-shrink-0">{s.label}</div>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                </div>
                <div className="w-12 text-xs text-gray-500 text-right flex-shrink-0">{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
