"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, ListChecks, Plus, Search, Check, Trash2, Pencil, Clock, AlertTriangle } from "lucide-react";

import type { AdminTask } from "./tasks/types/taskTypes";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "./tasks/types/taskTypes";
import { TaskFormModal } from "./tasks/modals/TaskFormModal";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type Group = "today" | "upcoming" | "overdue" | "completed";

function groupOf(task: AdminTask, now: Date): Group | null {
  if (task.status === "cancelled") return null;
  if (task.status === "completed") return "completed";
  const due = new Date(task.due_at);
  if (due < now) return "overdue";
  if (isSameDay(due, now)) return "today";
  return "upcoming";
}

const GROUP_LABELS: Record<Group, string> = {
  today: "Сегодня",
  upcoming: "Предстоящие",
  overdue: "Просроченные",
  completed: "Выполненные",
};
const GROUP_ORDER: Group[] = ["today", "upcoming", "overdue", "completed"];

export function TasksView({ user }: { user: any }) {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin-tasks/");
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setTasks(list);
    } catch {
      toast.error("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => { setEditingTask(null); setShowFormModal(true); };
  const openEdit = (t: AdminTask) => { setEditingTask(t); setShowFormModal(true); };

  const withBusy = async (id: number, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try { await fn(); } finally {
      setBusyIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  // PermissionDenied responses use {"detail": "..."}, the complete/reopen
  // status-transition guard uses {"status": "..."}, and other places use
  // {"error": "..."} — check all three rather than falling back to a
  // generic message when the backend already sent a specific one (e.g. "Не
  // выполнено, эта задача уже отменена").
  const extractErrorMessage = (err: any, fallback: string): string => {
    const data = err?.response?.data;
    return data?.status || data?.detail || data?.error || fallback;
  };

  const handleToggleComplete = (t: AdminTask) => withBusy(t.id, async () => {
    try {
      const action = t.status === "completed" ? "reopen" : "complete";
      const res = await api.post(`/admin-tasks/${t.id}/${action}/`);
      setTasks((prev) => prev.map((x) => (x.id === t.id ? res.data : x)));
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Не удалось изменить статус"));
    }
  });

  const handleDelete = (t: AdminTask) => withBusy(t.id, async () => {
    if (!confirm(`Удалить задачу «${t.title}»?`)) return;
    try {
      await api.delete(`/admin-tasks/${t.id}/`);
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: "cancelled" } : x)));
      toast.success("Задача удалена");
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Не удалось удалить задачу"));
    }
  });

  const searchLower = search.trim().toLowerCase();
  const now = useMemo(() => new Date(), [tasks]);

  const grouped = useMemo(() => {
    const map: Record<Group, AdminTask[]> = { today: [], upcoming: [], overdue: [], completed: [] };
    for (const t of tasks) {
      if (searchLower && !t.title.toLowerCase().includes(searchLower)) continue;
      const g = groupOf(t, now);
      if (g) map[g].push(t);
    }
    for (const g of GROUP_ORDER) {
      map[g].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
    }
    return map;
  }, [tasks, searchLower, now]);

  const activeCount = tasks.filter((t) => t.status === "pending").length;
  const overdueCount = grouped.overdue.length;
  const isEmpty = !loading && GROUP_ORDER.every((g) => grouped[g].length === 0);

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Задачи</h1>
            <p className="text-gray-600">Личные и командные задачи с автоматическими напоминаниями</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}>
            <Plus className="w-5 h-5" />
            Новая задача
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Активных задач", value: activeCount, color: "#059669", bg: "#d1fae5" },
            { label: "Просрочено", value: overdueCount, color: "#ef4444", bg: "#fee2e2" },
            { label: "Выполнено", value: grouped.completed.length, color: "#6b7280", bg: "#e5e7eb" },
          ].map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl p-4 border border-gray-100 shadow-sm" style={{ backgroundColor: stat.bg }}>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Поиск по названию задачи..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : isEmpty ? (
        <div className="text-center py-16 text-gray-400">
          <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Задач пока нет</p>
          <p className="text-sm mt-1">Нажмите «Новая задача», чтобы создать первую</p>
        </div>
      ) : (
        <div className="space-y-8">
          {GROUP_ORDER.filter((g) => grouped[g].length > 0).map((g) => (
            <div key={g}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                {g === "overdue" && <AlertTriangle size={13} className="text-red-500" />}
                {GROUP_LABELS[g]} · {grouped[g].length}
              </p>
              <div className="space-y-2">
                {grouped[g].map((t) => {
                  const busy = busyIds.has(t.id);
                  const overdue = g === "overdue";
                  const priorityStyle = PRIORITY_COLORS[t.priority];
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white transition-colors ${overdue ? "border-red-200" : "border-gray-200"}`}>
                      <button onClick={() => handleToggleComplete(t)} disabled={busy}
                        title={t.status === "completed" ? "Вернуть в работу" : "Отметить выполненной"}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                          t.status === "completed"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-gray-300 text-transparent hover:border-emerald-400"
                        }`}>
                        {t.status === "completed" && <Check size={15} />}
                      </button>

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(t)}>
                        <p className={`text-sm font-semibold truncate ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {t.title}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-semibold" : ""}`}>
                            <Clock size={11} />
                            {formatDateTime(t.due_at)}
                          </span>
                          <span>· {t.assigned_to_name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ color: priorityStyle.text, backgroundColor: priorityStyle.bg }}>
                            {PRIORITY_LABELS[t.priority]}
                          </span>
                        </p>
                      </div>

                      <button onClick={() => openEdit(t)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
                        <Pencil size={14} className="text-gray-400" />
                      </button>
                      <button onClick={() => handleDelete(t)} disabled={busy}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0">
                        <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showFormModal && (
          <TaskFormModal
            mode={editingTask ? "edit" : "create"}
            initial={editingTask}
            onClose={() => setShowFormModal(false)}
            onSaved={(saved) => {
              setTasks((prev) => (editingTask ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]));
              setShowFormModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TasksView;
