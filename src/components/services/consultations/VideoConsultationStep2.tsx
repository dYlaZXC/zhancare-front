import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, Sparkles, RefreshCw } from "lucide-react";
import { api } from "@/utils/api";

// Import our new components
import DoctorSearchAndFilters from "./components/DoctorSearchAndFilters";
import NavigationButtons from "./components/NavigationButtons";
import AIRecommendationBlock from "./components/AIRecommendationBlock";
import DoctorCard from "./components/DoctorCard";
import AISymptomInput from "./components/AISymptomInput";

// Import types and utilities
import type { Doctor, TimeSlot, RecommendedDoctor, AIErrorData, Language, WorkScheduleDay } from "./types/doctor";
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showFullCalendar, setShowFullCalendar] = useState<Record<number, boolean>>({});
  const [doctorTimeslotsByDate, setDoctorTimeslotsByDate] = useState<Record<number, Record<string, TimeSlot[]>>>({});
  const [bookingLoading, setBookingLoading] = useState(false);

  // Real-time updates
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<number, number>>({});
  const [isPolling, setIsPolling] = useState(false);

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

  // Track which doctors we've already fetched timeslots for
  const [fetchedDoctorIds, setFetchedDoctorIds] = useState<Set<number>>(new Set());

  // Fetch timeslots for all consultations (ONLY ONCE per doctor!)
  useEffect(() => {
    if (doctors.length > 0) {
      const newDoctorIds: number[] = [];

      doctors.forEach(doctor => {
        // Only fetch if we haven't already fetched for this doctor
        if (!fetchedDoctorIds.has(doctor.id)) {
          fetchDoctorTimeslots(doctor.id);
          newDoctorIds.push(doctor.id);
        }
      });

      // Batch update state once instead of multiple times
      if (newDoctorIds.length > 0) {
        setFetchedDoctorIds(prev => {
          const next = new Set(prev);
          newDoctorIds.forEach(id => next.add(id));
          return next;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length]); // Only depend on length, not the entire array


  // Minimal fallback polling for timeslot updates (WebSocket handles real-time updates)
  useEffect(() => {
    // Always poll for all consultations now (removed isUrgent check)
    if (doctors.length > 0) {
      setIsPolling(true);

      // Minimal fallback polling - WebSocket should handle most real-time updates
      const pollInterval = setInterval(() => {
        doctors.forEach(doctor => {
          const lastUpdate = lastUpdateTime[doctor.id] || 0;
          const now = Date.now();
          const minInterval = 5 * 60 * 1000; // 5 minutes - much less aggressive

          // Only update if enough time has passed
          if (now - lastUpdate > minInterval) {
            fetchDoctorTimeslots(doctor.id, true); // Silent update
          }
        });
      }, 5 * 60 * 1000); // Check every 5 minutes instead of 15 seconds

      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, lastUpdateTime]);

  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const generateDynamicTimeslots = (doctorId: number, bookedSlots: string[] = [], workSchedule?: Record<string, WorkScheduleDay> | null) => {
    // No schedule set — return empty (card will show "Пока что не указано")
    if (!workSchedule) return [];

    const slots: TimeSlot[] = [];
    const now = new Date();

    // Generate slots for next 14 days
    for (let day = 0; day < 14; day++) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + day);

      const startOfDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
      const isToday = day === 0;

      // Determine working hours for this day from work_schedule
      const dayName = DAY_NAMES[baseDate.getDay()];
      const daySchedule = workSchedule?.[dayName];

      // If schedule exists but this day is disabled, skip entirely
      if (workSchedule && daySchedule && !daySchedule.enabled) continue;

      // Parse working hours (fall back to 0-24 if no schedule)
      let startHour = 0, startMinute = 0, endHour = 24, endMinute = 0;
      if (workSchedule && daySchedule && daySchedule.enabled) {
        const [sh, sm] = daySchedule.start.split(':').map(Number);
        const [eh, em] = daySchedule.end.split(':').map(Number);
        startHour = sh; startMinute = sm;
        endHour = eh; endMinute = em;
      }

      for (let hour = startHour; hour <= endHour; hour++) {
        const minuteStart = hour === startHour ? startMinute : 0;
        const minuteEnd = hour === endHour ? endMinute : 60;

        for (let minute = minuteStart; minute < minuteEnd; minute += 15) {
          const slotStart = new Date(startOfDay);
          slotStart.setHours(hour, minute, 0, 0);

          // Skip past times for today
          if (isToday && slotStart <= now) continue;

          const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000);

          // Don't create a slot if it extends past end of working hours
          if (workSchedule && daySchedule && daySchedule.enabled) {
            if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > endMinute)) continue;
          }

          const slotId = Date.parse(slotStart.toISOString()) + doctorId;
          const slotTimeString = slotStart.toISOString();

          let isBooked = bookedSlots.includes(slotTimeString);
          if (!isBooked) {
            const slotTime = slotStart.getTime();
            isBooked = bookedSlots.some(bookedSlot => {
              try {
                const bookedTime = new Date(bookedSlot).getTime();
                return Math.abs(slotTime - bookedTime) < 60000;
              } catch {
                return false;
              }
            });
          }

          slots.push({
            id: slotId,
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            available_spots: isBooked ? 0 : 1,
            max_consultations: 1,
            is_booked: isBooked
          });
        }
      }
    }

    return slots;
  };

  const fetchDoctorTimeslots = async (doctorId: number, silent = false) => {
    try {
      // Instead of fetching pre-created slots, fetch only BOOKED consultations
      const apiUrl = `/consultations/doctor/${doctorId}/booked-slots/`;
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // console.log(`🔍 Fetching booked slots: ${apiUrl}?start_date=${startDate}&end_date=${endDate}`);

      const { data } = await api.get(apiUrl, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      // console.log(`📨 Backend response:`, data);

      const bookedSlots = data.booked_slots || [];
      // console.log(`📅 Booked slots array:`, bookedSlots);

      if (!silent) {
        // console.log(`Doctor ${doctorId}: Found ${bookedSlots.length} booked slots`);
      }

      // Generate dynamic available slots (excluding booked ones, respecting work schedule)
      const doctor = doctors.find(d => d.id === doctorId);
      const availableSlots = generateDynamicTimeslots(doctorId, bookedSlots, doctor?.work_schedule);

      // Check if slots actually changed before updating state
      const currentSlots = doctorTimeslots[doctorId] || [];
      const slotsChanged = availableSlots.length !== currentSlots.length ||
        !availableSlots.every(slot => currentSlots.some(current => current.id === slot.id));

      if (slotsChanged) {
        setDoctorTimeslots(prev => ({
          ...prev,
          [doctorId]: availableSlots
        }));

        if (!silent) {
          // console.log(`Generated ${availableSlots.length} available slots for doctor ${doctorId}`);
          if (availableSlots.length > 0) {
            // console.log(`First slot: ${availableSlots[0].start_time}, Last slot: ${availableSlots[availableSlots.length - 1].start_time}`);
          }
        } else {
          // console.log(`🔄 Real-time update: Doctor ${doctorId} slots changed (${availableSlots.length} available)`);
        }
      }

      // Update last fetch time
      setLastUpdateTime(prev => ({
        ...prev,
        [doctorId]: Date.now()
      }));

    } catch (error) {
      if (!silent) {
        console.error('Error fetching booked slots for doctor', doctorId, error);

        // Fallback: Generate slots with schedule but assume none are booked
        const fallbackDoctor = doctors.find(d => d.id === doctorId);
        const availableSlots = generateDynamicTimeslots(doctorId, [], fallbackDoctor?.work_schedule);

        setDoctorTimeslots(prev => ({
          ...prev,
          [doctorId]: availableSlots
        }));

        // console.log(`Fallback: Generated ${availableSlots.length} slots for doctor ${doctorId}`);
      }
      // Silent errors in polling - don't update state to avoid overriding good data
    }
  };

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
      const consultationData: any = {
        scheduled_at: selectedTimeslot.start_time,
        scheduled_time: selectedTimeslot.start_time,
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

  const toggleCalendarView = (doctorId: number) => {
    setShowFullCalendar(prev => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Cache handlers per doctor ID to avoid creating new functions
  // Use a ref to store handlers so they're stable across renders
  const doctorHandlersRef = React.useRef<Record<number, {
    onToggle: () => void;
    onSelect: () => void;
  }>>({});

  // Create handlers only for doctors that don't have them yet
  filteredDoctors.forEach(doctor => {
    if (!doctorHandlersRef.current[doctor.id]) {
      doctorHandlersRef.current[doctor.id] = {
        onToggle: () => toggleCalendarView(doctor.id),
        onSelect: () => handleDoctorSelect(doctor.id),
      };
    }
  });

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
          <div className="space-y-3 w-full">
            {filteredDoctors.map((doctor) => {
              const handlers = doctorHandlersRef.current[doctor.id];
              if (!handlers) return null;

              const lastUpdate = lastUpdateTime[doctor.id];
              const lastUpdateDisplay = lastUpdate
                ? new Date(lastUpdate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isRecommended={recommendedDoctor?.id === doctor.id}
                  isSelected={selectedDoctorId === doctor.id}
                  language={language}
                  isUrgent={isUrgent}
                  timeslots={doctorTimeslots[doctor.id] || []}
                  selectedDate={selectedDate}
                  showFullCalendar={showFullCalendar[doctor.id] || false}
                  doctorTimeslotsByDate={doctorTimeslotsByDate[doctor.id]}
                  lastUpdateTime={lastUpdateDisplay}
                  onDateSelect={handleDateSelect}
                  onTimeslotSelect={handleTimeslotSelect}
                  onToggleCalendar={handlers.onToggle}
                  onClick={handlers.onSelect}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        canProceed={!!selectedDoctorId}
        disabled={bookingLoading}
      />

      {/* Timeslot Confirmation Modal */}
      {showConfirmModal && selectedTimeslot && selectedDoctorForBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center space-y-4">
              {/* Header */}
              <div className="p-3 rounded-full bg-blue-100 w-16 h-16 mx-auto flex items-center justify-center">
                <div className="text-2xl">📅</div>
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Подтвердите запись
              </h3>

              {/* Doctor Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="font-semibold text-gray-900">
                  {selectedDoctorForBooking.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {getSpecializationName(selectedDoctorForBooking, language)}
                </div>
                <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {new Date(selectedTimeslot.start_time).toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  {new Date(selectedTimeslot.start_time).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                Вы записываетесь на консультацию в указанное время. Подтвердите, если всё верно.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelTimeslotBooking}
                  disabled={bookingLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmTimeslotBooking}
                  disabled={bookingLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
      )}
    </motion.div>
  );
};

export default VideoConsultationStep2;