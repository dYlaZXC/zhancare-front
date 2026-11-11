"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { KPICard } from "./dashboardUI";
import {
  Activity, Clock, UserPlus, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Search, RefreshCw, Stethoscope,
  Home, FileText, Users, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id: number;
  action_category: "consultation" | "appointment" | "patient" | "staff";
  action_type: "create" | "update" | "delete";
  status: "success" | "warning" | "failed";
  actor_name: string;
  actor_role: "doctor" | "nurse" | "admin" | "patient";
  description: string;
  target_object?: string;
  timestamp: string;
}

interface ActivityResponse {
  total: number;
  limit: number;
  offset: number;
  results: ActivityEvent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн. назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  consultation: { label: "Консультация", icon: Stethoscope, color: "#3772ff", bg: "#ebf1ff" },
  appointment:  { label: "Выезд на дом", icon: Home,        color: "#8b5cf6", bg: "#f5f3ff" },
  patient:      { label: "Пациент",      icon: UserPlus,    color: "#10b981", bg: "#ecfdf5" },
  staff:        { label: "Персонал",     icon: Users,       color: "#f59e0b", bg: "#fffbeb" },
};

const ACTION_META: Record<string, { label: string; icon: any }> = {
  create: { label: "Создание", icon: UserPlus },
  update: { label: "Обновление", icon: Edit },
  delete: { label: "Удаление", icon: Trash2 },
};

const STATUS_META: Record<string, { icon: any; color: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-500" },
  warning: { icon: AlertCircle, color: "text-amber-500" },
  failed:  { icon: XCircle,     color: "text-red-500" },
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  doctor:  { label: "Врач",       color: "bg-blue-100 text-blue-700" },
  nurse:   { label: "Медсестра",  color: "bg-purple-100 text-purple-700" },
  admin:   { label: "Система",    color: "bg-gray-100 text-gray-600" },
  patient: { label: "Пациент",    color: "bg-emerald-100 text-emerald-700" },
};

const PAGE_SIZE = 30;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivityView({ user }: { user: any }) {
  const today = new Date().toISOString().split("T")[0];
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [actionType, setActionType] = useState("all");
  const [startDate, setStartDate] = useState(thirtyAgo);
  const [endDate, setEndDate] = useState(today);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String((p - 1) * PAGE_SIZE),
      category,
      start: startDate,
      end: endDate,
    });
    return `/activity/?${params}`;
  }, [category, startDate, endDate]);

  const fetchEvents = useCallback(async (p: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get<ActivityResponse>(buildUrl(p));
      setEvents(res.data.results);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Activity fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildUrl]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchEvents(1);
  }, [fetchEvents]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchEvents(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Client-side search filter
  const filtered = search.trim()
    ? events.filter(e =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.actor_name.toLowerCase().includes(search.toLowerCase()) ||
        e.target_object?.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  const displayed = actionType === "all"
    ? filtered
    : filtered.filter(e => e.action_type === actionType);

  // Stats
  const todayStr = today;
  const todayCount = events.filter(e => e.timestamp.startsWith(todayStr)).length;
  const successCount = events.filter(e => e.status === "success").length;
  const warningCount = events.filter(e => e.status === "warning").length;

  return (
    <div className="space-y-6 pb-12">

      {/* Date range + refresh */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <span className="text-gray-300 text-sm">—</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <button onClick={() => { setPage(1); fetchEvents(1, true); }}
          className="p-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="Обновить">
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Всего событий", value: total, icon: Activity, color: "#3772ff" },
          { label: "Сегодня",       value: todayCount, icon: Clock, color: "#8b5cf6" },
          { label: "Успешных",      value: successCount, icon: CheckCircle, color: "#10b981" },
          { label: "Предупреждений", value: warningCount, icon: AlertCircle, color: "#f59e0b" },
        ].map(s => (
          <KPICard key={s.label} label={s.label} value={String(s.value)} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по описанию или имени..."
            className="w-full pl-11 pr-8 py-2.5 text-sm rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category */}
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white">
          <option value="all">Все категории</option>
          <option value="consultation">Консультации</option>
          <option value="appointment">Выезды</option>
          <option value="patient">Пациенты</option>
          <option value="staff">Персонал</option>
        </select>

        {/* Action type */}
        <select value={actionType} onChange={e => setActionType(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white">
          <option value="all">Все действия</option>
          <option value="create">Создание</option>
          <option value="update">Обновление</option>
          <option value="delete">Удаление</option>
        </select>
      </div>

      {/* Category quick-filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Все" },
          ...Object.entries(CATEGORY_META).map(([key, m]) => ({ key, label: m.label })),
        ].map(item => (
          <button key={item.key} onClick={() => setCategory(item.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              category === item.key
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Загрузка журнала...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-3xl border-2 border-gray-100">
            <Activity className="w-12 h-12 text-gray-200" />
            <p className="text-gray-500 font-semibold">Нет событий</p>
            <p className="text-gray-400 text-sm">Попробуйте изменить фильтры или диапазон дат</p>
          </div>
        ) : (
          displayed.map(event => {
            const catMeta = CATEGORY_META[event.action_category] ?? CATEGORY_META.consultation;
            const CatIcon = catMeta.icon;
            const statusM = STATUS_META[event.status] ?? STATUS_META.success;
            const StatusIcon = statusM.icon;
            const roleStyle = ROLE_LABELS[event.actor_role] ?? ROLE_LABELS.admin;

            return (
              <div key={event.id}
                className="bg-white border-2 border-gray-100 hover:border-blue-200 rounded-3xl px-5 py-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all group">
                {/* Category icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: catMeta.bg }}>
                  <CatIcon className="w-4.5 h-4.5" style={{ color: catMeta.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-bold text-gray-900">{event.actor_name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleStyle.color}`}>
                      {roleStyle.label}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                      {catMeta.label}
                    </span>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusM.color}`} />
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(event.timestamp)}
                    </span>
                    <span title={fmtDate(event.timestamp)} className="cursor-default">
                      {fmtDate(event.timestamp)}
                    </span>
                    {event.target_object && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {event.target_object}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button onClick={() => goToPage(page - 1)} disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {(() => {
              const pages: (number | "...")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (page > 3) pages.push("...");
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                if (page < totalPages - 2) pages.push("...");
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                  <button key={p} onClick={() => goToPage(p as number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                      page === p
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}>
                    {p}
                  </button>
                )
              );
            })()}

            {/* Next */}
            <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Страница {page} из {totalPages} · {total} событий
          </p>
        </div>
      )}

      {!loading && displayed.length > 0 && totalPages <= 1 && (
        <p className="text-center text-xs text-gray-400">{total} событий</p>
      )}

    </div>
  );
}
