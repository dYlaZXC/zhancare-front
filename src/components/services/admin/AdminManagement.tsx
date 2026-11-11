"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { KPICard } from "./dashboardUI";
import {
  Users,
  UserPlus,
  Search,
  Building2,
  CheckCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import type { Admin, Clinic } from "./admin-management/types/adminTypes";
import FilterTypeDropdown from "./admin-management/components/FilterTypeDropdown";
import ClinicSearchDropdown from "./admin-management/components/ClinicSearchDropdown";
import AdminRow from "./admin-management/components/AdminRow";
import AdminFormModal from "./admin-management/modals/AdminFormModal";

const PAGE_SIZE = 15;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterClinic, setFilterClinic] = useState<string>("");

  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Admin | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterClinic) params.set("clinic_id", filterClinic);
      if (filterType) params.set("admin_type", filterType);
      const res = await api.get(`/admins/${params.toString() ? `?${params}` : ""}`);
      setAdmins(res.data.admins || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Не удалось загрузить администраторов");
    } finally {
      setLoading(false);
    }
  }, [filterClinic, filterType]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    api
      .get("/clinics/")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) setClinics(data);
        else if (Array.isArray(data?.clinics)) setClinics(data.clinics);
        else if (Array.isArray(data?.results)) setClinics(data.results);
      })
      .catch(() => {});
  }, []);

  const handleSaved = (admin: Admin) => {
    setAdmins((prev) => {
      const exists = prev.find((a) => a.id === admin.id);
      if (exists) return prev.map((a) => (a.id === admin.id ? admin : a));
      return [admin, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
  };

  const handleToggleActive = async (admin: Admin) => {
    if (togglingId) return;
    setTogglingId(admin.id);
    try {
      const res = await api.delete(`/admins/${admin.id}/`);
      const updated: Admin = res.data.admin;
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success(updated.is_active ? "Администратор активирован" : "Администратор деактивирован");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка изменения статуса");
    } finally {
      setTogglingId(null);
    }
  };

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterType, filterClinic]);

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.clinic?.name || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (safePage > 3) pageNumbers.push("…");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pageNumbers.push(i);
    if (safePage < totalPages - 2) pageNumbers.push("…");
    pageNumbers.push(totalPages);
  }

  const stats = [
    {
      label: "Всего",
      value: admins.length,
      icon: Users,
      color: "#3772ff",
    },
    {
      label: "Активных",
      value: admins.filter((a) => a.is_active).length,
      icon: CheckCircle,
      color: "#10b981",
    },
    {
      label: "Клиник",
      value: new Set(admins.filter((a) => a.clinic).map((a) => a.clinic!.id)).size,
      icon: Building2,
      color: "#8b5cf6",
    },
    {
      label: "Менеджеров",
      value: admins.filter((a) => a.admin_type === "manager").length,
      icon: Lock,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]" style={{ background: "#f8fafc" }}>

      {/* ── Gradient Hero Header ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20"
               style={{ background: "radial-gradient(circle, #3772ff 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-2xl opacity-10"
               style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 px-6 pt-8 pb-6 lg:px-10">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  Администраторы клиник
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Управление учётными записями и правами доступа
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchAdmins}
                className="p-2.5 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                title="Обновить"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg transition-all"
                style={{ background: "rgba(255,255,255,0.95)", color: "#1e263e" }}
              >
                <UserPlus className="w-4 h-4" />
                Создать администратора
              </motion.button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <KPICard
                key={stat.label}
                label={stat.label}
                value={String(stat.value)}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, email, клинике..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Type filter */}
          <div className="min-w-[200px]">
            <FilterTypeDropdown value={filterType} onChange={setFilterType} />
          </div>

          {/* Clinic filter */}
          {clinics.length > 0 && (
            <div className="min-w-[220px]">
              <ClinicSearchDropdown
                clinics={clinics}
                value={filterClinic}
                onChange={setFilterClinic}
                nullLabel="Все клиники"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Table Area ────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#3772ff" }} />
            <span className="text-gray-500 font-medium">Загрузка администраторов...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-700 font-medium">{error}</p>
            <button
              onClick={fetchAdmins}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">Администраторы не найдены</p>
            <p className="text-sm text-gray-400">
              {search ? "Попробуйте изменить поисковый запрос" : "Создайте первого администратора"}
            </p>
            {!search && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md"
                style={{ background: "linear-gradient(135deg, #29358f, #3772ff)" }}
              >
                <UserPlus className="w-4 h-4" />
                Создать администратора
              </motion.button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100"
                      style={{ background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Администратор
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Клиника
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Тип
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Права
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Статус
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((admin) => (
                    <AdminRow
                      key={admin.id}
                      admin={admin}
                      onEdit={setEditTarget}
                      onToggleActive={handleToggleActive}
                      toggling={togglingId === admin.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3.5 border-t-2 border-gray-100 flex items-center justify-between gap-4"
                 style={{ background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)" }}>
              <p className="text-xs text-gray-400 font-medium shrink-0">
                {filtered.length === 0
                  ? "0 записей"
                  : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} из ${filtered.length}`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {pageNumbers.map((n, i) =>
                    typeof n === "string" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400 select-none">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          safePage === n ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex gap-1 shrink-0">
                {stats.slice(0, 3).map((s) => (
                  <span key={s.label} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${s.color}15`, color: s.color }}>
                    {s.label}: {s.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showCreate || editTarget) && (
          <AdminFormModal
            key="form"
            mode={showCreate ? "create" : "edit"}
            initial={editTarget}
            clinics={clinics}
            onClose={() => {
              setShowCreate(false);
              setEditTarget(null);
            }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
