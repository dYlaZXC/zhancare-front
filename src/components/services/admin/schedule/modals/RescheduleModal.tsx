"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Clock, MoveRight } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { ScheduleEvent } from "../types/scheduleTypes";

interface RescheduleModalProps {
  event: ScheduleEvent;
  onClose: () => void;
  onRescheduled: () => void;
}

export default function RescheduleModal({ event, onClose, onRescheduled }: RescheduleModalProps) {
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [loading, setLoading] = useState(false);

  const unchanged = date === event.date && time === event.time;

  const handleSubmit = async () => {
    if (unchanged) return;
    setLoading(true);
    try {
      await api.patch(`/schedule/${event.id}/`, { date, time });
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
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-0.5">Пациент</p>
              <p className="text-sm font-bold text-gray-900">{event.patient_name}</p>
              {event.doctor_name && (
                <p className="text-xs text-gray-500 mt-0.5">Врач: {event.doctor_name}</p>
              )}
            </div>

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
                disabled={loading || unchanged}
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
