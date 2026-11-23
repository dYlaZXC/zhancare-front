"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import {
  Search, Loader2, DoorOpen, AlertTriangle, Clock,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Stethoscope, Layers,
} from "lucide-react";
import type { ScheduleEvent } from "../types/scheduleTypes";
import { roomTypeLabel } from "../../rooms/types/roomTypes";

interface RoomAssignmentDay {
  doctor_id: number;
  doctor_name: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

interface RoomDay {
  id: number;
  name: string;
  number: string | null;
  floor: string | null;
  room_type: string;
  capacity: number;
  status: string;
  assignments: RoomAssignmentDay[];
}

interface RoomsScheduleContentProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  events: ScheduleEvent[];
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

// Real interval overlap between a booked event and one doctor's time-band
// within a room — keying on time overlap (not just room_id) is what
// correctly separates two doctors sharing a capacity>1 room at overlapping
// hours, and also separates the SAME doctor's two different bands in the
// same room on the same day (e.g. a morning and an evening shift).
function eventOverlapsAssignment(e: ScheduleEvent, a: RoomAssignmentDay): boolean {
  const eventEnd = addMinutes(e.time, e.duration);
  return e.time < a.end_time && eventEnd > a.start_time;
}

// room_id is legitimately null for online consultations, home visits, and
// diagnostics too — none of those ever get a room and shouldn't be flagged
// as "missing" one. Only a real offline consultation/clinic-appointment
// event with no room counts as needing one.
function isRoomEligibleOfflineEvent(e: ScheduleEvent): boolean {
  return e.type === 'consultation' && e.consultation_type === 'offline';
}

export function RoomsScheduleContent({
  selectedDate,
  onDateChange,
  events,
}: RoomsScheduleContentProps) {
  const [rooms, setRooms] = useState<RoomDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/clinic-rooms/rooms-day/', { params: { date: selectedDate } });
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const toggleRoom = (id: number) => {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getWeekStrip = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    const jsDay = d.getDay();
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const weekDays = getWeekStrip();

  const shiftWeek = (direction: 'prev' | 'next') => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(d.toLocaleDateString('sv-SE'));
  };

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.number ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unassignedEvents = events.filter(e =>
    e.date === selectedDate && !e.room_id && isRoomEligibleOfflineEvent(e)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Week strip */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => shiftWeek('prev')} title="Предыдущая неделя"
            className="flex-shrink-0 p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {weekDays.map((day, i) => {
            const ds = day.toLocaleDateString('sv-SE');
            const isSelected = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <button key={ds} onClick={() => onDateChange(ds)}
                className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'text-white shadow-md border-transparent'
                    : isToday
                    ? 'bg-orange-50 text-orange-600 border-orange-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                style={isSelected ? { background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' } : undefined}>
                <span className="text-[10px] font-medium mb-0.5 opacity-80">{DAY_NAMES[i]}</span>
                <span className="text-sm font-bold">{day.getDate()}</span>
                {isToday && (
                  <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-orange-100' : 'text-orange-500'}`}>
                    Сегодня
                  </span>
                )}
              </button>
            );
          })}
          <button type="button" onClick={() => shiftWeek('next')} title="Следующая неделя"
            className="flex-shrink-0 p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Поиск кабинета..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors" />
        </div>
      </div>

      {/* "Без кабинета" worklist — real offline appointments with no room
          resolved for them (a doctor with no DoctorRoomAssignment stays
          fully bookable per design; this is where those visits surface
          instead of silently disappearing from this view). */}
      {!loading && unassignedEvents.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              {unassignedEvents.length}{' '}
              {unassignedEvents.length === 1 ? 'запись без кабинета' : 'записей без кабинета'}
            </span>
          </div>
          <div className="px-5 pb-4 pt-1 flex flex-col gap-2">
            {unassignedEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-white border border-amber-100 rounded-xl px-3.5 py-2.5">
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #f59e0bcc, #f59e0b)' }}>
                  <span className="text-[11px] font-black leading-tight">{e.time}</span>
                  <span className="text-[8px] opacity-80 mt-0.5">{e.duration}мин</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{e.patient_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{e.doctor_name ?? 'Врач не указан'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-orange-500" />
            <span className="text-base font-medium text-gray-500">Загрузка...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <DoorOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {searchQuery ? 'Кабинеты не найдены' : 'Нет активных кабинетов'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(room => {
              const isExpanded = expandedRooms.has(room.id);
              const roomEvents = events.filter(e => e.room_id === room.id && e.date === selectedDate);
              const bandCount = room.assignments.length;

              return (
                <div key={room.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => toggleRoom(room.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f97316cc, #f97316)' }}>
                      <DoorOpen className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{room.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: '#f97316' }}>
                          {roomTypeLabel(room.room_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {room.floor && (
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Этаж {room.floor}</span>
                        )}
                        <span>{room.capacity} {room.capacity === 1 ? 'место' : 'мест'}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-800">{bandCount}</p>
                      <p className="text-[10px] text-gray-400">{bandCount === 1 ? 'врач' : 'врачей'}</p>
                    </div>

                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-gray-50 space-y-4">
                      {bandCount === 0 ? (
                        <p className="py-3 text-center text-xs text-gray-400 italic">
                          Нет врачей, назначенных на этот кабинет в этот день
                        </p>
                      ) : (
                        room.assignments.map((a, idx) => {
                          const bandEvents = roomEvents.filter(e =>
                            e.doctor_id === a.doctor_id && eventOverlapsAssignment(e, a)
                          );
                          return (
                            <div key={`${a.doctor_id}-${idx}`} className="pt-3 first:pt-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Stethoscope className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                <span className="text-xs font-bold text-gray-800">{a.doctor_name}</span>
                                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                  <Clock className="w-3 h-3" /> {a.start_time}–{a.end_time}
                                </span>
                              </div>
                              {bandEvents.length === 0 ? (
                                <p className="text-[11px] text-gray-300 italic pl-5">Нет записей на это время</p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {bandEvents.map(event => {
                                    const initials = event.patient_name
                                      .split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
                                    return (
                                      <div key={event.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5">
                                        <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm"
                                          style={{ background: 'linear-gradient(135deg, #f97316cc, #f97316)' }}>
                                          <span className="text-[11px] font-black leading-tight">{event.time}</span>
                                          <span className="text-[8px] opacity-80 mt-0.5">{event.duration}мин</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                          {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-gray-900 truncate">{event.patient_name}</p>
                                          <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 ${
                                            event.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                                            : event.status === 'cancelled' ? 'bg-red-100 text-red-600'
                                            : event.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                                            : 'bg-orange-100 text-orange-700'
                                          }`}>
                                            {event.status === 'completed' ? 'Выполнено'
                                             : event.status === 'cancelled' ? 'Отменено'
                                             : event.status === 'in_progress' ? 'В процессе'
                                             : 'Запланировано'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
