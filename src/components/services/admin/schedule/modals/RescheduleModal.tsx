"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Clock, MoveRight, History, Loader2, ChevronDown } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { ScheduleEvent } from "../types/scheduleTypes";

interface RescheduleModalProps {
  event: ScheduleEvent;
  onClose: () => void;
  onRescheduled: () => void;
}

interface RescheduleHistoryEntry {
  id: number;
  old_datetime: string | null;
  new_datetime: string;
  reason: string;
  changed_by: string | null;
  changed_at: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function RescheduleModal({ event, onClose, onRescheduled }: RescheduleModalProps) {
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<RescheduleHistoryEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const unchanged = date === event.date && time === event.time;
  const trimmedReason = reason.trim();

  const toggleHistory = async () => {
    if (historyOpen) { setHistoryOpen(false); return; }
    setHistoryOpen(true);
    if (history !== null) return;
    setLoadingHistory(true);
    try {
      const { data } = await api.get<RescheduleHistoryEntry[]>(`/schedule/${event.id}/reschedule-history/`);
      setHistory(data);
    } catch {
      toast.error("Не удалось загрузить историю переносов");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (unchanged || !trimmedReason) return;
    setLoading(true);
    try {
      await api.patch(`/schedule/${event.id}/`, { date, time, reason: trimmedReason });
      toast.success("Запись перенесена");
      onRescheduled();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось перенести запись");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #12263a 0%, #1e263e 40%, #3772ff 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-blue-300" />
              <span className="text-white font-bold text-base">Перенос записи</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Patient info */}
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-0.5">Пациент</p>
                {!!event.reschedule_count && (
                  <button
                    type="button"
                    onClick={toggleHistory}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex-shrink-0"
                  >
                    <History className="w-3 h-3" />
                    Перенесена {event.reschedule_count} {event.reschedule_count === 1 ? 'раз' : 'раза'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900">{event.patient_name}</p>
              {event.doctor_name && (
                <p className="text-xs text-gray-500 mt-0.5">Врач: {event.doctor_name}</p>
              )}
            </div>

            {/* Reschedule history — lazy loaded */}
            <AnimatePresence initial={false}>
              {historyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="bg-amber-50/60 rounded-xl px-3 py-2.5 space-y-2 max-h-44 overflow-y-auto">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      </div>
                    ) : !history || history.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">История переносов пуста</p>
                    ) : (
                      history.map(h => (
                        <div key={h.id} className="text-xs border-b border-amber-100 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
                            {h.old_datetime && <span>{formatDateTime(h.old_datetime)}</span>}
                            {h.old_datetime && <MoveRight className="w-3 h-3 text-amber-400" />}
                            <span>{formatDateTime(h.new_datetime)}</span>
                          </div>
                          <p className="text-gray-500 mt-0.5">«{h.reason}»</p>
                          <p className="text-gray-400 mt-0.5">
                            {h.changed_by ?? 'Администратор'} · {formatDateTime(h.changed_at)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current → New */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Сейчас</p>
                <p className="font-bold text-gray-700">{event.date}</p>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
              <MoveRight className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2.5 text-center border border-blue-200">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 mb-0.5">Новое</p>
                <p className="font-bold text-blue-700">{date}</p>
                <p className="text-xs text-blue-500">{time}</p>
              </div>
            </div>

            {/* Date picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Новая дата
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Time picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Новое время
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Reason — required */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Причина переноса <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={loading}
                rows={2}
                placeholder="Например: пациент попросил перенести на другое время"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 focus:outline-none transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || unchanged || !trimmedReason}
                title={!trimmedReason ? "Укажите причину переноса" : undefined}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #3772ff, #2c5bcc)" }}
              >
                {loading ? "Сохранение..." : "Перенести"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
