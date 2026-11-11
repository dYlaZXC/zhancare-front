"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, List, Search, Map, BarChart2,
  Instagram, Phone, Globe, MessageCircle, ChevronDown,
  Star, RefreshCw, X, Edit3, Check, Upload,
  Building2, TrendingUp, Users, Zap,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { phoneEntryToString } from "@/utils/phoneFormat";
import type { Clinic, Stats } from "@/components/services/admin/pipeline/types/pipelineTypes";
import { STAGES } from "@/components/services/admin/pipeline/constants/pipelineConstants";
import { PriorityBadge } from "@/components/services/admin/pipeline/components/PriorityBadge";
import { StageBadge } from "@/components/services/admin/pipeline/components/StageBadge";
import { ClinicAvatar } from "@/components/services/admin/pipeline/components/ClinicAvatar";
import { KPICard } from "@/components/services/admin/dashboardUI";
import { ClinicKanbanCard } from "@/components/services/admin/pipeline/components/ClinicKanbanCard";
import { ImportModal } from "@/components/services/admin/pipeline/modals/ImportModal";
import { PipelineMapView } from "@/components/services/admin/pipeline/views/PipelineMapView";
import { PipelineAnalyticsView } from "@/components/services/admin/pipeline/views/PipelineAnalyticsView";

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
          <KPICard label="Всего клиник"      value={String(stats.total)}                icon={Building2} color="#64748b" />
          <KPICard label="A-приоритет"        value={String(stats.by_priority?.A ?? 0)} icon={Zap}        color="#ef4444" sub="Высокий" />
          <KPICard label="Есть Instagram"    value={String(stats.has_instagram)}        icon={Instagram}   color="#ec4899" sub={`${Math.round((stats.has_instagram / stats.total) * 100)}%`} />
          <KPICard label="Частные клиники"   value={String(stats.is_private)}           icon={Users}        color="#6366f1" sub={`${Math.round((stats.is_private / stats.total) * 100)}%`} />
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
                          {c.phones?.[0] && <a href={`tel:${phoneEntryToString(c.phones[0])}`}
                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"><Phone className="w-3 h-3" />{phoneEntryToString(c.phones[0]).slice(0, 16)}</a>}
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
