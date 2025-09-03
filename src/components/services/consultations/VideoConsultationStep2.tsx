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
      const doctorName = doctor.name || '';
      const doctorType = doctor.doctor_type || '';
      
      const matchesSearch = doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctorType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterByType === "all" || doctorType === filterByType;
      return matchesSearch && matchesType;
    });
  }, [doctors, searchTerm, filterByType]);

  const doctorTypes = useMemo(() => {
    const types = [...new Set(doctors.map(doc => doc.doctor_type))];
    return types;
  }, [doctors]);

  const showAIBlock = recommendedDoctor || aiErrorData;

  // Format AI reasoning text with proper paragraphs and structure
  const formatAIReasoning = (text: string) => {
    if (!text) return [];
    
    // First, handle obvious paragraph breaks and topic changes
    let formattedText = text
      // Add breaks before topic change keywords
      .replace(/(Например|Также|Кроме того|В качестве|Если симптомы|Однако|Поэтому|При этом)/g, '\n\n$1')
      // Add breaks before medical recommendations
      .replace(/(рекомендуется|следует|необходимо|важно|срочно)/gi, '\n\n$1')
      // Add breaks before warning statements
      .replace(/(немедленно обратитесь|обратитесь к врачу|вызовите скорую)/gi, '\n\n⚠️ $1');
    
    // Split into paragraphs and clean up
    const paragraphs = formattedText
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(paragraph => {
        // Add bullet points to recommendations
        if (/^(можете попробовать|рекомендуется|следует)/i.test(paragraph)) {
          // Split recommendations by comma and create bullet points
          const recommendations = paragraph.split(/,\s+(?=\w)/);
          if (recommendations.length > 1) {
            return {
              type: 'list',
              items: recommendations.map(item => item.trim())
            };
          }
        }
        
        // Mark warning paragraphs
        if (paragraph.includes('⚠️') || /немедленно|срочно|опасно/i.test(paragraph)) {
          return {
            type: 'warning',
            content: paragraph.replace('⚠️', '').trim()
          };
        }
        
        return {
          type: 'text',
          content: paragraph
        };
      });
    
    return paragraphs;
  };

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
    <div
      onClick={() => onSelect(doctor.id)}
      className={clsx(
        "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 bg-white hover:shadow-lg w-full max-w-full",
        isSelected 
          ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200" 
          : "border-gray-200 hover:border-gray-300",
        isRecommended && !isSelected && "ring-2 ring-blue-400 ring-opacity-30"
      )}
      style={{ marginTop: isRecommended ? '12px' : '0', marginRight: isRecommended ? '24px' : '0' }}
    >
      {isRecommended && (
        <div className="absolute -top-3 -right-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl z-20 border-2 border-white">
          <Bot size={12} />
          AI рекомендует
        </div>
      )}

      <div className="flex items-start gap-4 w-full min-w-0">
        {/* Doctor Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {doctor.avatar || doctor.name.charAt(0)}
          </div>
          {isSelected && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="text-white" size={16} />
            </div>
          )}
        </div>
        
        {/* Doctor Info */}
        <div className="flex-1 min-w-0 space-y-3 overflow-hidden">
          <div className="w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{doctor.name}</h3>
            <p className="text-blue-600 font-semibold">{doctor.doctor_type}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            {doctor.rating && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(doctor.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="font-medium">{doctor.rating}</span>
              </div>
            )}
            {doctor.experience && (
              <div className="flex items-center gap-1.5">
                <Award className="text-gray-400" size={16} />
                <span>{doctor.experience} лет опыта</span>
              </div>
            )}
          </div>

          {doctor.availability && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">{doctor.availability}</span>
            </div>
          )}

          {doctor.specialties && (
            <div className="flex flex-wrap gap-2 overflow-hidden">
              {doctor.specialties.slice(0, 3).map((specialty, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col w-full">
      <motion.div
        className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Clock size={14} />
            Шаг 2 из 3
          </div>
          <div className="text-sm text-gray-500">
            {filteredDoctors.length} из {doctors.length} врачей
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 w-full"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <User size={20} />
            </div>
            Выбор врача
          </h2>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
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
                "p-6 rounded-2xl border-2 w-full",
                fallbackUsed
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                  : recommendedDoctor
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                  : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "p-3 rounded-xl",
                  fallbackUsed ? "bg-yellow-500" : recommendedDoctor ? "bg-blue-500" : "bg-red-500"
                )}>
                  <Bot className="text-white" size={20} />
                </div>
                
                <div className="flex-1 space-y-4 min-w-0">
                  {/* Enhanced Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className={clsx(
                        "font-bold text-xl mb-2",
                        fallbackUsed ? "text-yellow-800" : recommendedDoctor ? "text-blue-800" : "text-red-800"
                      )}>
                        Рекомендация ИИ
                      </h3>
                      <p className={clsx(
                        "text-sm font-medium",
                        fallbackUsed ? "text-yellow-600" : recommendedDoctor ? "text-blue-600" : "text-red-600"
                      )}>
                        {fallbackUsed 
                          ? "Автоматически назначен доступный специалист" 
                          : recommendedDoctor 
                          ? "На основе анализа ваших симптомов" 
                          : "Подходящий специалист не найден"
                        }
                      </p>
                    </div>
                    {recommendedDoctor?.confidence && (
                      <div className="text-center flex-shrink-0">
                        <div className={clsx(
                          "inline-flex items-center px-3 py-2 rounded-xl text-white font-bold text-lg",
                          recommendedDoctor.confidence >= 80 ? "bg-green-500" :
                          recommendedDoctor.confidence >= 60 ? "bg-yellow-500" : "bg-orange-500"
                        )}>
                          {recommendedDoctor.confidence}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          уверенности
                        </p>
                      </div>
                    )}
                  </div>

                  {recommendedDoctor && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Doctor Info Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            {recommendedDoctor.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">
                              {fallbackUsed ? "📋 Назначен врач" : "✨ Рекомендуется"}
                            </p>
                            <h4 className="text-xl font-bold text-gray-900">{recommendedDoctor.name}</h4>
                            <p className="text-blue-600 font-semibold">{recommendedDoctor.doctor_type}</p>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation Details */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            💭 Обоснование
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                            <div className="space-y-4">
                              {formatAIReasoning(recommendedDoctor.reason).map((block, index) => {
                                if (block.type === 'list' && block.items) {
                                  return (
                                    <div key={index} className="space-y-2">
                                      <p className="text-gray-700 text-sm font-medium">
                                        {block.items[0]}
                                      </p>
                                      {block.items.length > 1 && (
                                        <ul className="ml-4 space-y-1">
                                          {block.items.slice(1).map((item, itemIndex) => (
                                            <li key={itemIndex} className="text-gray-600 text-sm flex items-start gap-2">
                                              <span className="text-blue-500 mt-1.5">•</span>
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                }
                                
                                if (block.type === 'warning' && block.content) {
                                  return (
                                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                      <p className="text-red-800 text-sm font-medium flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">⚠️</span>
                                        {block.content}
                                      </p>
                                    </div>
                                  );
                                }
                                
                                if (block.content) {
                                  return (
                                    <p key={index} className="text-gray-700 leading-relaxed text-sm">
                                      {block.content}
                                    </p>
                                  );
                                }
                                
                                return null;
                              })}
                            </div>
                          </div>
                        </div>

                        {recommendedDoctor.urgency && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              ⚡ Срочность обращения
                            </h5>
                            {getUrgencyIndicator(recommendedDoctor.urgency)}
                          </div>
                        )}
                      </div>
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
          className="flex flex-col sm:flex-row gap-4 w-full"
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по имени или специальности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm md:text-base"
            />
          </div>
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-sm md:text-base w-full sm:w-auto"
          >
            <option value="all">Все специальности</option>
            {doctorTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </motion.div>

        {/* Doctor List - Takes remaining space */}
        <div className="flex-1 overflow-hidden w-full">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-full w-full"
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
                className="flex items-center justify-center h-full w-full"
              >
                <div className="text-center py-16 bg-gray-50 rounded-2xl px-8 w-full">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 text-lg">
                    {doctors.length === 0 
                      ? "В данный момент нет доступных врачей" 
                      : "Не найдено врачей по вашему запросу"
                    }
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full overflow-y-auto overflow-x-visible space-y-4 w-full pr-6"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                {filteredDoctors.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full"
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
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 pt-6 border-t border-gray-100 mt-auto w-full">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
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
                "flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all min-w-[160px] justify-center",
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
    </div>
  );
};

export default VideoConsultationStep2;