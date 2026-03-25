import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, Sparkles, RefreshCw, ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { api } from "@/utils/api";

// Import our new components
import DoctorSearchAndFilters from "./components/DoctorSearchAndFilters";
import AIRecommendationBlock from "./components/AIRecommendationBlock";
import DoctorCard from "./components/DoctorCard";
import AISymptomInput from "./components/AISymptomInput";

// Import types and utilities
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
  // Timeslot integration props
  aiRecommendationId?: number;
  onConsultationBooked?: (consultationId: number, consultationData?: any) => void;
  // Real-time updates props
  doctorsError?: string | null;
  websocketConnected?: boolean;
  // AI recommendation callback
  onRequestAIRecommendation?: (symptoms: string) => void;
  // AI loading state
  loadingAI?: boolean;
  // Clear symptoms callback
  onClearSymptoms?: () => void;
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
  aiErrorData,
  fallbackUsed,
  aiRecommendationId,
  onConsultationBooked,
  doctorsError,
  websocketConnected,
  onRequestAIRecommendation,
  loadingAI = false,
  onClearSymptoms,
}) => {
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByType, setFilterByType] = useState<string>("all");
  const [filterByClinic, setFilterByClinic] = useState<string>("all");
  const [language, setLanguage] = useState<Language>('ru');

  // Timeslot states - will be moved to separate component later
  const [doctorTimeslots, setDoctorTimeslots] = useState<Record<number, TimeSlot[]>>({});
  const [bookingLoading, setBookingLoading] = useState(false);

  // Real-time updates
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<number, number>>({});
  const [isPolling, setIsPolling] = useState(false);

  // Local date helper (avoids UTC offset issue with toISOString)
  const toLocalDate = (d: Date = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Global date navigation
  const [selectedDate, setSelectedDate] = useState(() => toLocalDate());

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState<TimeSlot | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  // Use our custom hook for filtering
  const { filteredDoctors, doctorTypes, clinics } = useDoctorFiltering({
    doctors,
    searchTerm,
    filterByType,
    filterByClinic,
    language,
    recommendedDoctor,
  });

  // REMOVED: Urgent consultation logic - all consultations now require time slot selection
  // const isUrgent = recommendedDoctor?.urgency === 'urgent';
  const isUrgent = false; // Always false now - all consultations use time slots

  const fetchedDatesRef = React.useRef<Set<string>>(new Set());

  // Fetch slots for a specific date for ALL doctors from the backend
  const fetchSlotsForDate = async (date: string, silent = false) => {
    try {
      const { data } = await api.get('/schedule/day/', {
        params: { date, consultation_type: 'online' }
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
              // Keep as local datetime string — toISOString() would shift to UTC
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

  // Initial load: fetch next 7 days for all doctors
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

  // Refresh today's slots every 5 minutes
  useEffect(() => {
    if (doctors.length === 0) return;
    setIsPolling(true);
    const pollInterval = setInterval(() => {
      const today = toLocalDate();
      fetchSlotsForDate(today, true);
    }, 5 * 60 * 1000);
    return () => { clearInterval(pollInterval); setIsPolling(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length]);

  const handleDoctorSelect = async (doctorId: number) => {
    onSelect(doctorId);

    // REMOVED: Urgent consultation logic
    // All consultations now require timeslot selection - do not proceed to next step automatically
    // User must select a timeslot first

    // if (aiRecommendationId && recommendedDoctor) {
    //   // Always require timeslot selection now
    // } else {
    //   // Regular flow without AI processing
    //   onNext();
    // }
  };


  const handleTimeslotSelect = async (timeslot: TimeSlot) => {
    // console.log(`🕐 handleTimeslotSelect called at top level:`, {
    //   timeslot: timeslot.start_time,
    //   selectedDoctorId,
    //   aiRecommendationId,
    //   isUrgent,
    //   showConfirmModal,
    //   selectedTimeslot
    // });

    // ✅ Allow booking without AI recommendation - users can skip AI and book directly
    if (!aiRecommendationId) {
      console.log('ℹ️ Booking timeslot without AI recommendation (user skipped AI or selected doctor directly)');
    }

    // Find which doctor this timeslot belongs to by searching through doctorTimeslots
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

    if (!timeslotDoctorId || !timeslotDoctor) {
      console.warn('⚠️ Could not find doctor for this timeslot');
      return;
    }

    // console.log(`🔄 Timeslot belongs to doctor ${timeslotDoctorId} (${timeslotDoctor.name})`);

    // If the timeslot belongs to a different doctor than currently selected, update selection
    if (selectedDoctorId !== timeslotDoctorId) {
      // console.log(`🔄 Switching from doctor ${selectedDoctorId} to doctor ${timeslotDoctorId}`);
      onSelect(timeslotDoctorId); // Update the selected doctor
    }

    // Show confirmation modal with the correct doctor
    setSelectedTimeslot(timeslot);
    setSelectedDoctorForBooking(timeslotDoctor);
    setShowConfirmModal(true);
  };

  const confirmTimeslotBooking = async () => {
    if (!selectedTimeslot || !selectedDoctorForBooking) {
      return;
    }

    // Use the doctor from the booking state, not the global selectedDoctorId
    const bookingDoctorId = selectedDoctorForBooking.id;

    try {
      setBookingLoading(true);
      // console.log(`🔄 Timeslot confirmed: ${selectedTimeslot.start_time} for doctor ${bookingDoctorId} (${selectedDoctorForBooking.name})`);

      // Don't create consultation yet - just confirm the timeslot selection
      // Remove the selected slot from available slots (temporarily)
      setDoctorTimeslots(prev => ({
        ...prev,
        [bookingDoctorId]: prev[bookingDoctorId]?.filter(slot => slot.id !== selectedTimeslot.id) || []
      }));

      // Create consultation data for Step 3
      // ✅ ai_recommendation_id is optional - only include if available
      // start_time is "YYYY-MM-DDTHH:MM:00" (local) — split into date + time for the API
      const [schedDate, schedTimePart] = selectedTimeslot.start_time.split("T");
      const consultationData: any = {
        scheduled_at: selectedTimeslot.start_time,
        scheduled_time: schedTimePart.slice(0, 5), // "HH:MM"
        scheduled_date: schedDate,
        doctor_id: bookingDoctorId,
      };

      if (aiRecommendationId) {
        consultationData.ai_recommendation_id = aiRecommendationId;
      }

      // console.log(`🎉 Timeslot confirmed successfully for doctor ${bookingDoctorId}`);
      setShowConfirmModal(false);
      onConsultationBooked?.(0, consultationData); // Pass 0 as consultationId since not created yet
    } catch (error) {
      console.error('❌ Error confirming timeslot:', error);
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

  // Week date helpers
  const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const WEEKDAYS_RU = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const DAY_NAMES = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

  // Always show Mon–Sun of the week containing selectedDate
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

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const headerDateLabel = `${WEEKDAYS_RU[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} ${MONTHS_RU[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()} г.`;

  const handleDayChange = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDate);
    // Fetch the whole new week if needed
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

  const goToToday = () => {
    setSelectedDate(todayStr);
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Clock size={14} />
          Шаг 2 из 3
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {websocketConnected && (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-xs">Обновления в реальном времени</span>
            </div>
          )}
          {!websocketConnected && (
            <div className="flex items-center gap-1 text-orange-600">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span className="text-xs">Подключение...</span>
            </div>
          )}
          {isPolling && (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs">Обновление расписания</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">
              🌍 {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()}
              ({new Date().toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'})})
            </div>
            <div>
              {filteredDoctors.length} врачей
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <User size={16} />
              </div>
              Выбор врача
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mt-2">
              {symptoms ? 'ИИ проанализировал ваши симптомы и подобрал специалиста' : 'Опишите симптомы для рекомендаций ИИ или выберите врача самостоятельно'}
            </p>
          </div>

          {/* Clear symptoms button */}
          {symptoms && onClearSymptoms && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearSymptoms}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all text-sm font-bold shadow-md hover:shadow-lg"
            >
              <RefreshCw size={16} />
              Сбросить симптомы
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Optional Symptom Input */}
      {!symptoms && (
        <AISymptomInput
          onRequestAIRecommendation={onRequestAIRecommendation}
          loadingAI={loadingAI}
        />
      )}

      {/* AI Loading State */}
      <AnimatePresence>
        {loadingAI && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 md:p-8"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Animated AI Icon */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
              >
                <Sparkles size={32} />
              </motion.div>

              {/* Loading Text */}
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold text-blue-900">
                  Анализируем симптомы...
                </h4>
                <p className="text-sm text-blue-700">
                  ИИ подбирает наиболее подходящего специалиста
                </p>
              </div>

              {/* Animated Progress Dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-3 h-3 bg-blue-600 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Recommendation Block */}
      {!loadingAI && (recommendedDoctor || aiErrorData) && (
        <AIRecommendationBlock
          recommendedDoctor={recommendedDoctor}
          aiErrorData={aiErrorData}
          fallbackUsed={fallbackUsed}
        />
      )}

      {/* Search and Filters */}
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

      {/* Doctor List */}
      {/* Doctor List - SIMPLIFIED: Render directly without complex callbacks */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 text-sm">Загружаем врачей...</p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600 text-sm">
              {doctorsError || (doctors.length === 0 ? "Нет доступных врачей" : "Врачи не найдены")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Global date navigation */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 space-y-2">
              {/* Nav bar — exact admin style */}
              <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-white whitespace-nowrap flex-shrink-0 transition-all"
                  style={{ backgroundColor: '#3772ff' }}
                >
                  Сегодня
                </motion.button>

                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <motion.button
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDayChange(-1)}
                    disabled={selectedDate <= todayStr}
                    className="p-2 transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </motion.button>

                  <div className="flex items-center gap-2 px-3 py-2 whitespace-nowrap font-semibold text-sm border-x border-gray-200" style={{ color: '#1e263e' }}>
                    <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="capitalize">{headerDateLabel}</span>
                  </div>

                  <motion.button
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDayChange(1)}
                    className="p-2 transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </motion.button>
                </div>
              </div>
              {/* 7-day strip */}
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((dateItem) => {
                  const isDateSelected = selectedDate === dateItem.date;
                  const hasAnyFreeSlots = Object.values(doctorTimeslots).some(slots =>
                    slots.some(s => {
                      const d = new Date(s.start_time);
                      return d.getFullYear() === dateItem.year && d.getMonth() === dateItem.month && d.getDate() === dateItem.dayNumber && !s.is_booked && s.available_spots > 0;
                    })
                  );
                  return (
                    <button
                      key={dateItem.date}
                      onClick={() => setSelectedDate(dateItem.date)}
                      className={`flex flex-col items-center py-2 rounded-xl text-[9px] font-semibold transition-all border ${
                        isDateSelected
                          ? 'bg-blue-600 text-white border-transparent shadow-sm'
                          : dateItem.isToday
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : hasAnyFreeSlots
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      <span className="opacity-80">{dateItem.dayName}</span>
                      <span className="font-bold text-[12px] leading-tight mt-0.5">{dateItem.dayNumber}</span>
                      {dateItem.isToday && <span className={`text-[7px] mt-0.5 ${isDateSelected ? 'text-white/70' : 'text-blue-400'}`}>сег</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doctor cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full pb-4">
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
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 -mx-1 px-1 pt-3 pb-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] z-20">
        <div className="flex items-center justify-between gap-3">
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all flex-shrink-0 text-sm"
          >
            <ArrowLeft size={15} />
            Назад
          </button>

          {/* Combined doctor info + CTA button */}
          {(() => {
            const doc = selectedDoctorId ? doctors.find(d => d.id === selectedDoctorId) : null;
            const GRADS = [['#3772ff','#2c5bcc'],['#8b5cf6','#7c3aed'],['#f43f5e','#e11d48'],['#f59e0b','#d97706'],['#10b981','#059669'],['#06b6d4','#0891b2']];
            const [g1, g2] = doc ? GRADS[doc.id % GRADS.length] : ['#3772ff', '#2c5bcc'];
            const earliestSlot = doc ? (doctorTimeslots[doc.id] || []).find(sl => !sl.is_booked && sl.available_spots > 0) : null;
            const earliestLabel = earliestSlot ? (() => {
              const d = new Date(earliestSlot.start_time);
              const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
              return d.toDateString() === new Date().toDateString() ? `Сегодня ${time}` : time;
            })() : null;

            const handleCtaClick = () => {
              if (!doc) return;
              if (earliestSlot) {
                handleTimeslotSelect(earliestSlot);
              } else {
                onNext();
              }
            };

            return (
              <button
                onClick={handleCtaClick}
                disabled={!selectedDoctorId || bookingLoading}
                className="flex items-center gap-3 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                style={doc ? { background: `linear-gradient(135deg, ${g1}, ${g2})`, color: 'white' } : { background: '#e5e7eb', color: '#9ca3af' }}
              >
                {doc && (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {doc.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{doc.name}</p>
                      <p className="text-[10px] opacity-80 truncate">
                        {earliestLabel ? `⚡ ${earliestLabel}` : getSpecializationName(doc, language)}
                      </p>
                    </div>
                    <div className="w-px h-7 bg-white/30 flex-shrink-0" />
                  </>
                )}
                Записаться к врачу
                <ArrowRight size={15} />
              </button>
            );
          })()}
        </div>
      </div>


      {/* Timeslot Confirmation Modal */}
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
              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }} />

              {/* Drag handle (mobile) */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />

              <div className="px-5 pt-4 pb-6 space-y-4">
                {/* Header */}
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

                {/* Details card */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                  {/* Date & time */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 capitalize">{dateStr}</p>
                      <p className="text-base font-black text-blue-600">
                        {timeStr}{endTime ? ` — ${endTime}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  {doc.online_consultation_price && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Стоимость консультации</span>
                      <span className="text-sm font-black text-emerald-600">
                        {Number(doc.online_consultation_price).toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₸
                      </span>
                    </div>
                  )}

                  {/* Clinic */}
                  {doc.clinic && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">Клиника</span>
                      <span className="text-sm font-semibold text-gray-700">{doc.clinic.name}</span>
                    </div>
                  )}

                  {/* Format */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500">Формат</span>
                    <span className="text-sm font-semibold text-violet-600">Онлайн · Видео</span>
                  </div>
                </div>

                {/* Buttons */}
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