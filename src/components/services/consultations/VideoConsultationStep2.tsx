import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { api } from "@/utils/api";

// Import our new components
import DoctorSearchAndFilters from "./components/DoctorSearchAndFilters";
import NavigationButtons from "./components/NavigationButtons";
import DoctorList from "./components/DoctorList";
import AIRecommendationBlock from "./components/AIRecommendationBlock";
import DoctorCard from "./components/DoctorCard";

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
  onConsultationBooked?: (consultationId: number) => void;
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
}) => {
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByType, setFilterByType] = useState<string>("all");
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
  const [isUserActive, setIsUserActive] = useState(true);

  // Use our custom hook for filtering
  const { filteredDoctors, doctorTypes } = useDoctorFiltering({
    doctors,
    searchTerm,
    filterByType,
    language,
    recommendedDoctor,
  });

  // Check if consultation is urgent
  const isUrgent = recommendedDoctor?.urgency === 'urgent';

  // Fetch timeslots for non-urgent consultations
  useEffect(() => {
    if (!isUrgent && doctors.length > 0) {
      doctors.forEach(doctor => {
        fetchDoctorTimeslots(doctor.id);
      });
    }
  }, [doctors, isUrgent]);

  // Track user activity for optimized polling
  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsUserActive(true);
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        setIsUserActive(false);
      }, 2 * 60 * 1000); // Consider inactive after 2 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Initialize

    return () => {
      clearTimeout(activityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, []);

  // Real-time polling for timeslot updates
  useEffect(() => {
    if (!isUrgent && doctors.length > 0) {
      setIsPolling(true);

      // Adaptive polling: faster when user is active
      const pollInterval = setInterval(() => {
        if (isUserActive) {
          doctors.forEach(doctor => {
            const lastUpdate = lastUpdateTime[doctor.id] || 0;
            const now = Date.now();
            const minInterval = isUserActive ? 15000 : 60000; // 15s active, 60s inactive

            // Only update if enough time has passed
            if (now - lastUpdate > minInterval) {
              fetchDoctorTimeslots(doctor.id, true); // Silent update
            }
          });
        }
      }, 15000); // Check every 15 seconds, but actual updates are controlled by minInterval

      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    }
  }, [doctors, isUrgent, lastUpdateTime, isUserActive]);

  const generateDynamicTimeslots = (doctorId: number, bookedSlots: string[] = []) => {
    const slots: TimeSlot[] = [];
    const now = new Date();

    // Get user's timezone info
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert to milliseconds

    console.log(`🌍 User timezone: ${userTimezone}, offset: ${now.getTimezoneOffset()} minutes`);

    // Generate slots for next 14 days
    for (let day = 0; day < 14; day++) {
      // Create date in user's local timezone
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + day);

      // Reset to start of day in user's timezone
      const startOfDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);

      const isToday = day === 0;

      // Generate 15-minute slots for full 24 hours in user's timezone
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          // Create slot time in user's local timezone
          const slotStart = new Date(startOfDay);
          slotStart.setHours(hour, minute, 0, 0);

          // Skip past times ONLY for today
          if (isToday && slotStart <= now) continue;

          const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000); // +15 minutes

          const slotId = Date.parse(slotStart.toISOString()) + doctorId; // Unique numeric ID
          const isBooked = bookedSlots.includes(slotStart.toISOString());

          // Only include available slots
          if (!isBooked) {
            slots.push({
              id: slotId,
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              available_spots: 1,
              max_consultations: 1
            });
          }
        }
      }
    }

    if (slots.length > 0) {
      console.log(`🕐 Generated ${slots.length} slots in timezone ${userTimezone}`);
      console.log(`🕐 First slot: ${new Date(slots[0].start_time).toLocaleString()}`);
      console.log(`🕐 Last slot: ${new Date(slots[slots.length - 1].start_time).toLocaleString()}`);
      console.log(`🕐 First slot ISO: ${slots[0].start_time}`);
      console.log(`🕐 Last slot ISO: ${slots[slots.length - 1].start_time}`);
    }

    return slots;
  };

  const fetchDoctorTimeslots = async (doctorId: number, silent = false) => {
    try {
      // Instead of fetching pre-created slots, fetch only BOOKED consultations
      const apiUrl = `/consultations/doctor/${doctorId}/booked-slots/`;
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log(`🔍 Fetching booked slots: ${apiUrl}?start_date=${startDate}&end_date=${endDate}`);

      const { data } = await api.get(apiUrl, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      console.log(`📨 Backend response:`, data);

      const bookedSlots = data.booked_slots || [];
      console.log(`📅 Booked slots array:`, bookedSlots);

      if (!silent) {
        console.log(`Doctor ${doctorId}: Found ${bookedSlots.length} booked slots`);
      }

      // Generate dynamic available slots (excluding booked ones)
      const availableSlots = generateDynamicTimeslots(doctorId, bookedSlots);

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
          console.log(`Generated ${availableSlots.length} available slots for doctor ${doctorId}`);
          if (availableSlots.length > 0) {
            console.log(`First slot: ${availableSlots[0].start_time}, Last slot: ${availableSlots[availableSlots.length - 1].start_time}`);
          }
        } else {
          console.log(`🔄 Real-time update: Doctor ${doctorId} slots changed (${availableSlots.length} available)`);
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

        // Fallback: Generate all slots (assume none are booked)
        const availableSlots = generateDynamicTimeslots(doctorId, []);

        setDoctorTimeslots(prev => ({
          ...prev,
          [doctorId]: availableSlots
        }));

        console.log(`Fallback: Generated ${availableSlots.length} slots for doctor ${doctorId}`);
      }
      // Silent errors in polling - don't update state to avoid overriding good data
    }
  };

  const handleDoctorSelect = async (doctorId: number) => {
    onSelect(doctorId);

    if (aiRecommendationId && recommendedDoctor) {
      if (isUrgent) {
        // Create urgent consultation immediately
        await createUrgentConsultation(doctorId);
      }
      // For non-urgent, user needs to select timeslot first
    } else {
      // Regular flow without AI processing
      onNext();
    }
  };

  const createUrgentConsultation = async (doctorId: number) => {
    try {
      setBookingLoading(true);
      const { data } = await api.post('/consultations/ai-process/', {
        ai_recommendation_id: aiRecommendationId,
        preferred_doctor_id: doctorId,
      });

      if (data.consultation) {
        onConsultationBooked?.(data.consultation.id);
      }
    } catch (error) {
      console.error('Error creating urgent consultation:', error);
      // Fallback to regular flow
      onNext();
    } finally {
      setBookingLoading(false);
    }
  };

  const handleTimeslotSelect = async (timeslot: TimeSlot) => {
    if (!selectedDoctorId || !aiRecommendationId) return;

    try {
      setBookingLoading(true);

      // Book with dynamic timeslot data (no pre-existing timeslot_id)
      const { data } = await api.post('/consultations/book-dynamic-slot/', {
        doctor_id: selectedDoctorId,
        scheduled_time: timeslot.start_time,
        ai_recommendation_id: aiRecommendationId,
      });

      if (data.consultation) {
        // Remove the booked slot from available slots
        setDoctorTimeslots(prev => ({
          ...prev,
          [selectedDoctorId]: prev[selectedDoctorId]?.filter(slot => slot.id !== timeslot.id) || []
        }));

        onConsultationBooked?.(data.consultation.id);
      }
    } catch (error) {
      console.error('Error booking consultation:', error);
    } finally {
      setBookingLoading(false);
    }
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

  const renderDoctorCard = (doctor: Doctor, isRecommended: boolean, isSelected: boolean) => {
    return (
      <DoctorCard
        doctor={doctor}
        isRecommended={isRecommended}
        isSelected={isSelected}
        language={language}
        isUrgent={isUrgent}
        timeslots={doctorTimeslots[doctor.id] || []}
        selectedDate={selectedDate}
        showFullCalendar={showFullCalendar[doctor.id]}
        doctorTimeslotsByDate={doctorTimeslotsByDate[doctor.id]}
        onDateSelect={handleDateSelect}
        onTimeslotSelect={handleTimeslotSelect}
        onToggleCalendar={() => toggleCalendarView(doctor.id)}
        onClick={() => handleDoctorSelect(doctor.id)}
      />
    );
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
          {isPolling && (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs">Обновление в реальном времени</span>
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
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <User size={16} />
          </div>
          Выбор врача
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          ИИ проанализировал ваши симптомы и подобрал специалиста
        </p>
      </motion.div>

      {/* AI Recommendation Block */}
      <AIRecommendationBlock
        recommendedDoctor={recommendedDoctor}
        aiErrorData={aiErrorData}
        fallbackUsed={fallbackUsed}
      />

      {/* Search and Filters */}
      <DoctorSearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterByType={filterByType}
        onFilterChange={setFilterByType}
        language={language}
        onLanguageChange={setLanguage}
        doctorTypes={doctorTypes}
      />

      {/* Doctor List */}
      <DoctorList
        doctors={doctors}
        filteredDoctors={filteredDoctors}
        loading={loading}
        selectedDoctorId={selectedDoctorId}
        recommendedDoctor={recommendedDoctor}
        onDoctorSelect={handleDoctorSelect}
        renderDoctorCard={renderDoctorCard}
      />

      {/* Navigation */}
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        canProceed={!!selectedDoctorId}
        disabled={bookingLoading}
      />
    </motion.div>
  );
};

export default VideoConsultationStep2;