import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Sparkles, RefreshCw, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wand2, Clock, FileText } from "lucide-react";
import { api } from "@/utils/api";

import DoctorSearchAndFilters from "./components/DoctorSearchAndFilters";
import DoctorCard from "./components/DoctorCard";

import type { Doctor, TimeSlot, RecommendedDoctor, AIErrorData, Language } from "./types/doctor";
import { useDoctorFiltering } from "./hooks/useDoctorFiltering";
import { getSpecializationName } from "./utils/doctorUtils";

interface Step2Props {
  doctors: Doctor[];
  selectedDoctorId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  symptoms: string;
  recommendedDoctor?: RecommendedDoctor;
  aiErrorData?: AIErrorData;
  fallbackUsed?: boolean;
  aiRecommendationId?: number;
  onConsultationBooked?: (consultationId: number, consultationData?: any) => void;
  doctorsError?: string | null;
  websocketConnected?: boolean;
  onRequestAIRecommendation?: (symptoms: string) => void;
  loadingAI?: boolean;

  onClearSymptoms?: () => void;
  consultationType?: 'online' | 'offline';
}

const VideoConsultationStep2: React.FC<Step2Props> = ({
  doctors,
  selectedDoctorId,
  onSelect,
  loading,
  onBack,
  onNext,
  symptoms,
  recommendedDoctor,
  aiRecommendationId,
  onConsultationBooked,
  doctorsError,
  websocketConnected,
  loadingAI = false,
  onRequestAIRecommendation,
  onClearSymptoms,
  consultationType = 'online',
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByType, setFilterByType] = useState<string>("all");
  const [filterByClinic, setFilterByClinic] = useState<string>("all");
  const [language, setLanguage] = useState<Language>('ru');
  const [localAISymptoms, setLocalAISymptoms] = useState(symptoms || "");

  const [doctorTimeslots, setDoctorTimeslots] = useState<Record<number, TimeSlot[]>>({});
  const [bookingLoading, setBookingLoading] = useState(false);

  const toLocalDate = (d: Date = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState(() => toLocalDate());

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState<TimeSlot | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const { filteredDoctors, doctorTypes, clinics } = useDoctorFiltering({
    doctors,
    searchTerm,
    filterByType,
    filterByClinic,
    language,
    recommendedDoctor,
  });

  const fetchedDatesRef = React.useRef<Set<string>>(new Set());

  const fetchSlotsForDate = async (date: string, silent = false) => {
    try {
      const { data } = await api.get('/schedule/day/', {
        params: { date, consultation_type: consultationType }
      });

      const now = new Date();
      const doctorRows: Array<{
        doctor_id: number;
        slots: Array<{ start: string; end: string; status: string }>;
      }> = data.doctors || [];

      setDoctorTimeslots(prev => {
        const next = { ...prev };
        doctorRows.forEach(({ doctor_id, slots }) => {
          const newSlots: TimeSlot[] = slots
            .map(slot => {
              const startLocal = `${date}T${slot.start}:00`;
              const endLocal = `${date}T${slot.end}:00`;
              return {
                id: new Date(startLocal).getTime() + doctor_id,
                start_time: startLocal,
                end_time: endLocal,
                available_spots: slot.status === 'free' ? 1 : 0,
                max_consultations: 1,
                is_booked: slot.status === 'booked',
              } as TimeSlot;
            })
            .filter(slot => new Date(slot.start_time) > now);

          const existing = (prev[doctor_id] || []).filter(s => !s.start_time.startsWith(date));
          next[doctor_id] = [...existing, ...newSlots];
        });
        return next;
      });
    } catch (error) {
      if (!silent) console.error('Error fetching slots for date', date, error);
    }
  };

  useEffect(() => {
    if (doctors.length === 0) return;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDate(d);
      if (!fetchedDatesRef.current.has(dateStr)) {
        fetchedDatesRef.current.add(dateStr);
        fetchSlotsForDate(dateStr);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length]);

  useEffect(() => {
    if (doctors.length === 0) return;
    const pollInterval = setInterval(() => {
      fetchSlotsForDate(toLocalDate(), true);
    }, 5 * 60 * 1000);
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length]);

  const handleTimeslotSelect = async (timeslot: TimeSlot) => {
    let timeslotDoctorId: number | null = null;
    let timeslotDoctor: Doctor | null = null;

    for (const [doctorIdStr, slots] of Object.entries(doctorTimeslots)) {
      const doctorId = parseInt(doctorIdStr);
      if (slots.some(slot => slot.id === timeslot.id)) {
        timeslotDoctorId = doctorId;
        timeslotDoctor = doctors.find(d => d.id === doctorId) || null;
        break;
      }
    }

    if (!timeslotDoctorId || !timeslotDoctor) return;

    if (selectedDoctorId !== timeslotDoctorId) {
      onSelect(timeslotDoctorId);
    }

    setSelectedTimeslot(timeslot);
    setSelectedDoctorForBooking(timeslotDoctor);
    setShowConfirmModal(true);
  };

  const confirmTimeslotBooking = async () => {
    if (!selectedTimeslot || !selectedDoctorForBooking) return;

    const bookingDoctorId = selectedDoctorForBooking.id;

    try {
      setBookingLoading(true);

      setDoctorTimeslots(prev => ({
        ...prev,
        [bookingDoctorId]: prev[bookingDoctorId]?.filter(slot => slot.id !== selectedTimeslot.id) || []
      }));

      const localDate = new Date(selectedTimeslot.start_time);
      const consultationData: any = {
        scheduled_at: selectedTimeslot.start_time,
        scheduled_time: localDate.toISOString(),
        doctor_id: bookingDoctorId,
      };

      if (aiRecommendationId) {
        consultationData.ai_recommendation_id = aiRecommendationId;
      }

      setShowConfirmModal(false);
      onConsultationBooked?.(0, consultationData);
    } catch (error) {
      console.error('Error confirming timeslot:', error);
      alert('Ошибка при подтверждении времени. Попробуйте снова.');
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelTimeslotBooking = () => {
    setShowConfirmModal(false);
    setSelectedTimeslot(null);
    setSelectedDoctorForBooking(null);
  };

  const DAY_NAMES = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

  const getMondayOfWeek = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  };

  const weekDates = (() => {
    const monday = getMondayOfWeek(selectedDate);
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { date: dateStr, dayName: DAY_NAMES[d.getDay()], dayNumber: d.getDate(), month: d.getMonth(), year: d.getFullYear(), isToday: d.toDateString() === today.toDateString() };
    });
  })();

  const handleDayChange = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDate);
    const monday = getMondayOfWeek(newDate);
    for (let i = 0; i < 7; i++) {
      const fd = new Date(monday);
      fd.setDate(monday.getDate() + i);
      const dateStr = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}-${String(fd.getDate()).padStart(2, '0')}`;
      if (!fetchedDatesRef.current.has(dateStr)) {
        fetchedDatesRef.current.add(dateStr);
        fetchSlotsForDate(dateStr);
      }
    }
  };

  const todayStr = toLocalDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Single unified card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

        {/* Top bar: Back · title · status · CTA */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <motion.button
            onClick={onBack}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <ArrowLeft size={14} /> Назад
          </motion.button>

          <span className="text-sm font-bold text-gray-800 flex-1">Выбор врача</span>

          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${websocketConnected ? 'bg-emerald-400' : 'bg-orange-400'} animate-pulse`} />
          <span className="text-xs text-gray-400 flex-shrink-0">{filteredDoctors.length} врачей</span>

          {(() => {
            const doc = selectedDoctorId ? doctors.find(d => d.id === selectedDoctorId) : null;
            const earliestSlot = doc ? (doctorTimeslots[doc.id] || []).find(sl => !sl.is_booked && (sl.available_spots ?? 1) > 0) : null;
            if (!doc) return (
              <button disabled className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100 cursor-not-allowed flex-shrink-0">
                Записаться <ArrowRight size={14} />
              </button>
            );
            return (
              <motion.button
                onClick={() => earliestSlot ? handleTimeslotSelect(earliestSlot) : onNext()}
                disabled={bookingLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 shadow-md disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)' }}
              >
                {doc.name.split(' ')[0]} · Записаться <ArrowRight size={13} />
              </motion.button>
            );
          })()}
        </div>

        {/* ── AI section ── */}
        <AnimatePresence mode="wait">
          {loadingAI ? (
            <motion.div
              key="ai-loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-blue-100 bg-blue-50"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={15} className="text-blue-600 flex-shrink-0" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-blue-900">ИИ анализирует симптомы...</p>
                <p className="text-xs text-blue-600">Подбираем наиболее подходящего специалиста</p>
              </div>
            </motion.div>
          ) : recommendedDoctor ? (
            <motion.div
              key="ai-result"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-4 py-4 border-b border-emerald-100 bg-emerald-50"
            >
              {/* Top row: icon + name + reason label + button */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  <Sparkles size={14} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-900 leading-tight">
                    {recommendedDoctor.name}
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">ИИ подобрал специалиста</p>

                  {recommendedDoctor.reason && (
                    <p className="text-xs text-emerald-800 leading-relaxed mt-2">{recommendedDoctor.reason}</p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600">
                    <Clock size={10} className="flex-shrink-0" />
                    <span>Пока ждёте: подготовьте список лекарств и время появления симптомов</span>
                  </div>
                </div>

                {onClearSymptoms && (
                  <motion.button
                    onClick={() => { onClearSymptoms(); setLocalAISymptoms(""); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white flex-shrink-0 self-start"
                    style={{ background: 'linear-gradient(135deg, #29358f, #3772ff)' }}
                  >
                    <RefreshCw size={11} /> Написать заново
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : onRequestAIRecommendation ? (
            <motion.div
              key="ai-input"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-4 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2.5">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #29358f, #3772ff)' }}
                >
                  <Sparkles size={14} className="text-white" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-indigo-900 leading-tight">Подобрать врача с помощью ИИ</p>
                  <p className="text-xs text-indigo-500">Опишите симптомы — ИИ найдёт подходящего специалиста</p>
                </div>
              </div>

              {/* Input */}
              <div className="flex items-center rounded-xl border border-indigo-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all overflow-hidden shadow-sm">
                <input
                  type="text"
                  value={localAISymptoms}
                  onChange={(e) => setLocalAISymptoms(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && localAISymptoms.trim() && onRequestAIRecommendation(localAISymptoms)}
                  placeholder="Например: головная боль, температура 38°C..."
                  className="flex-1 pl-3.5 py-4 text-sm bg-transparent border-none outline-none placeholder-indigo-300 text-gray-700 min-w-0"
                />
                <motion.button
                  onClick={() => localAISymptoms.trim() && onRequestAIRecommendation(localAISymptoms)}
                  disabled={!localAISymptoms.trim()}
                  whileHover={{ opacity: 0.9 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-4 text-sm font-semibold text-white disabled:opacity-30 flex-shrink-0 whitespace-nowrap self-stretch flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #29358f, #3772ff)' }}
                >
                  <Wand2 size={13} />
                  Спросить ИИ
                </motion.button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Search + specialty + clinic filters */}
        <div className="px-4 py-3 border-b border-gray-100">
          <DoctorSearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterByType={filterByType}
            onFilterChange={setFilterByType}
            filterByClinic={filterByClinic}
            onClinicFilterChange={setFilterByClinic}
            language={language}
            onLanguageChange={setLanguage}
            doctorTypes={doctorTypes}
            clinics={clinics}
          />
        </div>

        {/* Date strip */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #12263a, #3772ff)' }}
            >
              Сегодня
            </motion.button>

            <button
              onClick={() => handleDayChange(-1)}
              disabled={selectedDate <= todayStr}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-7 gap-1 flex-1">
              {weekDates.map((dateItem) => {
                const isDateSelected = selectedDate === dateItem.date;
                const hasFree = Object.values(doctorTimeslots).some(slots =>
                  slots.some(s => {
                    const d = new Date(s.start_time);
                    return d.getFullYear() === dateItem.year && d.getMonth() === dateItem.month && d.getDate() === dateItem.dayNumber && !s.is_booked && (s.available_spots ?? 1) > 0;
                  })
                );
                return (
                  <button
                    key={dateItem.date}
                    onClick={() => setSelectedDate(dateItem.date)}
                    className={`flex flex-col items-center py-1 rounded-lg text-[9px] font-semibold transition-all ${
                      isDateSelected ? 'text-white shadow-sm' :
                      dateItem.isToday ? 'bg-blue-50 text-blue-600' :
                      hasFree ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                      'text-gray-400 hover:bg-gray-100'
                    }`}
                    style={isDateSelected ? { background: 'linear-gradient(135deg, #12263a, #3772ff)' } : undefined}
                  >
                    <span className="opacity-70">{dateItem.dayName}</span>
                    <span className="font-bold text-[11px] leading-tight">{dateItem.dayNumber}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleDayChange(1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor cards */}
        <div className="p-3">
          {loading ? (
            <div className="flex items-center justify-center py-14 text-gray-400">
              <div className="w-7 h-7 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin mr-3" />
              <span className="text-sm">Загружаем врачей...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <User size={32} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">{doctorsError || (doctors.length === 0 ? 'Нет доступных врачей' : 'Врачи не найдены')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isRecommended={recommendedDoctor?.id === doctor.id}
                  isSelected={selectedDoctorId === doctor.id}
                  language={language}
                  timeslots={doctorTimeslots[doctor.id] || []}
                  selectedDate={selectedDate}
                  onTimeslotSelect={handleTimeslotSelect}
                  onDateSelect={setSelectedDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeslot confirmation modal */}
      {showConfirmModal && selectedTimeslot && selectedDoctorForBooking && (() => {
        const doc = selectedDoctorForBooking;
        const GRADS = [['#3772ff','#2c5bcc'],['#8b5cf6','#7c3aed'],['#f43f5e','#e11d48'],['#f59e0b','#d97706'],['#10b981','#059669'],['#06b6d4','#0891b2']];
        const [g1, g2] = GRADS[doc.id % GRADS.length];
        const slotDate = new Date(selectedTimeslot.start_time);
        const dateStr = slotDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = slotDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const endTime = selectedTimeslot.end_time
          ? new Date(selectedTimeslot.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : null;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }} />
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />

              <div className="px-5 pt-4 pb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                    {doc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">{doc.name}</p>
                    <p className="text-xs text-blue-600 font-medium truncate">{getSpecializationName(doc, language)}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50">
                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900">Подтвердите запись</h3>

                <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 capitalize">{dateStr}</p>
                      <p className="text-base font-black text-blue-600">
                        {timeStr}{endTime ? ` — ${endTime}` : ''}
                      </p>
                    </div>
                  </div>

                  {doc.online_consultation_price && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Стоимость консультации</span>
                      <span className="text-sm font-black text-emerald-600">
                        {Number(doc.online_consultation_price).toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₸
                      </span>
                    </div>
                  )}

                  {doc.clinic && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Клиника</span>
                      <span className="text-sm font-semibold text-gray-700">{doc.clinic.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500">Формат</span>
                    <span className="text-sm font-semibold text-violet-600">Онлайн · Видео</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelTimeslotBooking}
                    disabled={bookingLoading}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmTimeslotBooking}
                    disabled={bookingLoading}
                    className="flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                  >
                    {bookingLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Записываем...
                      </>
                    ) : (
                      'Подтвердить запись'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </motion.div>
  );
};

export default VideoConsultationStep2;
