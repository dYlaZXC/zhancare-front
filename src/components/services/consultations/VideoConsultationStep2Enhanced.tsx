import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Sparkles,
  Smile,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Bot,
  User,
  Shield,
  Zap,
  Heart,
  Info,
  Calendar,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Video,
  MessageSquare,
  Medal,
  Stethoscope,
  GraduationCap,
  TrendingUp
} from "lucide-react";
import clsx from "clsx";
import TimeslotBooking from "./TimeslotBooking";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  rating?: number;
  experience?: number;
  availability?: string;
  avatar?: string;
  specialties?: string[];
}

interface Step2Props {
  doctors: Doctor[];
  selectedDoctorId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  symptoms: string;
  recommendedDoctor?: {
    id: number;
    name: string;
    doctor_type: string;
    reason: string;
    urgency: string;
    confidence?: number;
  };
  aiErrorData?: {
    specialty: string;
    reason: string;
    raw: string;
  };
  fallbackUsed?: boolean;
  aiRecommendationId?: number; // New prop for AI recommendation ID
}

const VideoConsultationStep2Enhanced: React.FC<Step2Props> = ({
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
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByType, setFilterByType] = useState<string>("all");
  const [isRecommendationExpanded, setIsRecommendationExpanded] = useState(true);
  const [showTimeslotBooking, setShowTimeslotBooking] = useState(false);
  const [aiProcessResult, setAiProcessResult] = useState<any>(null);
  const [processingAI, setProcessingAI] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const doctorName = doctor.name || '';
      const doctorType = doctor.doctor_type || '';

      const matchesSearch =
        doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctorType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterByType === "all" || doctorType.toLowerCase().includes(filterByType.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [doctors, searchTerm, filterByType]);

  // Determine if we should show urgency warning
  const isUrgent = recommendedDoctor?.urgency === 'urgent';
  const isNonUrgent = recommendedDoctor?.urgency === 'non_urgent';

  // Process AI recommendation when doctor is selected
  const handleDoctorSelect = async (doctorId: number) => {
    onSelect(doctorId);

    // If we have AI recommendation and urgency info, process it
    if (aiRecommendationId && recommendedDoctor) {
      setProcessingAI(true);

      try {
        const response = await fetch('/api/consultations/ai-process/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ai_recommendation_id: aiRecommendationId,
            preferred_doctor_id: doctorId,
          }),
        });

        if (!response.ok) {
          throw new Error('Ошибка обработки AI рекомендации');
        }

        const data = await response.json();
        setAiProcessResult(data);

        // If urgent, consultation is created automatically
        if (data.is_urgent) {
          // Show urgent consultation created message and redirect
          onNext();
        } else {
          // Show timeslot selection
          setShowTimeslotBooking(true);
        }
      } catch (error) {
        console.error('Error processing AI recommendation:', error);
        // Fallback to regular flow
        onNext();
      } finally {
        setProcessingAI(false);
      }
    } else {
      // Regular flow without AI processing
      onNext();
    }
  };

  const handleBookingComplete = (consultationId: number) => {
    // Consultation booked successfully, proceed to next step
    onNext();
  };

  // If showing timeslot booking, render that component
  if (showTimeslotBooking && selectedDoctorId && aiRecommendationId) {
    return (
      <TimeslotBooking
        doctorId={selectedDoctorId}
        aiRecommendationId={aiRecommendationId}
        urgency={recommendedDoctor?.urgency as "urgent" | "non_urgent" || "non_urgent"}
        onBookingComplete={handleBookingComplete}
        onBack={() => setShowTimeslotBooking(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* AI Recommendation Header */}
        {recommendedDoctor && (
          <div className={clsx(
            "p-4 md:p-6 border-b border-gray-200",
            isUrgent ? "bg-red-50" : "bg-blue-50"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isUrgent ? "bg-red-100" : "bg-blue-100"
              )}>
                {isUrgent ? (
                  <Zap className={clsx("w-5 h-5", isUrgent ? "text-red-600" : "text-blue-600")} />
                ) : (
                  <Bot className={clsx("w-5 h-5", isUrgent ? "text-red-600" : "text-blue-600")} />
                )}
              </div>
              <div>
                <h3 className={clsx(
                  "font-bold",
                  isUrgent ? "text-red-800" : "text-blue-800"
                )}>
                  {isUrgent ? "⚠️ Экстренная консультация" : "🤖 AI Рекомендация"}
                </h3>
                <p className={clsx(
                  "text-sm",
                  isUrgent ? "text-red-600" : "text-blue-600"
                )}>
                  {isUrgent
                    ? "Ваши симптомы требуют немедленного внимания врача"
                    : `Рекомендуется: ${recommendedDoctor.doctor_type}`
                  }
                </p>
              </div>
            </div>

            {isUrgent && (
              <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">
                  🚨 При выборе врача консультация начнется немедленно. Врач свяжется с вами в течение 5-10 минут.
                </p>
              </div>
            )}

            {isNonUrgent && (
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Причина:</strong> {recommendedDoctor.reason}
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  💡 После выбора врача вы сможете выбрать удобное время для консультации
                </p>
              </div>
            )}
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Stethoscope className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Выберите врача
            </h2>
            <p className="text-gray-600">
              {isUrgent
                ? "Выберите врача для экстренной консультации"
                : "Найдите подходящего специалиста для вашей консультации"
              }
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по имени или специализации..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <select
              value={filterByType}
              onChange={(e) => setFilterByType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все специализации</option>
              <option value="терапевт">Терапевт</option>
              <option value="кардиолог">Кардиолог</option>
              <option value="невролог">Невролог</option>
              <option value="педиатр">Педиатр</option>
            </select>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {filteredDoctors.map((doctor) => {
              const isRecommended = recommendedDoctor?.id === doctor.id;
              const isSelected = selectedDoctorId === doctor.id;

              return (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "relative p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 shadow-lg"
                      : isRecommended
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                  )}
                  onClick={() => handleDoctorSelect(doctor.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </div>
                  )}

                  {/* Doctor Avatar */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg md:text-xl">
                        {doctor.name.charAt(0)}
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <h3 className="font-bold text-gray-800 mb-1">{doctor.name}</h3>
                    <p className="text-sm text-indigo-600 font-medium mb-2">{doctor.doctor_type}</p>

                    {/* Rating and Experience */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      {doctor.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span>{doctor.rating}</span>
                        </div>
                      )}
                      {doctor.experience && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-blue-500" />
                          <span>{doctor.experience} лет</span>
                        </div>
                      )}
                    </div>

                    {/* Availability */}
                    <div className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      isUrgent
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    )}>
                      {isUrgent ? "🚨 Экстренно" : "📅 Доступен"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* No doctors found */}
          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Врачи не найдены по вашему запросу</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>

            {!aiRecommendationId && (
              <button
                onClick={onNext}
                disabled={!selectedDoctorId || loading || processingAI}
                className={clsx(
                  "px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200",
                  selectedDoctorId && !loading && !processingAI
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {processingAI ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Bot className="w-4 h-4" />
                    </motion.div>
                    Обработка AI...
                  </>
                ) : loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                    Загрузка...
                  </>
                ) : (
                  <>
                    Продолжить
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoConsultationStep2Enhanced;