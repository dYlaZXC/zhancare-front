"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  Clock,
  Star,
  Building2,
  User,
  ArrowRight,
  Zap,
  Heart,
  CheckCircle2,
  Loader2,
  Brain,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import type { Doctor } from "./consultations/types/doctor";

interface Clinic {
  id: number;
  name: string;
  address: string | null;
  city_name: string | null;
  district_name: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
}

interface SmartRecommendation {
  doctor: Doctor & { clinic?: Clinic | null };
  clinic: Clinic | null;
  score: number;
  reasons: string[];
  type: "best" | "premium" | "economy";
  badge: string;
  availability: "now" | "today" | "soon";
  distance?: number;
  estimatedPrice?: number;
}

const SmartConsultationFlow: React.FC = () => {
  const { token } = useAuth();
  const [step, setStep] = useState<"input" | "loading" | "results">("input");
  const [symptoms, setSymptoms] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location not available:", error);
        }
      );
    }
  }, []);

  // Calculate distance between two points (simplified)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSmartSearch = async () => {
    if (!symptoms.trim() && !isUrgent) {
      toast.warn("⚠️ Пожалуйста, опишите ваши симптомы");
      return;
    }

    setStep("loading");

    try {
      // Step 1: Get AI recommendation for doctor specialty
      const aiRes = await api.post(
        "/consultations/ai-recommend/",
        { symptoms: symptoms || "Срочная консультация", language: "ru" },
        { headers: { Authorization: `Token ${token}` } }
      );

      // Step 2: Get all available doctors
      const doctorsRes = await api.get("/auth/doctor/available/", {
        headers: { Authorization: `Token ${token}` },
        params: { lang: "ru" },
      });

      // Step 3: Get clinics data
      const clinicsRes = await api.get("/clinics/", {
        params: { page_size: 100 },
      });

      const doctors: Doctor[] = doctorsRes.data?.doctors || [];
      const clinics: Clinic[] = clinicsRes.data?.results || [];

      // Create a map of clinic_id to clinic data
      const clinicMap = new Map(clinics.map((c) => [c.id, c]));

      // Step 4: Smart ranking algorithm
      const rankedOptions: SmartRecommendation[] = doctors
        .map((doctor) => {
          let score = 0;
          const reasons: string[] = [];
          const clinic = doctor.clinic_id ? clinicMap.get(doctor.clinic_id) : null;

          // Rating factor (0-30 points)
          if (doctor.rating) {
            score += doctor.rating * 6;
            if (doctor.rating >= 4.5) reasons.push("Высокий рейтинг");
          }

          // Availability factor (0-25 points)
          if (doctor.availability_status === "available") {
            score += 25;
            reasons.push("Доступен сейчас");
          } else if (doctor.availability_status !== "offline") {
            score += 10;
          }

          // Experience factor (0-15 points)
          if (doctor.years_of_experience && doctor.years_of_experience > 10) {
            score += 15;
            reasons.push(`${doctor.years_of_experience} лет опыта`);
          } else if (doctor.years_of_experience && doctor.years_of_experience > 5) {
            score += 8;
          }

          // Distance factor (0-20 points)
          let distance: number | undefined;
          if (userLocation && clinic?.latitude && clinic?.longitude) {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              clinic.latitude,
              clinic.longitude
            );
            if (distance < 5) {
              score += 20;
              reasons.push(`${distance.toFixed(1)} км от вас`);
            } else if (distance < 15) {
              score += 10;
              reasons.push(`${distance.toFixed(1)} км от вас`);
            }
          }

          // AI recommendation match (0-10 points)
          if (
            aiRes.data?.recommended_doctor &&
            doctor.id === aiRes.data.recommended_doctor.id
          ) {
            score += 10;
            reasons.push("Рекомендация AI");
          }

          return {
            doctor: { ...doctor, clinic },
            clinic: clinic || ({} as Clinic),
            score,
            reasons,
            type: "best" as const,
            badge: "",
            availability: (doctor.availability_status === "available" ? "now" : "today") as "now" | "today" | "soon",
            distance,
            estimatedPrice: 3500, // Mock price, should come from backend
          };
        })
        .sort((a, b) => b.score - a.score);

      // Assign types: Best, Premium, Economy
      if (rankedOptions.length >= 3) {
        rankedOptions[0].type = "best";
        rankedOptions[0].badge = "ЛУЧШИЙ ВАРИАНТ";

        // Find premium (highest experience/rating, might be more expensive)
        const premiumIndex = rankedOptions.findIndex(
          (opt, idx) =>
            idx > 0 &&
            opt.doctor.years_of_experience &&
            opt.doctor.years_of_experience >= 15
        );
        if (premiumIndex > 0) {
          rankedOptions[premiumIndex].type = "premium";
          rankedOptions[premiumIndex].badge = "ПРЕМИУМ";
          rankedOptions[premiumIndex].estimatedPrice = 8000;
        }

        // Find economy (good rating but further or less experience)
        const economyIndex = rankedOptions.findIndex(
          (opt, idx) => idx > 1 && opt.type !== "premium"
        );
        if (economyIndex > 1) {
          rankedOptions[economyIndex].type = "economy";
          rankedOptions[economyIndex].badge = "ЭКОНОМ";
          rankedOptions[economyIndex].estimatedPrice = 2000;
        }
      }

      setRecommendations(rankedOptions.slice(0, 3));
      setStep("results");
    } catch (error) {
      console.error("Smart search error:", error);
      toast.error("⚠️ Ошибка поиска. Попробуйте снова.");
      setStep("input");
    }
  };

  const handleSelectRecommendation = (rec: SmartRecommendation) => {
    // TODO: Navigate to booking with pre-selected doctor and clinic
    toast.success(`Выбран: ${rec.doctor.name}`);
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Progress and Step Header */}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={14} />
                    Умная консультация • AI подбор
                  </div>
                  <div className="text-gray-500">
                    {symptoms.length}/500
                  </div>
                </div>

                {/* Enhanced Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-3"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                      <Brain size={16} />
                    </div>
                    Что вас беспокоит?
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    Опишите симптомы, и наш AI подберет лучшего врача и клинику специально для вас. Чем подробнее описание, тем точнее рекомендация.
                  </p>
                </motion.div>

                {/* Urgent Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsUrgent(true);
                    handleSmartSearch();
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-base md:text-lg">МНЕ СРОЧНО НУЖНА ПОМОЩЬ</span>
                </motion.button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-white text-gray-500">
                      или опишите симптомы подробно
                    </span>
                  </div>
                </div>

                {/* Symptoms Textarea */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="💬 Например: Болит голова с утра, пульсирующая боль в области висков. Температура 38.5°C, общая слабость, трудно концентрироваться..."
                      className={`w-full h-32 md:h-40 p-4 rounded-xl border-2 bg-white resize-none transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm md:text-base ${
                        symptoms.length < 20
                          ? 'border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-100'
                          : 'border-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-100'
                      }`}
                      maxLength={500}
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          symptoms.length < 10
                            ? 'bg-gradient-to-r from-red-400 to-red-500'
                            : symptoms.length < 30
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                            : 'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((symptoms.length / 20) * 100, 100)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                      {symptoms.length >= 20 ? (
                        <CheckCircle2 className="text-green-500" size={14} />
                      ) : (
                        <AlertCircle className="text-orange-500" size={14} />
                      )}
                      <span className={symptoms.length >= 20 ? 'text-green-600' : 'text-orange-600'}>
                        {symptoms.length >= 20 ? 'Отлично' : `Ещё ${20 - symptoms.length}`}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Categories */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-semibold text-gray-700">Быстрый выбор:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: Heart, label: "Простуда", text: "Температура, кашель, насморк" },
                      { icon: Brain, label: "Головная боль", text: "Сильная головная боль" },
                      { icon: Heart, label: "Сердце", text: "Боль в груди" },
                      { icon: Zap, label: "Усталость", text: "Слабость, недомогание" },
                    ].map((cat, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSymptoms(cat.text)}
                        className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-purple-400 rounded-xl p-3 transition-all text-left"
                      >
                        <cat.icon className="w-5 h-5 text-purple-500 mb-2" />
                        <p className="text-xs font-semibold text-gray-900">{cat.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3 pt-2 border-t border-gray-100"
                >
                  <button
                    onClick={() => setStep("input")}
                    className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                  >
                    Назад
                  </button>

                  <div className="flex-1" />

                  <motion.button
                    whileHover={symptoms.trim() ? { scale: 1.02 } : {}}
                    whileTap={symptoms.trim() ? { scale: 0.98 } : {}}
                    onClick={handleSmartSearch}
                    disabled={!symptoms.trim()}
                    className={`px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all min-w-[160px] ${
                      !symptoms.trim()
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/25"
                    }`}
                  >
                    {!symptoms.trim() ? (
                      <span>Введите симптомы</span>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Найти врача</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Анализируем симптомы...
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Подбираем лучших врачей специально для вас
                  </p>
                </div>

                <div className="flex justify-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-500 rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Найдено {recommendations.length} врача
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Подобрано специально для ваших симптомов
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Badge */}
                  {rec.badge && (
                    <div className="px-4 pt-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          rec.type === "best"
                            ? "bg-blue-100 text-blue-700"
                            : rec.type === "premium"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {rec.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-4 md:p-6">
                    {/* Doctor Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-900">
                          {rec.doctor.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-7">
                        {rec.doctor.doctor_type || rec.doctor.specialization?.name_ru}
                      </p>
                    </div>

                    {/* Clinic Info */}
                    {rec.clinic && (
                      <div className="flex items-start gap-2 mb-3 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{rec.clinic.name}</p>
                          {rec.distance && (
                            <p className="text-gray-500 text-xs">{rec.distance.toFixed(1)} км от вас</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Availability */}
                    <div className="flex items-center gap-2 mb-3">
                      <Clock
                        className={`w-4 h-4 ${
                          rec.availability === "now" ? "text-green-500" : "text-orange-500"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        {rec.availability === "now" ? "Доступен сейчас" : "Доступен сегодня"}
                      </span>
                    </div>

                    {/* Rating */}
                    {rec.doctor.rating && (
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold text-gray-900">
                          {rec.doctor.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({rec.doctor.reviews_count || 0})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <p className="text-xl font-bold text-gray-900">
                        {rec.estimatedPrice?.toLocaleString()}₸
                      </p>
                      <p className="text-xs text-gray-500">Примерная стоимость</p>
                    </div>

                    {/* Reasons */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Почему рекомендуем:
                      </p>
                      <div className="space-y-1">
                        {rec.reasons.slice(0, 3).map((reason, ridx) => (
                          <div key={ridx} className="flex items-start gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRecommendation(rec)}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                        rec.type === "best"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25"
                          : rec.type === "premium"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/25"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-500/25"
                      }`}
                    >
                      <span>Записаться</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Back Button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <button
                onClick={() => setStep("input")}
                className="text-gray-600 hover:text-purple-600 font-medium transition-colors text-sm"
              >
                ← Изменить симптомы
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartConsultationFlow;
