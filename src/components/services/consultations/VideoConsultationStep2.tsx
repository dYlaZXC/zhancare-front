import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Users
} from "lucide-react";
import clsx from "clsx";

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
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByType, setFilterByType] = useState<string>("all");

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.doctor_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterByType === "all" || doctor.doctor_type === filterByType;
      return matchesSearch && matchesType;
    });
  }, [doctors, searchTerm, filterByType]);

  const doctorTypes = useMemo(() => {
    const types = [...new Set(doctors.map(doc => doc.doctor_type))];
    return types;
  }, [doctors]);

  const showAIBlock = recommendedDoctor || aiErrorData;

  const getUrgencyIndicator = (urgency: string) => {
    const urgencyConfig = {
      urgent: {
        color: "bg-red-500",
        icon: AlertCircle,
        text: "Срочно",
        description: "Рекомендуется немедленная консультация"
      },
      non_urgent: {
        color: "bg-green-500",
        icon: CheckCircle2,
        text: "Не срочно",
        description: "Плановая консультация"
      },
      moderate: {
        color: "bg-yellow-500",
        icon: Clock,
        text: "Умеренно",
        description: "Желательна консультация в ближайшее время"
      }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.non_urgent;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${config.color} text-white px-3 py-1.5 rounded-full text-xs font-medium`}>
          <Icon size={12} />
          {config.text}
        </div>
        <span className="text-xs text-gray-500">{config.description}</span>
      </div>
    );
  };

  const DoctorCard = ({ doctor, isRecommended = false, isSelected = false }: { 
    doctor: Doctor; 
    isRecommended?: boolean; 
    isSelected?: boolean; 
  }) => (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(doctor.id)}
      className={clsx(
        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
        isSelected 
          ? "border-blue-500 bg-blue-50 shadow-lg" 
          : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50",
        isRecommended && "ring-2 ring-blue-400 ring-opacity-50"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Bot size={12} />
          AI рекомендует
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
          {doctor.avatar || doctor.name.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{doctor.name}</h3>
          <p className="text-sm text-blue-600 font-medium">{doctor.doctor_type}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {doctor.rating && (
              <div className="flex items-center gap-1">
                <Star className="fill-yellow-400 text-yellow-400" size={12} />
                <span>{doctor.rating}</span>
              </div>
            )}
            {doctor.experience && (
              <div className="flex items-center gap-1">
                <Award size={12} />
                <span>{doctor.experience} лет</span>
              </div>
            )}
            {doctor.availability && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span className="text-green-600">{doctor.availability}</span>
              </div>
            )}
          </div>

          {doctor.specialties && (
            <div className="flex flex-wrap gap-1 mt-2">
              {doctor.specialties.slice(0, 2).map((specialty, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {specialty}
                </span>
              ))}
            </div>
          )}
        </div>

        {isSelected && (
          <CheckCircle2 className="text-blue-500 flex-shrink-0" size={20} />
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className="space-y-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Clock size={14} />
          Шаг 2 из 3
        </div>
        <div className="text-xs text-gray-500">
          {filteredDoctors.length} из {doctors.length} врачей
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <User size={24} />
          </div>
          Выбор врача
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Искусственный интеллект проанализировал ваши симптомы и подобрал подходящего специалиста
        </p>
      </motion.div>

      {/* AI Recommendation Block */}
      <AnimatePresence>
        {showAIBlock && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={clsx(
              "p-5 rounded-xl border-2",
              fallbackUsed
                ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                : recommendedDoctor
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={clsx(
                "p-2 rounded-lg",
                fallbackUsed ? "bg-yellow-500" : recommendedDoctor ? "bg-blue-500" : "bg-red-500"
              )}>
                <Bot className="text-white" size={20} />
              </div>
              
              <div className="flex-1 space-y-3">
                <h3 className={clsx(
                  "font-bold text-lg flex items-center gap-2",
                  fallbackUsed ? "text-yellow-800" : recommendedDoctor ? "text-blue-800" : "text-red-800"
                )}>
                  Рекомендация ИИ
                  {recommendedDoctor?.confidence && (
                    <span className="text-sm font-normal bg-white px-2 py-1 rounded-full">
                      {recommendedDoctor.confidence}% уверенности
                    </span>
                  )}
                </h3>

                {aiErrorData && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Info size={16} />
                      ИИ рекомендует специалиста:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Специализация:</span>
                        <div className="mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg inline-block">
                          {aiErrorData.specialty}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Обоснование:</span>
                        <p className="mt-1 text-gray-600 italic">{aiErrorData.reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {recommendedDoctor && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-900">
                          {fallbackUsed ? "Назначен врач: " : "Рекомендуется: "}
                          <span className="font-semibold">{recommendedDoctor.name}</span>
                        </p>
                        <p className="text-sm text-blue-600 font-medium mt-1">
                          {recommendedDoctor.doctor_type}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 italic border-l-3 border-blue-200 pl-3">
                      {recommendedDoctor.reason}
                    </p>

                    {recommendedDoctor.urgency && (
                      <div className="pt-2">
                        {getUrgencyIndicator(recommendedDoctor.urgency)}
                      </div>
                    )}

                    {fallbackUsed && aiErrorData && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-2">
                          <Shield className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-900">
                              Специалист по направлению &quot;{aiErrorData.specialty}&quot; временно недоступен
                            </p>
                            <p className="text-yellow-800 mt-1">
                              Мы подобрали врача общей практики для быстрого решения вашего вопроса
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по имени или специальности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
          >
            <option value="all">Все специальности</option>
            {doctorTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Doctor List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Загружаем список врачей...</p>
            </div>
          </motion.div>
        ) : filteredDoctors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-gray-50 rounded-xl"
          >
            <Users className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">
              {doctors.length === 0 
                ? "В данный момент нет доступных врачей" 
                : "Не найдено врачей по вашему запросу"
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3"
          >
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DoctorCard
                  doctor={doctor}
                  isRecommended={recommendedDoctor?.id === doctor.id}
                  isSelected={selectedDoctorId === doctor.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Doctor Confirmation */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={20} />
              <div>
                <p className="font-medium text-green-900">
                  Выбран врач: {selectedDoctor.name}
                </p>
                <p className="text-sm text-green-700">{selectedDoctor.doctor_type}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
        >
          <ArrowLeft size={16} />
          Назад
        </motion.button>

        <div className="relative">
          <motion.button
            onClick={onNext}
            disabled={!selectedDoctorId}
            whileTap={selectedDoctorId ? { scale: 0.97 } : {}}
            whileHover={selectedDoctorId ? { scale: 1.02 } : {}}
            onMouseEnter={() => setShowTooltip(!selectedDoctorId)}
            onMouseLeave={() => setShowTooltip(false)}
            transition={{ type: "spring", stiffness: 300 }}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all min-w-[140px] justify-center",
              selectedDoctorId
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            Продолжить
            <ArrowRight size={16} />
          </motion.button>

          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10"
              >
                Выберите врача для продолжения
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoConsultationStep2;