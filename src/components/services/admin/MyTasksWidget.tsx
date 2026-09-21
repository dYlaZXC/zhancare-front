"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, ListChecks, Check, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

import type { AdminTask } from "./tasks/types/taskTypes";

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function MyTasksWidget({ userId }: { userId: number }) {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin-tasks/");
      const list: AdminTask[] = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      // "Мои задачи" — filtered to tasks ASSIGNED to me, not tasks I merely
      // created for someone else (the full /admin/tasks page shows both;
      // this dashboard glance is personal-only, per the mockup).
      setTasks(list.filter((t) => t.assigned_to_user_id === userId && t.status !== "cancelled"));
    } catch {
      toast.error("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleComplete = async (t: AdminTask) => {
    setBusyIds((prev) => new Set(prev).add(t.id));
    try {
      const res = await api.post(`/admin-tasks/${t.id}/complete/`);
      setTasks((prev) => prev.map((x) => (x.id === t.id ? res.data : x)).filter((x) => x.status === "pending"));
    } catch {
      toast.error("Не удалось отметить задачу выполненной");
    } finally {
      setBusyIds((prev) => { const next = new Set(prev); next.delete(t.id); return next; });
    }
  };

  const now = new Date();
  const open = tasks.filter((t) => t.status === "pending");
  const overdue = open.filter((t) => new Date(t.due_at) < now);
  const today = open.filter((t) => new Date(t.due_at) >= now && isSameDay(new Date(t.due_at), now));

  if (loading) {
    return (
      <div className="rounded-3xl p-6 bg-white border border-gray-100 shadow-sm flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (overdue.length === 0 && today.length === 0) return null;

  const renderRow = (t: AdminTask, overdueRow: boolean) => (
    <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${overdueRow ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-white"}`}>
      <button onClick={() => handleComplete(t)} disabled={busyIds.has(t.id)}
        className="w-6 h-6 rounded-lg border-2 border-gray-300 hover:border-emerald-400 flex items-center justify-center flex-shrink-0 transition-colors">
        {busyIds.has(t.id) ? <Loader2 size={11} className="animate-spin text-gray-400" /> : null}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{t.title}</p>
        <p className={`text-xs flex items-center gap-1 mt-0.5 ${overdueRow ? "text-red-500 font-semibold" : "text-gray-500"}`}>
          <Clock size={10} />
          {formatTime(t.due_at)}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 bg-white border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-emerald-600" />
          Мои задачи
        </h3>
        <Link href="/admin/tasks" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
          Все задачи →
        </Link>
      </div>

      <div className="space-y-4">
        {overdue.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Просрочено · {overdue.length}
            </p>
            <div className="space-y-2">{overdue.map((t) => renderRow(t, true))}</div>
          </div>
        )}
        {today.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Сегодня · {today.length}</p>
            <div className="space-y-2">{today.map((t) => renderRow(t, false))}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MyTasksWidget;
