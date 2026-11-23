"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, Stethoscope, CalendarClock, Clock, ArrowUpRight, ChevronRight, Search } from "lucide-react";
import type { ClinicRoom, DoctorRoomAssignment } from "../types/roomTypes";
import { WEEKDAY_LABELS_FULL } from "../types/roomTypes";

interface RoomOverrideRow {
  id: number;
  doctor_id: number;
  // DoctorProfile pk — NOT the User pk /staff/{id}/... needs; use
  // doctor_user_id for navigation.
  doctor_user_id: number;
  doctor_name: string;
  doctor_first_name: string;
  doctor_last_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface DoctorScheduleTarget {
  id: number;
  first_name: string;
  last_name: string;
  // Set only for an override row (anchored to one exact date, unlike a
  // weekly assignment's "every Monday") — lets the schedule modal open
  // directly on the week containing this date instead of always today's.
  date?: string;
}

const MONTHS_SHORT_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const formatDateLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_SHORT_RU[d.getMonth()]}`;
};

// Read-only overview — editing happens exclusively from the doctor's own
// "Расписание" modal (Постоянное = weekly assignments, По датам =
// date-specific overrides), which is the single place both kinds of room
// data are actually created/changed. Keeping a second, independent write
// path here (the old "+ Назначить врача" form) risked drifting out of
// sync with that flow and offered no real advantage over it.
export function RoomAssignmentsModal({
  room,
  onClose,
  onOpenDoctorSchedule,
}: {
  room: ClinicRoom | null;
  onClose: () => void;
  onOpenDoctorSchedule: (doctor: DoctorScheduleTarget) => void;
}) {
  const [assignments, setAssignments] = useState<DoctorRoomAssignment[]>([]);
  const [overrides, setOverrides] = useState<RoomOverrideRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!room) return;
    setSearch("");
    setLoading(true);
    api.get(`/clinic-rooms/${room.id}/assignments/`)
      .then(res => {
        setAssignments(res.data?.assignments ?? []);
        setOverrides(res.data?.overrides ?? []);
      })
      .catch(() => toast.error("Не удалось загрузить назначения"))
      .finally(() => setLoading(false));
  }, [room?.id]);

  if (!room) return null;

  const searchLower = search.trim().toLowerCase();
  const filteredAssignments = searchLower
    ? assignments.filter(a => a.doctor_name.toLowerCase().includes(searchLower))
    : assignments;
  const filteredOverrides = searchLower
    ? overrides.filter(o => o.doctor_name.toLowerCase().includes(searchLower))
    : overrides;

  const grouped = WEEKDAY_LABELS_FULL.map((label, weekday) => ({
    weekday,
    label,
    items: filteredAssignments
      .filter(a => a.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));
  const isEmpty = assignments.length === 0 && overrides.length === 0;
  const noSearchResults = !isEmpty && searchLower && filteredAssignments.length === 0 && filteredOverrides.length === 0;
  const showSearch = assignments.length + overrides.length > 4;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onMouseDown={e => setMouseDownTarget(e.target)}
        onClick={e => {
          if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) onClose();
          setMouseDownTarget(null);
        }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col">

          <div className="px-7 py-5 flex items-center gap-4 flex-shrink-0 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              <CalendarClock size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-gray-900">Врачи и расписание кабинета</h3>
              <p className="text-xs text-gray-400 truncate">{room.name} · вместимость {room.capacity}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex items-start gap-2.5 px-4 py-3 mb-4 rounded-xl bg-orange-50 border border-orange-100 text-xs text-orange-700">
              <ArrowUpRight size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Только просмотр. Чтобы назначить врача или изменить расписание,
                откройте карточку врача → «Расписание» (вкладки «Постоянное» и «По датам»).
              </span>
            </div>

            {showSearch && (
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по врачу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                />
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : isEmpty ? (
              <p className="text-center text-sm text-gray-400 py-8">
                Пока нет врачей, назначенных на этот кабинет.
              </p>
            ) : noSearchResults ? (
              <p className="text-center text-sm text-gray-400 py-8">
                Врачи не найдены.
              </p>
            ) : (
              <div className="space-y-5">
                {grouped.some(g => g.items.length > 0) && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Постоянное расписание</p>
                    {grouped.filter(g => g.items.length > 0).map(g => (
                      <div key={g.weekday}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
                        <div className="space-y-2">
                          {g.items.map(a => (
                            <button key={a.id} type="button"
                              onClick={() => onOpenDoctorSchedule({ id: a.doctor_user_id, first_name: a.doctor_first_name, last_name: a.doctor_last_name })}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40 transition-colors text-left">
                              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                <Stethoscope size={15} className="text-orange-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{a.doctor_name}</p>
                                <p className="text-xs text-gray-500">
                                  {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                                  {(a.valid_from || a.valid_to) && (
                                    <span className="text-gray-400">
                                      {" · "}{a.valid_from || "…"} — {a.valid_to || "…"}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredOverrides.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Ближайшие переопределения</p>
                    {filteredOverrides.map(o => (
                      <button key={o.id} type="button"
                        onClick={() => onOpenDoctorSchedule({ id: o.doctor_user_id, first_name: o.doctor_first_name, last_name: o.doctor_last_name, date: o.date })}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Stethoscope size={15} className="text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{o.doctor_name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span className="font-semibold text-indigo-500">{formatDateLabel(o.date)}</span>
                            <Clock size={11} className="text-gray-400" />
                            {o.start_time}–{o.end_time}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose}
              className="w-full px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Закрыть
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
