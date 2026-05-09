"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, List, Search, Map, BarChart2,
  Instagram, Phone, Globe, MessageCircle, ChevronDown,
  MapPin, Star, RefreshCw, X, Edit3, Check, Upload, Flame,
  Building2, TrendingUp, Users, Zap,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  { key: "lead",            label: "База клиник",           color: "#64748b", gradient: "from-slate-500 to-slate-600" },
  { key: "contacted",       label: "Написали",              color: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
  { key: "responded",       label: "Ответили",              color: "#8b5cf6", gradient: "from-violet-500 to-violet-600" },
  { key: "demo",            label: "Провели демо",          color: "#f59e0b", gradient: "from-amber-400 to-amber-500" },
  { key: "negotiating",     label: "Переговоры",            color: "#f97316", gradient: "from-orange-500 to-orange-600" },
  { key: "contract_review", label: "Согласовывают договор", color: "#ec4899", gradient: "from-pink-500 to-pink-600" },
  { key: "contract_signed", label: "Подписали договор",     color: "#06b6d4", gradient: "from-cyan-500 to-cyan-600" },
  { key: "invoiced",        label: "Оплачивает счёт",       color: "#10b981", gradient: "from-emerald-500 to-emerald-600" },
  { key: "paid",            label: "Оплатил",               color: "#22c55e", gradient: "from-green-500 to-green-600" },
  { key: "lost",            label: "Отказ",                 color: "#ef4444", gradient: "from-red-500 to-red-600" },
];

const PRIORITY_CONFIG = {
  A: { label: "A", dot: "#ef4444", bg: "bg-red-50",    text: "text-red-600",    ring: "ring-red-200",    full: "A — высокий" },
  B: { label: "B", dot: "#f59e0b", bg: "bg-amber-50",  text: "text-amber-600",  ring: "ring-amber-200",  full: "B — средний" },
  C: { label: "C", dot: "#94a3b8", bg: "bg-slate-50",  text: "text-slate-500",  ring: "ring-slate-200",  full: "C — низкий"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) return null;
  const cfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.full}
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGES.find(s => s.key === stage);
  if (!cfg) return <span className="text-xs text-gray-400">{stage}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
      style={{ background: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function ClinicAvatar({ name, stageColor }: { name: string; stageColor: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
      style={{ background: `linear-gradient(135deg, ${stageColor}cc, ${stageColor})` }}>
      {initials}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, gradient }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${gradient} shadow-sm`}>
          {icon}
        </div>
        {sub && <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div className="text-2xl font-black text-gray-900 leading-none">{value}</div>
      <div className="text-xs text-gray-400 font-medium mt-1">{label}</div>
    </div>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function ClinicKanbanCard({ clinic, onStageChange }: { clinic: Clinic; onStageChange: (id: number, stage: string) => void }) {
  const [stageMenu, setStageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stageColor = STAGES.find(s => s.key === clinic.pipeline_stage)?.color ?? "#64748b";
  const firstPhone = clinic.phones?.[0];
  const firstTelegram = clinic.telegram?.[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setStageMenu(false);
    };
    if (stageMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stageMenu]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-default"
    >
      {/* Stage color accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${stageColor}, ${stageColor}80)` }} />

      <div className="p-3.5 space-y-3">
        {/* Header: avatar + name + priority */}
        <div className="flex items-start gap-2.5">
          <ClinicAvatar name={clinic.name} stageColor={stageColor} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{clinic.name}</p>
            {clinic.district_name && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{clinic.district_name}
              </p>
            )}
          </div>
          <PriorityBadge priority={clinic.priority} />
        </div>

        {/* Type / description */}
        {clinic.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 px-0.5">{clinic.description}</p>
        )}

        {/* Rating */}
        {clinic.rating != null && (
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
            {clinic.rating}
            <span className="text-gray-400 font-normal">· {clinic.review_count ?? 0} отзывов</span>
          </div>
        )}

        {/* Contact buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {clinic.instagram && (
            <a href={clinic.instagram} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors font-medium">
              <Instagram className="w-3 h-3" />Instagram
            </a>
          )}
          {firstPhone && (
            <a href={`tel:${firstPhone}`}
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
              <Phone className="w-3 h-3" />{firstPhone.slice(0, 13)}
            </a>
          )}
          {firstTelegram && (
            <a href={firstTelegram} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors font-medium">
              <MessageCircle className="w-3 h-3" />Telegram
            </a>
          )}
          {clinic.websites?.[0] && (
            <a href={clinic.websites[0]} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors font-medium">
              <Globe className="w-3 h-3" />Сайт
            </a>
          )}
        </div>

        {/* Next step */}
        {clinic.next_step && (
          <div className="flex items-start gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 rounded-xl px-2.5 py-1.5">
            <span className="mt-px">→</span>
            <span className="line-clamp-1">{clinic.next_step}</span>
          </div>
        )}

        {/* Stage move */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setStageMenu(v => !v)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors border border-gray-100 hover:border-gray-200"
          >
            <span>Переместить в этап</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stageMenu ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {stageMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-0 mb-1.5 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 overflow-hidden py-1.5"
              >
                {STAGES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => { onStageChange(clinic.id, s.key); setStageMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 ${
                      s.key === clinic.pipeline_stage
                        ? "bg-gray-50 font-bold text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    {s.label}
                    {s.key === clinic.pipeline_stage && (
                      <Check className="w-3 h-3 ml-auto text-blue-500" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
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
    try { const { data } = await api.get("/pipeline/stats/"); setStats(data); } catch {}
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

  useEffect(() => {
    if (view === "map" || view === "analytics") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) fetchClinics(currentPage + 1, true);
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
    } catch (e) { console.error("Stage update failed", e); }
  };

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

  const VIEW_TABS = [
    { key: "kanban",    icon: <LayoutGrid className="w-4 h-4" />, label: "Канбан" },
    { key: "table",     icon: <List className="w-4 h-4" />,       label: "Таблица" },
    { key: "map",       icon: <Map className="w-4 h-4" />,        label: "Карта" },
    { key: "analytics", icon: <BarChart2 className="w-4 h-4" />,  label: "Аналитика" },
  ] as const;

  // Reusable header + controls JSX
  const pageHeader = (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="bg-white rounded-2xl shadow-md px-4 py-2.5 border border-gray-100">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #12263a, #3772ff)' }}>
            <TrendingUp className="w-5 h-5" />
          </div>
          Pipeline клиник
        </h1>
        <p className="text-xs text-gray-400 mt-0.5 ml-11">
          {stats?.total ?? "—"} клиник
        </p>
      </div>
      <div className="flex items-center gap-2 bg-white rounded-2xl shadow-md px-3 py-2 border border-gray-100">
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <Upload className="w-4 h-4" />Импорт Excel
        </button>
        <button onClick={() => { fetchClinics(1); fetchStats(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />Обновить
        </button>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {VIEW_TABS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Reusable filters JSX
  const filtersBar = (compact = false) => (
    <div className={`${compact ? "bg-transparent p-0" : "bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3"} flex flex-wrap items-center gap-2`}>
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input type="text" placeholder="Поиск по названию или адресу..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white shadow-md" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>}
      </div>
      {[
        { value: filterPriority, onChange: setFilterPriority, placeholder: "Все приоритеты",
          options: priorityOptions.map(p => ({ value: p, label: p === "A" ? "A — высокий" : p === "B" ? "B — средний" : "C — низкий" })) },
        { value: filterStage, onChange: setFilterStage, placeholder: "Все этапы",
          options: STAGES.map(s => ({ value: s.key, label: s.label })) },
        ...(cityOptions.length > 0 ? [{ value: filterCity, onChange: (v: string) => { setFilterCity(v); setFilterDistrict(""); }, placeholder: "Все города",
          options: cityOptions.map(c => ({ value: c, label: c })) }] : []),
        { value: filterDistrict, onChange: setFilterDistrict, placeholder: "Все районы",
          options: districtOptions.filter(Boolean).map(d => ({ value: d, label: d })) },
      ].map((sel, i) => (
        <div key={i} className="relative">
          <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer shadow-md">
            <option value="">{sel.placeholder}</option>
            {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      ))}
      {(filterPriority || filterStage || filterCity || filterDistrict) && (
        <button onClick={() => { setFilterPriority(""); setFilterStage(""); setFilterCity(""); setFilterDistrict(""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-white hover:bg-red-50 transition-colors border border-red-100 shadow-md">
          <X className="w-3 h-3" />Сбросить
        </button>
      )}
    </div>
  );

  // ── Map view: full-screen map, all controls float as glass overlays ──
  if (view === "map") {
    return (
      <>
        <div
          className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 -mb-4 sm:-mb-6 relative overflow-hidden"
          style={{ height: 'calc(100dvh - 100px)' }}
        >
          {/* Map fills entire container as background */}
            <div className="absolute inset-0 z-0">
            <PipelineMapView clinics={clinics} loading={loading} fullHeight topOffset={190} />
          </div>

          {/* ── Top-left: Title card ── */}
          <div className="absolute z-[1001]" style={{ top: 16, left: 16 }}>
            <div className="bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #12263a, #3772ff)' }}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 leading-tight">Pipeline клиник</p>
                <p className="text-[10px] text-gray-400 font-medium">{stats?.total ?? "—"} клиник</p>
              </div>
            </div>
          </div>

          {/* ── Top-left below title: Search ── */}
          <div className="absolute z-[1001]" style={{ top: 84, left: 16 }}>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по названию или адресу..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white shadow-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Top-left below search: Filter chips ── */}
          <div className="absolute z-[1001] flex flex-wrap gap-2" style={{ top: 140, left: 16 }}>
            {[
              { value: filterPriority, onChange: setFilterPriority, placeholder: "Приоритет",
                options: priorityOptions.map(p => ({ value: p, label: p === "A" ? "A — высокий" : p === "B" ? "B — средний" : "C — низкий" })) },
              { value: filterStage, onChange: setFilterStage, placeholder: "Этап",
                options: STAGES.map(s => ({ value: s.key, label: s.label })) },
              ...(cityOptions.length > 0 ? [{ value: filterCity, onChange: (v: string) => { setFilterCity(v); setFilterDistrict(""); }, placeholder: "Город",
                options: cityOptions.map(c => ({ value: c, label: c })) }] : []),
              { value: filterDistrict, onChange: setFilterDistrict, placeholder: "Район",
                options: districtOptions.filter(Boolean).map(d => ({ value: d, label: d })) },
            ].map((sel, i) => (
              <div key={i} className="relative">
                <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
                  className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl border text-xs font-semibold bg-white shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    sel.value ? "border-blue-400 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>
                  <option value="">{sel.placeholder}</option>
                  {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            ))}
            {(filterPriority || filterStage || filterCity || filterDistrict) && (
              <button onClick={() => { setFilterPriority(""); setFilterStage(""); setFilterCity(""); setFilterDistrict(""); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-white shadow-md border border-red-100 hover:bg-red-50 transition-colors">
                <X className="w-3 h-3" />Сбросить
              </button>
            )}
          </div>

          {/* ── Top-right: Actions + View switcher ── */}
          <div className="absolute z-[1001] flex items-center gap-2" style={{ top: 16, right: 16 }}>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-emerald-700 bg-white shadow-lg border border-emerald-200 hover:bg-emerald-50 transition-colors">
              <Upload className="w-4 h-4" />Импорт
            </button>
            <button onClick={() => { fetchClinics(1); fetchStats(); }}
              className="p-2 rounded-xl bg-white shadow-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center bg-white shadow-lg rounded-xl p-1 gap-0.5 border border-gray-200">
              {VIEW_TABS.map(({ key, icon, label }) => (
                <button key={key} onClick={() => setView(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    view === key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={view === key ? { background: 'linear-gradient(135deg, #12263a, #3772ff)' } : undefined}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {showImport && <ImportModal onClose={() => { setShowImport(false); fetchClinics(1); fetchStats(); }} />}
      </>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      {pageHeader}

      {/* ── Stat cards ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Всего клиник"      value={stats.total}                icon={<Building2 className="w-4 h-4" />}   gradient="from-slate-600 to-slate-700" />
          <StatCard label="A-приоритет"        value={stats.by_priority?.A ?? 0} icon={<Zap className="w-4 h-4" />}          gradient="from-red-500 to-rose-600"    sub="Высокий" />
          <StatCard label="Есть Instagram"    value={stats.has_instagram}        icon={<Instagram className="w-4 h-4" />}   gradient="from-pink-500 to-rose-500"   sub={`${Math.round((stats.has_instagram / stats.total) * 100)}%`} />
          <StatCard label="Частные клиники"   value={stats.is_private}           icon={<Users className="w-4 h-4" />}        gradient="from-indigo-500 to-blue-600" sub={`${Math.round((stats.is_private / stats.total) * 100)}%`} />
        </div>
      )}

      {/* ── Funnel bar ── */}
      {stats?.by_stage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Воронка по этапам</p>
          <div className="space-y-2">
            {STAGES.map(s => {
              const count = stats.by_stage[s.key] ?? 0;
              const pct   = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-44 truncate flex-shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: s.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      {filtersBar()}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-sm text-gray-400">Загружаем клиники...</p>
        </div>
      ) : view === "kanban" ? (
        <>
          <div className="overflow-x-auto pb-4 -mx-1 px-1">
            <div className="flex gap-3" style={{ width: `${STAGES.length * 276}px` }}>
              {STAGES.map(stage => {
                const count = stats?.by_stage?.[stage.key] ?? byStage[stage.key]?.length ?? 0;
                return (
                  <div key={stage.key} className="w-64 flex-none" style={{ minWidth: 260 }}>
                    {/* Column header */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-3 overflow-hidden">
                      <div className="h-1 w-full" style={{ background: stage.color }} />
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-xs font-bold text-gray-700">{stage.label}</span>
                        <span className="text-xs font-black text-white px-2 py-0.5 rounded-full min-w-[24px] text-center"
                          style={{ background: stage.color }}>
                          {count}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2.5 max-h-[calc(100vh-460px)] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                      <AnimatePresence>
                        {(byStage[stage.key] ?? []).map(c => (
                          <ClinicKanbanCard key={c.id} clinic={c} onStageChange={handleStageChange} />
                        ))}
                      </AnimatePresence>
                      {count === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-100 rounded-2xl text-center gap-1">
                          <Building2 className="w-6 h-6 text-gray-200" />
                          <p className="text-xs text-gray-300 font-medium">Нет клиник</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div ref={sentinelRef} className="py-2 flex justify-center">
            {loadingMore && <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />}
            {!loadingMore && hasMore && <p className="text-xs text-gray-300">Прокрутите вниз для загрузки</p>}
          </div>
        </>
      ) : view === "table" ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["Клиника", "Район", "Приоритет", "Этап", "Контакт", "Следующий шаг", "Ответственный"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clinics.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ClinicAvatar name={c.name} stageColor={STAGES.find(s => s.key === c.pipeline_stage)?.color ?? "#64748b"} />
                          <div>
                            <div className="font-semibold text-gray-900 text-sm leading-tight">{c.name}</div>
                            {c.description && <div className="text-xs text-gray-400 truncate max-w-[180px]">{c.description}</div>}
                            {c.rating != null && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" />{c.rating} ({c.review_count ?? 0})
                              </div>
                            )}
                          </div>
                        </div>
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
                              className="p-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <StageBadge stage={c.pipeline_stage} />
                            <button onClick={() => { setEditingId(c.id); setEditStage(c.pipeline_stage); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {c.instagram && <a href={c.instagram} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-pink-600 hover:underline font-medium"><Instagram className="w-3 h-3" />Instagram</a>}
                          {c.phones?.[0] && <a href={`tel:${c.phones[0]}`}
                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"><Phone className="w-3 h-3" />{c.phones[0].slice(0, 16)}</a>}
                          {c.telegram?.[0] && <a href={c.telegram[0]} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-sky-600 hover:underline font-medium"><MessageCircle className="w-3 h-3" />Telegram</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">
                        <div className="truncate">{c.next_step ?? "—"}</div>
                        {c.next_step_date && <div className="text-[10px] text-gray-400">{c.next_step_date}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{c.responsible ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loadingMore && <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />}
            {!hasMore && clinics.length > 0 && (
              <p className="text-xs text-gray-300">Все клиники загружены · {clinics.length} из {stats?.total ?? clinics.length}</p>
            )}
          </div>
        </>
      ) : (
        <PipelineAnalyticsView stats={stats} clinics={clinics} />
      )}

      {showImport && (
        <ImportModal onClose={() => { setShowImport(false); fetchClinics(1); fetchStats(); }} />
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
    if (!pipelineFile && !clinicsFile) { setError("Выберите хотя бы один файл"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      if (pipelineFile) fd.append("pipeline_file", pipelineFile);
      if (clinicsFile)  fd.append("clinics_file",  clinicsFile);
      if (doUpdate)     fd.append("update_existing", "true");
      const { data } = await api.post("/pipeline/import/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Ошибка при загрузке файла");
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Upload className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Импорт из Excel</h2>
              <p className="text-xs text-gray-400">Загрузите файлы pipeline или клиник</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <FileDropZone label="Файл pipeline (zhancare_pipeline_kliniki_po_raionam.xlsx)" accept=".xlsx,.xls" file={pipelineFile} onChange={setPipelineFile} />
          <FileDropZone label="Файл клиник (zhancare_kliniki_tashkenta.xlsx)" accept=".xlsx,.xls" file={clinicsFile} onChange={setClinicsFile} />

          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <button
              type="button"
              onClick={() => setDoUpdate(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${doUpdate ? "bg-blue-500" : "bg-gray-200"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${doUpdate ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-gray-700 font-medium">Обновить существующие клиники</span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">{error}</p>}

          {result && (
            <div className="space-y-2 bg-emerald-50 rounded-xl px-4 py-3 text-sm border border-emerald-100">
              {result.pipeline && !result.pipeline.error && (
                <>
                  <p className="text-emerald-700 font-medium">Pipeline: <b>{result.pipeline.created}</b> создано, <b>{result.pipeline.updated}</b> обновлено</p>
                  {result.pipeline.columns_detected && <p className="text-gray-400 text-xs break-all">Колонки: {result.pipeline.columns_detected.join(", ")}</p>}
                  {result.pipeline.row_errors?.length > 0 && <div className="text-red-500 text-xs space-y-0.5">{result.pipeline.row_errors.map((e: string, i: number) => <p key={i}>{e}</p>)}</div>}
                </>
              )}
              {result.pipeline?.error && <p className="text-red-600">Pipeline ошибка: {result.pipeline.error}</p>}
              {result.clinics && !result.clinics.error && (
                <>
                  <p className="text-emerald-700 font-medium">Клиники: <b>{result.clinics.created}</b> создано, <b>{result.clinics.updated}</b> обновлено{result.clinics.skipped > 0 && <>, <b>{result.clinics.skipped}</b> пропущено</>}</p>
                  {result.clinics.columns_detected && <p className="text-gray-400 text-xs break-all">Колонки: {result.clinics.columns_detected.join(", ")}</p>}
                  {result.clinics.row_errors?.length > 0 && <div className="text-red-500 text-xs space-y-0.5">{result.clinics.row_errors.map((e: string, i: number) => <p key={i}>{e}</p>)}</div>}
                </>
              )}
              {result.clinics?.error && <p className="text-red-600">Клиники ошибка: {result.clinics.error}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/60 border-t border-gray-100">
          {result ? (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
              style={{ background: 'linear-gradient(135deg, #12263a, #3772ff)' }}>
              Закрыть и обновить список
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors font-medium">Отмена</button>
              <button onClick={handleSubmit} disabled={loading || (!pipelineFile && !clinicsFile)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Загрузка...</> : <><Upload className="w-4 h-4" />Загрузить</>}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function FileDropZone({ label, accept, file, onChange }: { label: string; accept: string; file: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1.5">{label}</p>
      <div onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl px-4 py-3.5 cursor-pointer transition-all ${
          file ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20"
        }`}>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
        {file ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-emerald-700 font-medium truncate">{file.name}</span>
            <button type="button" onClick={e => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
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

// ─── Map view ─────────────────────────────────────────────────────────────────

const MAP_TILES = {
  dark:      { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",        attr: "© CartoDB"  },
  light:     { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",       attr: "© CartoDB"  },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
};

const STAGE_COLOR_MAP: Record<string, string> = {
  lead:"#64748b",contacted:"#3b82f6",responded:"#8b5cf6",demo:"#f59e0b",
  negotiating:"#f97316",contract_review:"#ec4899",contract_signed:"#06b6d4",
  invoiced:"#10b981",paid:"#22c55e",lost:"#ef4444",
};


function PipelineMapView({ clinics, loading, fullHeight, topOffset = 16 }: { clinics: Clinic[]; loading: boolean; fullHeight?: boolean; topOffset?: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapRef2 = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const heatRef = useRef<any>(null);
  const baseTileRef = useRef<any>(null);
  const lblTileRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState("dark");
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (mapRef2.current || !mapRef.current) return;
    let alive = true;
    (async () => {
      const Lmod = await import("leaflet");
      // @ts-ignore — no types for leaflet.heat
      await import("leaflet.heat").catch(() => {});
      await import("leaflet.markercluster").catch(() => {});
      if (!alive || !mapRef.current) return;
      const L = (Lmod.default ?? Lmod) as any;
      const map = L.map(mapRef.current, { center: [41.2995, 69.2401], zoom: 11, zoomControl: false });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      baseTileRef.current = L.tileLayer(MAP_TILES.dark.url, { attribution: MAP_TILES.dark.attr, maxZoom: 19, subdomains: "abcd" }).addTo(map);
      await new Promise<void>(r => setTimeout(r, 100));
      if (!alive) return;
      map.invalidateSize();
      heatRef.current = (L as any).heatLayer([], { radius: 28, blur: 20, maxZoom: 17, max: 1.0, minOpacity: 0.01, gradient: { 0.2: "lime", 0.5: "yellow", 0.75: "orange", 1.0: "red" } }).addTo(map);
      clusterRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 60, spiderfyOnMaxZoom: true, showCoverageOnHover: false,
        iconCreateFunction: (cluster: any) => {
          const n = cluster.getChildCount();
          const sz = n < 10 ? 38 : n < 50 ? 46 : n < 200 ? 54 : 62;
          return L.divIcon({ html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);border:3px solid white;box-shadow:0 4px 16px rgba(59,130,246,0.45);display:flex;align-items:center;justify-content:center;font-size:${n<100?13:11}px;font-weight:800;color:white">${n}</div>`, className: "", iconSize: [sz, sz], iconAnchor: [sz/2, sz/2] });
        },
      });
      map.addLayer(clusterRef.current);
      mapRef2.current = { map, L };
      setMapReady(true);

      // Invalidate map size whenever the container resizes (sidebar toggle, window resize)
      const ro = new ResizeObserver(() => {
        if (mapRef2.current) {
          mapRef2.current.map.invalidateSize({ animate: false });
        }
      });
      if (mapRef.current) ro.observe(mapRef.current);
      (mapRef2.current as any)._ro = ro;
    })();
    return () => {
      alive = false;
      if (mapRef2.current) {
        (mapRef2.current as any)._ro?.disconnect();
        mapRef2.current.map.remove();
        mapRef2.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef2.current) return;
    const { map, L } = mapRef2.current;
    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    if (lblTileRef.current) { map.removeLayer(lblTileRef.current); lblTileRef.current = null; }
    const tile = mapType === "satellite" ? MAP_TILES.satellite : mapType === "light" ? MAP_TILES.light : MAP_TILES.dark;
    baseTileRef.current = L.tileLayer(tile.url, { attribution: tile.attr, maxZoom: 19, subdomains: "abcd" }).addTo(map);
  }, [mapType, mapReady]);

  useEffect(() => {
    if (!mapReady || !heatRef.current || !mapRef2.current) return;
    const { map } = mapRef2.current;
    if (showHeatmap) {
      const pts = clinics.filter(c => c.latitude && c.longitude).map(c => [c.latitude!, c.longitude!, c.priority === "A" ? 1.0 : c.priority === "B" ? 0.65 : 0.35]);
      heatRef.current.setLatLngs(pts);
      if (map.hasLayer(clusterRef.current)) map.removeLayer(clusterRef.current);
    } else {
      heatRef.current.setLatLngs([]);
      if (!map.hasLayer(clusterRef.current)) map.addLayer(clusterRef.current);
    }
  }, [mapReady, clinics, showHeatmap]);

  useEffect(() => {
    if (!mapReady || !mapRef2.current) return;
    const { map, L } = mapRef2.current;
    clusterRef.current.clearLayers();
    const geo = clinics.filter(c => c.latitude && c.longitude);
    const markers = geo.map(c => {
      const sc = STAGE_COLOR_MAP[c.pipeline_stage] ?? "#64748b";
      const stageName = STAGES.find(s => s.key === c.pipeline_stage)?.label ?? c.pipeline_stage;
      const prBg = c.priority === "A" ? "#fee2e2" : c.priority === "B" ? "#fef3c7" : "#f1f5f9";
      const prTxt = c.priority === "A" ? "#dc2626" : c.priority === "B" ? "#d97706" : "#64748b";

      // Card-style marker: initials + clinic name + stage label + priority badge
      const initials = c.name.split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase();
      const shortName = c.name.length > 15 ? c.name.slice(0, 14) + "…" : c.name;
      const cardW = 158;
      const cardH = 52;

      const html = `
        <div style="position:relative;transform:translate(-50%,-100%);cursor:pointer;">
          <div style="
            background:linear-gradient(135deg,${sc}f5,${sc});
            border-radius:14px;
            padding:6px 8px 6px 6px;
            display:flex;align-items:center;gap:7px;
            border:2.5px solid rgba(255,255,255,0.88);
            box-shadow:0 6px 20px rgba(0,0,0,0.22),0 2px 6px rgba(0,0,0,0.14),inset 0 1px 0 rgba(255,255,255,0.28);
            width:${cardW}px;
          ">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.42);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;flex-shrink:0;font-family:system-ui,sans-serif;">${initials}</div>
            <div style="flex:1;min-width:0;overflow:hidden;">
              <div style="font-size:11px;font-weight:800;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:system-ui,sans-serif;line-height:1.3;">${shortName}</div>
              <div style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.68);font-family:system-ui,sans-serif;white-space:nowrap;margin-top:1px;">${stageName}</div>
            </div>
            ${c.priority ? `<div style="width:19px;height:19px;border-radius:50%;background:rgba(255,255,255,0.22);border:1.5px solid rgba(255,255,255,0.48);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:white;flex-shrink:0;font-family:system-ui,sans-serif;">${c.priority}</div>` : ""}
          </div>
          <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${sc};margin:0 auto;"></div>
        </div>`;

      const icon = L.divIcon({ html, className: "", iconSize: [cardW, cardH], iconAnchor: [cardW / 2, cardH] });
      const marker = L.marker([c.latitude!, c.longitude!], { icon });
      marker.bindPopup(`<div style="min-width:220px;font-family:system-ui"><div style="font-size:14px;font-weight:700;color:#0f172a;padding-bottom:6px;border-bottom:1px solid #f1f5f9;margin-bottom:6px">${c.name}</div><div style="font-size:12px;line-height:1.9;color:#475569">${c.district_name ? `<div>📍 <b>${c.district_name}</b></div>` : ""}${c.description ? `<div style="color:#64748b;margin-top:2px">${c.description.slice(0,120)}${c.description.length>120?"…":""}</div>` : ""}${c.phones?.[0] ? `<div>📞 ${c.phones[0]}</div>` : ""}${c.instagram ? `<div>📸 <a href="${c.instagram}" target="_blank" style="color:#e1306c;font-weight:600">Instagram</a></div>` : ""}<div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap"><span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44">${stageName}</span>${c.priority ? `<span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:${prBg};color:${prTxt}">Приоритет ${c.priority}</span>` : ""}</div></div></div>`);
      return marker;
    });
    clusterRef.current.addLayers(markers);
    if (markers.length > 0) { const group = L.featureGroup(markers); map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 14 }); }
  }, [mapReady, clinics]);

  const withCoords = clinics.filter(c => c.latitude).length;

  return (
    <div className={`relative overflow-hidden ${fullHeight ? "w-full h-full" : "rounded-2xl shadow-xl border border-gray-200/60"}`} style={fullHeight ? undefined : { height: "calc(100vh - 260px)", minHeight: 540 }}>
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="flex overflow-hidden rounded-xl shadow-lg border border-white/50 bg-white/90 backdrop-blur-md">
          {[{ key:"dark",label:"Тёмная"},{key:"light",label:"Светлая"},{key:"satellite",label:"Спутник"}].map(({key,label})=>(
            <button key={key} onClick={()=>setMapType(key)} className={`px-3 py-1.5 text-xs font-semibold transition-all ${mapType===key?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-100"}`}>{label}</button>
          ))}
        </div>
        <button onClick={()=>setShowHeatmap(v=>!v)} className={`mt-6 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg border transition-all backdrop-blur-md ${showHeatmap?"bg-blue-600 text-white border-blue-700":"bg-white/90 text-gray-600 border-white/50 hover:bg-white"}`}>
          {showHeatmap?<Flame className="w-3.5 h-3.5"/>:<MapPin className="w-3.5 h-3.5"/>}
          {showHeatmap?"Тепловая карта":"Маркеры"}
        </button>
      </div>
      <div className="absolute bottom-6 left-4 z-[1000] bg-white/92 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 px-4 py-3 max-w-[240px]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Этапы воронки</p>
        <div className="grid grid-cols-1 gap-y-1.5">
          {STAGES.map(s=>(
            <div key={s.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:s.color}}/>
              <span className="text-[11px] text-gray-600 leading-none">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2">
          {loading?<><div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"/><span className="text-[11px] text-blue-500">Загрузка...</span></>
            :<span className="text-[11px] text-gray-500 font-semibold">{withCoords} точек на карте</span>}
        </div>
      </div>
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-white/50 text-[11px]">
        <span className="text-gray-500 font-medium">Приоритет:</span>
        {[["A","#ef4444"],["B","#f97316"],["C","#94a3b8"]].map(([p,c])=>(
          <span key={p} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{background:c}}/><span className="font-bold text-gray-700">{p}</span></span>
        ))}
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
  const channelLabels: Record<string, string> = { instagram:"Instagram",telegram:"Telegram",whatsapp:"WhatsApp",phone:"Телефон",website:"Сайт",find:"Найти контакт" };
  const totalWithChannel = Object.values(channelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Распределение по приоритету</h3>
        <div className="grid grid-cols-3 gap-4">
          {[{key:"A",label:"A — Высокий",color:"#ef4444"},{key:"B",label:"B — Средний",color:"#f59e0b"},{key:"C",label:"C — Низкий",color:"#94a3b8"}].map(({key,label,color})=>{
            const count = stats.by_priority?.[key] ?? 0;
            const pct = stats.total ? Math.round(count/stats.total*100) : 0;
            return (
              <div key={key} className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl font-black text-gray-900">{count}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
                <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{background:color}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
                </div>
                <div className="text-[10px] text-gray-400 mt-1.5 font-semibold">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">По районам</h3>
        <div className="space-y-2.5">
          {(stats.by_district??[]).sort((a,b)=>b.total-a.total).map(d=>{
            const pct = maxDistrict ? Math.round(d.total/maxDistrict*100) : 0;
            const aPct = d.total ? Math.round(d.a/d.total*100) : 0;
            return (
              <div key={d.district__name_ru} className="flex items-center gap-3">
                <div className="w-44 text-xs text-gray-500 truncate flex-shrink-0">{d.district__name_ru}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded-xl overflow-hidden relative">
                  <motion.div className="h-full rounded-xl" style={{background:"linear-gradient(90deg,#3b82f6,#6366f1)"}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
                  <div className="absolute inset-0 flex items-center px-2.5"><span className="text-[10px] text-white font-bold drop-shadow">{d.total}</span></div>
                </div>
                <div className="w-24 text-[10px] text-gray-400 flex-shrink-0"><span className="text-red-500 font-bold">{d.a}</span> A-приор. ({aPct}%)</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Рекомендуемые каналы связи</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(channelCounts).sort((a,b)=>b[1]-a[1]).map(([ch,cnt])=>{
            const pct = totalWithChannel ? Math.round(cnt/totalWithChannel*100) : 0;
            const ICONS: Record<string,string> = {instagram:"📸",telegram:"✈️",whatsapp:"💬",phone:"📞",website:"🌐",find:"🔍"};
            return (
              <div key={ch} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 hover:bg-gray-100 transition-colors">
                <span className="text-xl">{ICONS[ch]??"📡"}</span>
                <div>
                  <div className="text-sm font-black text-gray-900">{cnt}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{channelLabels[ch]??ch} · {pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Воронка по этапам</h3>
        <div className="space-y-2.5">
          {STAGES.map(s=>{
            const cnt = stats.by_stage?.[s.key]??0;
            const pct = stats.total?Math.round(cnt/stats.total*100):0;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-44 text-xs text-gray-500 flex-shrink-0 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}}/>
                  {s.label}
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{background:s.color}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
                </div>
                <div className="w-10 text-xs font-bold text-gray-600 text-right flex-shrink-0">{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
