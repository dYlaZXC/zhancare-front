"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import Link from "next/link";

interface ClinicAppointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  clinic_name: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  consultation_started_at: string | null;
  consultation_ended_at: string | null;
  duration_seconds: number | null;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OfflineConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [appointment, setAppointment] = useState<ClinicAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const fetchAppointment = useCallback(async () => {
    try {
      const { data } = await api.get<ClinicAppointment>(`/clinic-appointments/${id}/`);
      setAppointment(data);
      setNotes(data.notes || "");
      if (data.consultation_started_at && !data.consultation_ended_at) {
        startTimeRef.current = new Date(data.consultation_started_at).getTime();
      }
      if (data.duration_seconds) {
        setElapsed(data.duration_seconds);
      }
    } catch {
      toast.error("Не удалось загрузить приём");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

  // Timer — runs only when consultation is in_progress
  useEffect(() => {
    if (appointment?.status !== "in_progress" || !startTimeRef.current) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [appointment?.status]);

  const handleStart = async () => {
    try {
      const { data } = await api.post<ClinicAppointment>(`/clinic-appointments/${id}/start-consultation/`);
      setAppointment(data);
      startTimeRef.current = new Date(data.consultation_started_at!).getTime();
      toast.success("Консультация начата");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Ошибка при старте");
    }
  };

  const handleEnd = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const { data } = await api.post<ClinicAppointment>(`/clinic-appointments/${id}/end-consultation/`);
      setAppointment(data);
      if (data.duration_seconds) setElapsed(data.duration_seconds);
      toast.success("Консультация завершена");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Ошибка при завершении");
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/clinic-appointments/${id}/`, { notes });
      toast.success("Заметки сохранены");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white gap-4">
        <p className="text-gray-400">Приём не найден</p>
        <Link href="/doctor/appointments" className="text-emerald-400 hover:underline text-sm">← Назад к приёмам</Link>
      </div>
    );
  }

  const isOngoing = appointment.status === "in_progress";
  const isCompleted = appointment.status === "completed";
  const isPending = !isOngoing && !isCompleted;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
          ← Назад
        </button>
        <div className="w-px h-5 bg-white/10" />
        <div>
          <p className="text-sm font-semibold">{appointment.patient_name}</p>
          <p className="text-xs text-gray-500">Офлайн консультация · {appointment.clinic_name}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isOngoing ? "bg-emerald-500/20 text-emerald-400" :
            isCompleted ? "bg-gray-700 text-gray-400" :
            "bg-amber-500/20 text-amber-400"
          }`}>
            {isOngoing ? "В процессе" : isCompleted ? "Завершена" : "Ожидание"}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-10 gap-8">

        {/* Timer block */}
        <div className="flex flex-col items-center gap-4">
          <div className={`text-7xl font-mono font-bold tabular-nums tracking-tight ${
            isOngoing ? "text-emerald-400" : isCompleted ? "text-gray-500" : "text-gray-600"
          }`}>
            {formatDuration(elapsed)}
          </div>

          {isPending && (
            <button
              onClick={handleStart}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-8 py-3 rounded-2xl text-base transition-all shadow-lg shadow-emerald-900/40"
            >
              ▶ Начать консультацию
            </button>
          )}

          {isOngoing && (
            <button
              onClick={handleEnd}
              className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold px-8 py-3 rounded-2xl text-base transition-all shadow-lg shadow-red-900/40"
            >
              ■ Завершить консультацию
            </button>
          )}

          {isCompleted && appointment.duration_seconds && (
            <p className="text-gray-500 text-sm">
              Длительность: <span className="text-gray-300 font-medium">{Math.floor(appointment.duration_seconds / 60)} мин {appointment.duration_seconds % 60} сек</span>
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="w-full max-w-lg">
          <label className="block text-sm text-gray-400 mb-2">Заметки врача</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Жалобы, назначения, рекомендации..."
            disabled={isCompleted}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50"
          />
          {!isCompleted && (
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
            >
              {savingNotes ? "Сохранение..." : "Сохранить заметки"}
            </button>
          )}
        </div>

        {/* Patient info */}
        <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl px-5 py-4 space-y-2 text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Информация о приёме</p>
          <div className="flex justify-between">
            <span className="text-gray-500">Пациент</span>
            <span className="text-white font-medium">{appointment.patient_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Врач</span>
            <span className="text-white">{appointment.doctor_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Клиника</span>
            <span className="text-white">{appointment.clinic_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Время приёма</span>
            <span className="text-white">
              {new Date(appointment.appointment_time).toLocaleString("ru-KZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}
