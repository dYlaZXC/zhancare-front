"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Archive,
  Search,
  Video,
  Home,
  RotateCcw,
  Loader2,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  FlaskConical,
  MessageSquareText,
} from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

interface ArchivedEvent {
  id: string;
  type: "consultation" | "appointment" | "diagnostics";
  consultation_type?: "online" | "offline";
  patient_name: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  nurse_name?: string;
  service_name?: string;
  clinic_name?: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  address?: string;
  deletion_reason?: string;
}

interface ArchivedRecordsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Запланировано",
  in_progress: "В процессе",
  completed: "Завершено",
  cancelled: "Отменено",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function ArchivedRow({ event, isRestoring, onRestore }: { event: ArchivedEvent; isRestoring: boolean; onRestore: (event: ArchivedEvent) => void }) {
  const isOnline = event.type === "consultation" && event.consultation_type !== "offline";
  const iconBg = event.type === "consultation"
    ? (isOnline ? "#ebf1ff" : "#f0fdf4")
    : event.type === "diagnostics"
    ? "#cffafe"
    : "#f5f3ff";

  return (
    <div className="flex gap-3 items-start px-4 py-3.5">
      {/* Type icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {event.type === "consultation"
          ? <Video className="w-4 h-4" style={{ color: isOnline ? "#3772ff" : "#059669" }} />
          : event.type === "diagnostics"
          ? <FlaskConical className="w-4 h-4 text-cyan-600" />
          : <Home className="w-4 h-4 text-violet-500" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? "bg-gray-100 text-gray-500"}`}>
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {event.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {event.time} · {event.duration} мин
          </span>
        </div>

        {event.doctor_name && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Stethoscope className="w-3 h-3" />
            {event.doctor_name}
            {event.doctor_specialization && ` · ${event.doctor_specialization}`}
          </div>
        )}
        {event.nurse_name && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <User className="w-3 h-3" />
            {event.nurse_name}
          </div>
        )}
        {event.service_name && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <FlaskConical className="w-3 h-3" />
            {event.service_name}
          </div>
        )}
        {event.address && (
          <p className="mt-1 text-xs text-gray-400 truncate">{event.address}</p>
        )}
        {event.deletion_reason && (
          <div className="flex items-start gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-lg bg-red-50/60 text-xs text-red-600">
            <MessageSquareText className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{event.deletion_reason}</span>
          </div>
        )}
      </div>

      {/* Restore button */}
      <button
        onClick={() => onRestore(event)}
        disabled={isRestoring}
        title="Восстановить запись"
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all disabled:opacity-40"
      >
        {isRestoring
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <RotateCcw className="w-3.5 h-3.5" />
        }
        {isRestoring ? "..." : "Вернуть"}
      </button>
    </div>
  );
}

function ArchivedPatientGroup({ events, restoringId, onRestore }: { events: ArchivedEvent[]; restoringId: string | null; onRestore: (event: ArchivedEvent) => void }) {
  const first = events[0];
  const initials = first.patient_name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Patient header — shown once for all their archived bookings */}
      <div className="px-4 py-3 flex items-center gap-3 bg-blue-50/60 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3772ff, #2c5bcc)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{first.patient_name}</p>
          {first.patient_phone && (
            <p className="text-xs text-gray-500 mt-0.5">{first.patient_phone}</p>
          )}
        </div>
        <span className="text-xs font-bold text-gray-400 flex-shrink-0">
          {events.length} {events.length === 1 ? 'запись' : 'записи'}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {events.map(event => (
          <ArchivedRow key={event.id} event={event} isRestoring={restoringId === event.id} onRestore={onRestore} />
        ))}
      </div>
    </div>
  );
}

export default function ArchivedRecordsDrawer({ isOpen, onClose, onRestored }: ArchivedRecordsDrawerProps) {
  const [events, setEvents] = useState<ArchivedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchArchive = async () => {
      setLoading(true);
      try {
        const res = await api.get("/schedule/archive/");
        setEvents(res.data);
      } catch {
        toast.error("Не удалось загрузить архив");
      } finally {
        setLoading(false);
      }
    };
    fetchArchive();
  }, [isOpen]);

  const handleRestore = async (event: ArchivedEvent) => {
    setRestoringId(event.id);
    try {
      await api.post(`/schedule/${event.id}/restore/`);
      toast.success("Запись восстановлена");
      setEvents(prev => prev.filter(e => e.id !== event.id));
      onRestored();
    } catch {
      toast.error("Не удалось восстановить запись");
    } finally {
      setRestoringId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? events.filter(e =>
        e.patient_name?.toLowerCase().includes(q) ||
        e.doctor_name?.toLowerCase().includes(q) ||
        e.nurse_name?.toLowerCase().includes(q) ||
        e.patient_phone?.includes(q) ||
        e.date?.includes(q)
      )
    : events;

  // Group by patient so the same person's bookings don't repeat their name/phone in every card
  const groupsByPatient = new Map<string, ArchivedEvent[]>();
  for (const e of filtered) {
    const key = `${e.patient_name}|${e.patient_phone ?? ''}`;
    if (!groupsByPatient.has(key)) groupsByPatient.set(key, []);
    groupsByPatient.get(key)!.push(e);
  }
  const patientGroups = Array.from(groupsByPatient.values());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)" }}
            >
              <div className="flex items-center gap-3 text-white">
                <Archive className="w-5 h-5 text-blue-300" />
                <div>
                  <h2 className="text-lg font-bold">Архив записей</h2>
                  <p className="text-blue-200 text-xs mt-0.5">Удалённые записи · данные сохранены</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по пациенту, врачу, дате..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">Загрузка архива...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Archive className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-semibold">
                    {q ? "Ничего не найдено" : "Архив пуст"}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {q ? "Попробуйте изменить запрос" : "Удалённые записи появятся здесь"}
                  </p>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {filtered.length} {filtered.length === 1 ? "запись" : "записей"}
                    {patientGroups.length > 1 && ` · ${patientGroups.length} пациента`}
                    {q && <span className="normal-case font-normal ml-1 text-blue-400">· «{search.trim()}»</span>}
                  </p>
                  {patientGroups.map(group => (
                    <ArchivedPatientGroup
                      key={`${group[0].patient_name}|${group[0].patient_phone ?? ''}`}
                      events={group}
                      restoringId={restoringId}
                      onRestore={handleRestore}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors text-sm"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
