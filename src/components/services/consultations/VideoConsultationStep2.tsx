import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Sparkles, RefreshCw, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wand2, Clock, FileText } from "lucide-react";
import { api } from "@/utils/api";
import { getCurrencySymbol } from "@/utils/currency";

import DoctorSearchAndFilters from "./components/DoctorSearchAndFilters";
import DoctorCard from "./components/DoctorCard";

import type { Doctor, TimeSlot, RecommendedDoctor, AIErrorData, Language } from "./types/doctor";
import { useDoctorFiltering } from "./hooks/useDoctorFiltering";
import { getSpecializationName } from "./utils/doctorUtils";
import { useLanguage } from "@/context/LanguageContext";

const STEP2_TEXT = {
  ru: {
    chooseDoctor: "Выбор врача", doctors: "врачей", book: "Записаться",
    aiAnalyzing: "ИИ анализирует симптомы...", aiAnalyzingSub: "Подбираем наиболее подходящего специалиста",
    aiPicked: "ИИ подобрал специалиста", whileWaiting: "Пока ждёте: подготовьте список лекарств и время появления симптомов",
    rewrite: "Написать заново",
    aiPickTitle: "Подобрать врача с помощью ИИ", aiPickSub: "Опишите симптомы — ИИ найдёт подходящего специалиста",
    aiPlaceholder: "Например: головная боль, температура 38°C...", askAi: "Спросить ИИ",
    today: "Сегодня",
    loadingDoctors: "Загружаем врачей...", noDoctorsAvailable: "Нет доступных врачей", noDoctorsFound: "Врачи не найдены",
    confirmBooking: "Подтвердите запись", consultationCost: "Стоимость консультации", clinic: "Клиника",
    format: "Формат", onlineVideo: "Видеоконсультация", cancel: "Отмена", booking: "Записываем...",
    confirmBookingBtn: "Подтвердить запись", confirmError: "Ошибка при подтверждении времени. Попробуйте снова.",
    locale: "ru-RU", days: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  },
  kz: {
    chooseDoctor: "Дәрігерді таңдау", doctors: "дәрігер", book: "Жазылу",
    aiAnalyzing: "AI симптомдарды талдап жатыр...", aiAnalyzingSub: "Ең сәйкес маманды таңдап жатырмыз",
    aiPicked: "AI маманды таңдады", whileWaiting: "Күтіп жатқанда: дәрі-дәрмек тізімін және симптомдар басталған уақытты дайындаңыз",
    rewrite: "Қайта жазу",
    aiPickTitle: "AI көмегімен дәрігерді таңдау", aiPickSub: "Симптомдарды сипаттаңыз — AI сәйкес маманды табады",
    aiPlaceholder: "Мысалы: бас ауруы, температура 38°C...", askAi: "AI-ден сұрау",
    today: "Бүгін",
    loadingDoctors: "Дәрігерлерді жүктеп жатырмыз...", noDoctorsAvailable: "Қолжетімді дәрігерлер жоқ", noDoctorsFound: "Дәрігерлер табылмады",
    confirmBooking: "Жазылуды растаңыз", consultationCost: "Кеңес құны", clinic: "Клиника",
    format: "Формат", onlineVideo: "Онлайн · Бейне", cancel: "Бас тарту", booking: "Жазылып жатырмыз...",
    confirmBookingBtn: "Жазылуды растау", confirmError: "Уақытты растау кезінде қате орын алды. Қайталап көріңіз.",
    locale: "kk-KZ", days: ['Жк','Дс','Сс','Ср','Бс','Жм','Сб'],
  },
  en: {
    chooseDoctor: "Choose a doctor", doctors: "doctors", book: "Book",
    aiAnalyzing: "AI is analyzing your symptoms...", aiAnalyzingSub: "Finding the most suitable specialist",
    aiPicked: "AI picked a specialist", whileWaiting: "While you wait: prepare a list of medications and when symptoms started",
    rewrite: "Rewrite",
    aiPickTitle: "Find a doctor with AI", aiPickSub: "Describe your symptoms — AI will find a suitable specialist",
    aiPlaceholder: "Example: headache, temperature 38°C...", askAi: "Ask AI",
    today: "Today",
    loadingDoctors: "Loading doctors...", noDoctorsAvailable: "No doctors available", noDoctorsFound: "No doctors found",
    confirmBooking: "Confirm booking", consultationCost: "Consultation cost", clinic: "Clinic",
    format: "Format", onlineVideo: "Online · Video", cancel: "Cancel", booking: "Booking...",
    confirmBookingBtn: "Confirm booking", confirmError: "Error confirming the time. Please try again.",
    locale: "en-US", days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },
  uz: {
    chooseDoctor: "Shifokorni tanlash", doctors: "shifokor", book: "Yozilish",
    aiAnalyzing: "AI simptomlarni tahlil qilmoqda...", aiAnalyzingSub: "Eng mos mutaxassisni tanlamoqdamiz",
    aiPicked: "AI mutaxassisni tanladi", whileWaiting: "Kutayotganingizda: dorilar ro'yxati va simptomlar boshlangan vaqtni tayyorlang",
    rewrite: "Qayta yozish",
    aiPickTitle: "AI yordamida shifokorni tanlash", aiPickSub: "Simptomlarni tasvirlang — AI mos mutaxassisni topadi",
    aiPlaceholder: "Masalan: bosh og'rig'i, harorat 38°C...", askAi: "AI'dan so'rash",
    today: "Bugun",
    loadingDoctors: "Shifokorlar yuklanmoqda...", noDoctorsAvailable: "Mavjud shifokorlar yo'q", noDoctorsFound: "Shifokorlar topilmadi",
    confirmBooking: "Yozilishni tasdiqlang", consultationCost: "Konsultatsiya narxi", clinic: "Klinika",
    format: "Format", onlineVideo: "Onlayn · Video", cancel: "Bekor qilish", booking: "Yozilmoqda...",
    confirmBookingBtn: "Yozilishni tasdiqlash", confirmError: "Vaqtni tasdiqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
    locale: "uz-UZ", days: ['Ya','Du','Se','Ch','Pa','Ju','Sh'],
  },
};

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
  const { language: uiLanguage } = useLanguage();
  const tt = STEP2_TEXT[uiLanguage as keyof typeof STEP2_TEXT] ?? STEP2_TEXT.ru;
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
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
        slots: Array<{ start: string; end: string; status: string; start_utc?: string }>;
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
                start_utc: slot.start_utc,   // UTC ISO from backend; sent as scheduled_time
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
    api.get('/clinic-stats/').then((res: any) => {
      const cur = res.data?.clinic_info?.currency;
      if (cur) setClinicCurrency(cur);
    }).catch(() => {});
  }, []);

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

      const consultationData: any = {
        scheduled_at: selectedTimeslot.start_time,
        scheduled_time: selectedTimeslot.start_utc ?? selectedTimeslot.start_time,
        doctor_id: bookingDoctorId,
      };

      if (aiRecommendationId) {
        consultationData.ai_recommendation_id = aiRecommendationId;
      }

      setShowConfirmModal(false);
      onConsultationBooked?.(0, consultationData);
    } catch (error) {
      console.error('Error confirming timeslot:', error);
      alert(tt.confirmError);
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelTimeslotBooking = () => {
    setShowConfirmModal(false);
    setSelectedTimeslot(null);
    setSelectedDoctorForBooking(null);
  };

  const DAY_NAMES = tt.days;

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

        {/* Top bar: title · status · CTA */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-800 flex-1">{tt.chooseDoctor}</span>

          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${websocketConnected ? 'bg-emerald-400' : 'bg-orange-400'} animate-pulse`} />
          <span className="text-xs text-gray-400 flex-shrink-0">{filteredDoctors.length} {tt.doctors}</span>

          {(() => {
            const doc = selectedDoctorId ? doctors.find(d => d.id === selectedDoctorId) : null;
            const earliestSlot = doc ? (doctorTimeslots[doc.id] || []).find(sl => !sl.is_booked && (sl.available_spots ?? 1) > 0) : null;
            if (!doc) return (
              <button disabled className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-100 cursor-not-allowed flex-shrink-0">
                {tt.book} <ArrowRight size={14} />
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
                {doc.name.split(' ')[0]} · {tt.book} <ArrowRight size={13} />
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
                <p className="text-sm font-semibold text-blue-900">{tt.aiAnalyzing}</p>
                <p className="text-xs text-blue-600">{tt.aiAnalyzingSub}</p>
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
                  <p className="text-xs text-emerald-600 mt-0.5">{tt.aiPicked}</p>

                  {recommendedDoctor.reason && (
                    <p className="text-xs text-emerald-800 leading-relaxed mt-2">{recommendedDoctor.reason}</p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600">
                    <Clock size={10} className="flex-shrink-0" />
                    <span>{tt.whileWaiting}</span>
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
                    <RefreshCw size={11} /> {tt.rewrite}
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
                  <p className="text-sm font-bold text-indigo-900 leading-tight">{tt.aiPickTitle}</p>
                  <p className="text-xs text-indigo-500">{tt.aiPickSub}</p>
                </div>
              </div>

              {/* Input */}
              <div className="flex items-center rounded-xl border border-indigo-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all overflow-hidden shadow-sm">
                <input
                  type="text"
                  value={localAISymptoms}
                  onChange={(e) => setLocalAISymptoms(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && localAISymptoms.trim() && onRequestAIRecommendation(localAISymptoms)}
                  placeholder={tt.aiPlaceholder}
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
                  {tt.askAi}
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
              {tt.today}
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
              <span className="text-sm">{tt.loadingDoctors}</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <User size={32} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">{doctorsError || (doctors.length === 0 ? tt.noDoctorsAvailable : tt.noDoctorsFound)}</p>
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
                  clinicCurrency={clinicCurrency}
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
        const dateStr = slotDate.toLocaleDateString(tt.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = slotDate.toLocaleTimeString(tt.locale, { hour: '2-digit', minute: '2-digit' });
        const endTime = selectedTimeslot.end_time
          ? new Date(selectedTimeslot.end_time).toLocaleTimeString(tt.locale, { hour: '2-digit', minute: '2-digit' })
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

                <h3 className="text-lg font-bold text-gray-900">{tt.confirmBooking}</h3>

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
                      <span className="text-sm text-gray-500">{tt.consultationCost}</span>
                      <span className="text-sm font-black text-emerald-600">
                        {Number(doc.online_consultation_price).toLocaleString(tt.locale, { minimumFractionDigits: 0 })} {getCurrencySymbol(clinicCurrency)}
                      </span>
                    </div>
                  )}

                  {doc.clinic && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">{tt.clinic}</span>
                      <span className="text-sm font-semibold text-gray-700">{doc.clinic.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500">{tt.format}</span>
                    <span className="text-sm font-semibold text-violet-600">{tt.onlineVideo}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelTimeslotBooking}
                    disabled={bookingLoading}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {tt.cancel}
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
                        {tt.booking}
                      </>
                    ) : (
                      tt.confirmBookingBtn
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
