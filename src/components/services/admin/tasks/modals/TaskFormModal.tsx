"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, Save, ListChecks } from "lucide-react";
import type { AdminTask, AssignableAdmin, TaskFormData, TaskPriority } from "../types/taskTypes";
import { EMPTY_TASK_FORM, PRIORITY_LABELS, REMINDER_OFFSET_OPTIONS } from "../types/taskTypes";

const toLocalDateStr = (d: Date) => d.toLocaleDateString("sv-SE");
const toLocalTimeStr = (d: Date) => d.toTimeString().slice(0, 5);

function buildInitialForm(initial: AdminTask | null): TaskFormData {
  if (!initial) {
    const now = new Date();
    return { ...EMPTY_TASK_FORM, date: toLocalDateStr(now) };
  }
  const due = new Date(initial.due_at);
  let reminderOffset = "none";
  if (initial.remind_at) {
    const remind = new Date(initial.remind_at);
    const diffMinutes = Math.round((due.getTime() - remind.getTime()) / 60000);
    const match = REMINDER_OFFSET_OPTIONS.find((o) => o.minutes === diffMinutes);
    reminderOffset = match ? match.value : String(diffMinutes);
  }
  return {
    title: initial.title,
    description: initial.description || "",
    assigned_to: initial.assigned_to,
    date: toLocalDateStr(due),
    time: toLocalTimeStr(due),
    reminderOffset,
    priority: initial.priority,
  };
}

export function TaskFormModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: AdminTask | null;
  onClose: () => void;
  onSaved: (task: AdminTask) => void;
}) {
  const [form, setForm] = useState<TaskFormData>(() => buildInitialForm(initial));
  const [admins, setAdmins] = useState<AssignableAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  useEffect(() => {
    api.get("/admin-tasks/assignable_admins/")
      .then((res) => setAdmins(res.data?.admins ?? []))
      .catch(() => toast.error("Не удалось загрузить список администраторов"))
      .finally(() => setLoadingAdmins(false));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Введите название задачи"); return; }
    if (!form.assigned_to) { toast.error("Выберите ответственного"); return; }
    if (!form.date) { toast.error("Укажите дату выполнения"); return; }

    const dueAt = new Date(`${form.date}T${form.time || "00:00"}:00`);
    const offsetOption = REMINDER_OFFSET_OPTIONS.find((o) => o.value === form.reminderOffset);
    let remindAt: string | null = null;
    if (offsetOption && offsetOption.minutes !== null) {
      remindAt = new Date(dueAt.getTime() - offsetOption.minutes * 60000).toISOString();
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        assigned_to: form.assigned_to,
        due_at: dueAt.toISOString(),
        remind_at: remindAt,
        priority: form.priority,
      };
      let res;
      if (mode === "edit" && initial) {
        res = await api.patch(`/admin-tasks/${initial.id}/`, payload);
        toast.success("Задача обновлена");
      } else {
        res = await api.post("/admin-tasks/", payload);
        toast.success("Задача создана");
      }
      onSaved(res.data);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = Array.isArray(data) ? data.join("; ") : (data?.error || data?.detail || Object.values(data || {})[0]);
      toast.error(typeof msg === "string" ? msg : "Не удалось сохранить задачу");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onMouseDown={(e) => setMouseDownTarget(e.target)}
        onClick={(e) => {
          if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) onClose();
          setMouseDownTarget(null);
        }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col">

          <div className="px-7 py-5 flex items-center gap-4 flex-shrink-0 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              <ListChecks size={18} className="text-white" />
            </div>
            <h3 className="text-base font-black text-gray-900 flex-1">
              {mode === "edit" ? "Редактировать задачу" : "Новая задача"}
            </h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Название</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Например: Позвонить пациенту"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Описание</label>
              <textarea value={form.description} rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Необязательно"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Дата</label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Время</label>
                <input type="time" value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Напомнить</label>
              <select value={form.reminderOffset}
                onChange={(e) => setForm((f) => ({ ...f, reminderOffset: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors bg-white">
                {REMINDER_OFFSET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Приоритет</label>
                <select value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors bg-white">
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ответственный</label>
                <select value={form.assigned_to ?? ""}
                  disabled={loadingAdmins}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors bg-white disabled:opacity-50">
                  <option value="">{loadingAdmins ? "Загрузка..." : "Выберите..."}</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {`${a.last_name} ${a.first_name}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Сохранить
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TaskFormModal;
