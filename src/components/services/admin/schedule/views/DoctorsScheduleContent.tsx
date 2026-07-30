"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Video,
  Home,
  Clock,
  Stethoscope,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { ScheduleEvent } from "../types/scheduleTypes";
import StaffScheduleModal from "../../StaffScheduleModal";
import AssignConsultationModal from "../modals/AssignConsultationModal";
import RescheduleModal from "../modals/RescheduleModal";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";

interface DoctorsScheduleContentProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  events: ScheduleEvent[];
  onEventAdded: () => void;
}

interface StaffDay {
  id: number;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse';
  specialization?: string;
  preferred_consultation_duration?: number;
  room_number?: string | null;
  schedule: { source: string; start_time: string; end_time: string } | null;
  next_available: { date: string; start_time: string; end_time: string; source: string } | null;
}

export function DoctorsScheduleContent({
  selectedDate,
  onDateChange,
  events,
  onEventAdded
}: DoctorsScheduleContentProps) {
  const [staffDay, setStaffDay] = useState<StaffDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [modalAvailableSlots, setModalAvailableSlots] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [consultationType, setConsultationType] = useState<'online' | 'offline'>('online');
  const [showNoSchedule, setShowNoSchedule] = useState(false);
  const [scheduleEditMember, setScheduleEditMember] = useState<{ id: number; first_name: string; last_name: string } | null>(null);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<number>>(new Set());
  const [rescheduleEvent, setRescheduleEvent] = useState<ScheduleEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleDoctor = (id: number) => {
    setExpandedDoctors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/schedule/${deleteTarget.id}/`, { data: { reason } });
      toast.success("Запись удалена");
      setDeleteTarget(null);
      onEventAdded();
    } catch {
      toast.error("Не удалось удалить запись");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;
    const fetchStaffDay = async () => {
      setLoading(true);
      try {
        const response = await api.get('/staff/doctors-day/', {
          params: { date: selectedDate, consultation_type: consultationType }
        });
        setStaffDay(response.data);
      } catch (err) {
        console.error("Failed to load staff day:", err);
        toast.error("Не удалось загрузить расписание на дату");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffDay();
  }, [selectedDate, consultationType]);

  // Generate time slots from start_time / end_time
  const generateSlots = (member: StaffDay): any[] => {
    if (!member.schedule) return [];
    const { start_time, end_time } = member.schedule;
    if (!start_time || !end_time) return [];
    const duration = member.preferred_consultation_duration || 30;
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;

    const now = new Date();
    const isToday = selectedDate === now.toLocaleDateString('sv-SE');
    const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    const slots: any[] = [];
    while (cur + duration <= end) {
      if (isToday && cur <= nowMinutes) { cur += duration; continue; }
      const s = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;
      const e = `${String(Math.floor((cur + duration) / 60)).padStart(2, '0')}:${String((cur + duration) % 60).padStart(2, '0')}`;
      slots.push({ id: `gen_${s.replace(':', '')}`, start_time: s, end_time: e });
      cur += duration;
    }
    return slots;
  };

  const handleSlotClick = (staffId: number, slot: any, allSlots: any[]) => {
    setSelectedDoctor(staffId);
    setSelectedSlot(slot);
    setModalAvailableSlots(allSlots);
    setShowAssignModal(true);
  };

  const handleAddClick = (staffId: number, allSlots: any[]) => {
    setSelectedDoctor(staffId);
    setSelectedSlot(null);
    setModalAvailableSlots(allSlots);
    setShowAssignModal(true);
  };

  const filteredStaff = staffDay.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const specialization = member.specialization?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || specialization.includes(query);
  });

  const staffHasActivity = (member: StaffDay) =>
    member.schedule !== null ||
    events.some(e => e.doctor_id === member.id && e.date === selectedDate);

  const withSchedule = filteredStaff.filter(m => staffHasActivity(m));
  const withoutSchedule = filteredStaff.filter(m => !staffHasActivity(m));

  // Build week days for the strip
  const getWeekStrip = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    const jsDay = d.getDay(); // 0=Sun..6=Sat
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  };

  const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const weekDays = getWeekStrip();

  return (
    <div className="h-full flex flex-col">
      {/* Week strip */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          {weekDays.map((day, i) => {
            const ds = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
            const isSelected = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <button
                key={ds}
                onClick={() => onDateChange(ds)}
                className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'text-white shadow-md border-transparent'
                    : isToday
                    ? 'bg-blue-50 text-blue-600 border-blue-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}
              >
                <span className="text-[10px] font-medium mb-0.5 opacity-80">{DAY_NAMES[i]}</span>
                <span className="text-sm font-bold">{day.getDate()}</span>
                {isToday && <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}>Сегодня</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск сотрудника..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          {/* Consultation type toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold flex-shrink-0">
            <button
              onClick={() => setConsultationType('online')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${consultationType === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Video className="w-3 h-3" />
              Видео
            </button>
            <button
              onClick={() => setConsultationType('offline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${consultationType === 'offline' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Home className="w-3 h-3" />
              В клинике
            </button>
          </div>
        </div>
      </div>

      {/* No-schedule banner */}
      {!loading && withoutSchedule.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <button
            onClick={() => setShowNoSchedule(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-amber-100/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-800">
                У {withoutSchedule.length}{' '}
                {withoutSchedule.length === 1 ? 'врача' : 'врачей'}{' '}
                нет расписания на этот день
              </span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium flex-shrink-0">
              <span>{showNoSchedule ? 'Скрыть' : 'Посмотреть'}</span>
              {showNoSchedule
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {showNoSchedule && (
            <div className="px-5 pb-5 pt-1 border-t border-amber-200">
              <div className="flex flex-wrap gap-2 mt-3">
                {withoutSchedule.map((member) => {
                  const grads = [
                    ['#3772ff', '#2c5bcc'],
                    ['#8b5cf6', '#7c3aed'],
                    ['#f43f5e', '#e11d48'],
                    ['#f59e0b', '#d97706'],
                    ['#10b981', '#059669'],
                    ['#06b6d4', '#0891b2'],
                  ];
                  const [cg1, cg2] = grads[member.id % grads.length];
                  return (
                    <div key={member.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${cg1}, ${cg2})` }}
                      >
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{member.first_name} {member.last_name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{member.specialization || '—'}</p>
                      </div>
                      <button
                        onClick={() => setScheduleEditMember(member)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                      >
                        <CalendarIcon className="w-3 h-3" />
                        Расписание
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-16 h-16 animate-spin mb-4 text-blue-600" />
                <span className="text-lg font-medium text-gray-600">Загрузка расписания...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">
                  {searchQuery ? 'Сотрудники не найдены' : 'Нет сотрудников'}
                </p>
              </div>
            ) : (
              <>
                {withSchedule.length > 0 ? (
                <div className="flex flex-col gap-2">
                {withSchedule.map((member) => {
                  const slots = generateSlots(member);
                  const bookedSlots = events.filter(e => e.doctor_id === member.id && e.date === selectedDate);
                  const availableSlots = slots.filter(s => !bookedSlots.some(e => e.time === s.start_time));
                  const allAvailableSlots = (() => {
                    if (!member.schedule) return [];
                    const { start_time, end_time } = member.schedule;
                    if (!start_time || !end_time) return [];
                    const duration = member.preferred_consultation_duration || 30;
                    const [sh, sm] = start_time.split(':').map(Number);
                    const [eh, em] = end_time.split(':').map(Number);
                    let c = sh * 60 + sm;
                    const e = eh * 60 + em;
                    const result: any[] = [];
                    while (c + duration <= e) {
                      const s = `${String(Math.floor(c/60)).padStart(2,'0')}:${String(c%60).padStart(2,'0')}`;
                      const en = `${String(Math.floor((c+duration)/60)).padStart(2,'0')}:${String((c+duration)%60).padStart(2,'0')}`;
                      if (!bookedSlots.some(ev => ev.time === s)) result.push({ id: `gen_${s.replace(':','')}`, start_time: s, end_time: en });
                      c += duration;
                    }
                    return result;
                  })();
                  const nearestSlot = availableSlots[0] || allAvailableSlots[0] || null;
                  const hasSchedule = member.schedule !== null;
                  const totalSlots = bookedSlots.length + availableSlots.length;
                  const fillRatio = totalSlots > 0 ? bookedSlots.length / totalSlots : -1;
                  const isNurse = member.role === 'nurse';
                  const isExpanded = expandedDoctors.has(member.id);

                  const gradients = [
                    ['#3772ff', '#2c5bcc'],
                    ['#8b5cf6', '#7c3aed'],
                    ['#f43f5e', '#e11d48'],
                    ['#f59e0b', '#d97706'],
                    ['#10b981', '#059669'],
                    ['#06b6d4', '#0891b2'],
                  ];
                  const [g1, g2] = gradients[member.id % gradients.length];

                  const statusColor = !hasSchedule ? 'bg-gray-300'
                    : fillRatio === 1 ? 'bg-red-500'
                    : fillRatio > 0.7 ? 'bg-amber-400'
                    : 'bg-emerald-500';

                  return (
                    <div key={member.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                      {/* Row — always visible, click to expand */}
                      <button
                        onClick={() => toggleDoctor(member.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
                      >
                        {/* Avatar + status dot */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                          >
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 leading-tight truncate">{member.first_name} {member.last_name}</span>
                            {isNurse && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 flex-shrink-0">Медсестра</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {member.specialization && <span className="text-xs text-gray-400 truncate">{member.specialization}</span>}
                            {member.room_number && <span className="text-xs text-gray-500">· Кабинет {member.room_number}</span>}
                            {hasSchedule && (
                              <span className="text-[10px] font-semibold text-gray-400">
                                · {member.schedule!.start_time}–{member.schedule!.end_time}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                          <span className={`flex items-center gap-1 text-xs font-semibold ${bookedSlots.length > 0 ? 'text-blue-500' : 'text-gray-300'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${bookedSlots.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            {bookedSlots.length} записей
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-semibold ${availableSlots.length > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${availableSlots.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            {availableSlots.length} свободно
                          </span>
                        </div>

                        {/* Type badge */}
                        <span className={`hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 border ${
                          consultationType === 'online'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {consultationType === 'online' ? <Video className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                          {consultationType === 'online' ? 'Видео' : 'В клинике'}
                        </span>

                        {/* + Запись */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddClick(member.id, availableSlots); }}
                          disabled={availableSlots.length === 0}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-xl flex-shrink-0 shadow-sm hover:shadow-md transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                          style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Запись
                        </button>

                        {/* Chevron */}
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Accordion body */}
                      <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                        <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/30">
                          {!hasSchedule ? (
                            member.next_available ? (
                              <button
                                onClick={() => onDateChange(member.next_available!.date)}
                                className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 hover:bg-amber-500 hover:border-amber-500 group transition-all"
                              >
                                <CalendarIcon className="w-5 h-5 text-amber-500 group-hover:text-white transition-colors flex-shrink-0" />
                                <div className="text-left">
                                  <p className="text-sm font-bold text-amber-700 group-hover:text-white transition-colors">
                                    {(() => { const d = new Date(member.next_available!.date + 'T00:00:00'); return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); })()}, {member.next_available!.start_time}
                                  </p>
                                  <p className="text-xs text-amber-400 group-hover:text-amber-100 transition-colors">Ближайший день с расписанием · Нажмите для перехода</p>
                                </div>
                              </button>
                            ) : (
                              <p className="text-xs text-gray-400 font-medium text-center py-4">Расписание не задано</p>
                            )
                          ) : bookedSlots.length === 0 && availableSlots.length === 0 && nearestSlot ? (
                            <button
                              onClick={() => handleSlotClick(member.id, nearestSlot, allAvailableSlots)}
                              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 hover:bg-emerald-500 hover:border-emerald-500 group transition-all"
                            >
                              <Clock className="w-5 h-5 text-emerald-500 group-hover:text-white transition-colors flex-shrink-0" />
                              <div className="text-left">
                                <p className="text-sm font-bold text-emerald-700 group-hover:text-white transition-colors">Ближайший слот: {nearestSlot.start_time}</p>
                                <p className="text-xs text-emerald-400 group-hover:text-emerald-100 transition-colors">Нажмите для записи пациента</p>
                              </div>
                            </button>
                          ) : (
                            <>
                              {/* Booked */}
                              {bookedSlots.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Записи</p>
                                  <div className="flex flex-col gap-2">
                                    {bookedSlots.map(event => (
                                      <div key={event.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5">
                                        <div
                                          className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm"
                                          style={{ background: 'linear-gradient(135deg, #3772ff, #2c5bcc)' }}
                                        >
                                          <span className="text-[11px] font-black leading-tight">{event.time}</span>
                                          <span className="text-[8px] opacity-70 mt-0.5">{event.duration}мин</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-gray-900 truncate">{event.patient_name}</p>
                                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-1 ${
                                            event.consultation_type !== 'offline' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                          }`}>
                                            {event.consultation_type !== 'offline' ? <Video className="w-2.5 h-2.5" /> : <Home className="w-2.5 h-2.5" />}
                                            {event.consultation_type !== 'offline' ? 'Видео' : 'В клинике'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <button onClick={() => setRescheduleEvent(event)} title="Перенести" className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-blue-400 hover:text-blue-600">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => setDeleteTarget(event)} title="Удалить" className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Free slots */}
                              {availableSlots.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Свободные слоты</p>
                                  <div className="flex flex-wrap gap-2">
                                    {availableSlots.slice(0, 16).map((slot: any, i: number) => (
                                      <button
                                        key={i}
                                        onClick={() => handleSlotClick(member.id, slot, availableSlots)}
                                        className="flex flex-col items-center justify-center px-3 py-2 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-500 hover:border-emerald-500 transition-all group"
                                      >
                                        <span className="text-xs font-black text-emerald-700 group-hover:text-white leading-tight">{slot.start_time}</span>
                                        <span className="text-[9px] text-emerald-400 group-hover:text-emerald-100">{slot.end_time}</span>
                                      </button>
                                    ))}
                                    {availableSlots.length > 16 && (
                                      <button
                                        onClick={() => handleAddClick(member.id, availableSlots)}
                                        className="flex flex-col items-center justify-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
                                      >
                                        <span className="text-xs font-bold text-gray-500">+{availableSlots.length - 16}</span>
                                        <span className="text-[9px] text-gray-400">ещё</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-gray-400 text-sm">Нет врачей с расписанием на этот день</p>
                  </div>
                )}
              </>
            )}
      </div>

      {/* Schedule Edit Modal */}
      <StaffScheduleModal
        isOpen={!!scheduleEditMember}
        member={scheduleEditMember}
        onClose={() => setScheduleEditMember(null)}
        onSaved={() => {
          setScheduleEditMember(null);
          onEventAdded();
        }}
      />

      {/* Reschedule Modal */}
      {rescheduleEvent && (
        <RescheduleModal
          event={rescheduleEvent}
          onClose={() => setRescheduleEvent(null)}
          onRescheduled={() => { setRescheduleEvent(null); onEventAdded(); }}
        />
      )}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          patientName={deleteTarget.patient_name}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedDoctor && (
        <AssignConsultationModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDoctor(null);
            setSelectedSlot(null);
            setModalAvailableSlots([]);
          }}
          doctorId={selectedDoctor}
          doctorName={(() => { const d = staffDay.find(x => x.id === selectedDoctor); return d ? `${d.first_name} ${d.last_name}` : ''; })()}
          doctorSpecialization={staffDay.find(x => x.id === selectedDoctor)?.specialization}
          slot={selectedSlot}
          availableSlots={modalAvailableSlots}
          date={selectedDate}
          onAssigned={() => {
            setShowAssignModal(false);
            setModalAvailableSlots([]);
            onEventAdded();
          }}
        />
      )}
    </div>
  );
}

export default DoctorsScheduleContent;
