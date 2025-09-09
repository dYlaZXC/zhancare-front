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
  const [isRecommendationExpanded, setIsRecommendationExpanded] = useState(true);

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
    const types = [...new Set(doctors.map(doc => doc.doctor_type).filter(type => type))];
    return types;
  }, [doctors]);

  const showAIBlock = recommendedDoctor || aiErrorData;

  // Format AI reasoning text with proper paragraphs and structure for mobile
  const formatAIReasoning = (text: string): Array<{type: 'warning' | 'recommendation' | 'text', content: string}> => {
    if (!text) return [];
    
    // Split into sentences and group related content
    const sentences = text.split(/\.(?=\s+[А-Я])/);
    const paragraphs: Array<{type: 'warning' | 'recommendation' | 'text', content: string}> = [];
    let currentParagraph = "";
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;
      
      // Add sentence to current paragraph
      currentParagraph += (currentParagraph ? '. ' : '') + trimmed;
      
      // Check if we should start a new paragraph
      const shouldBreak = (
        // After recommendations/treatment suggestions
        /рекомендуется|следует|необходимо|важно|можете|попробуйте/i.test(trimmed) ||
        // After symptom analysis
        /указывает|свидетельствует|характерно|типично|проявляется/i.test(trimmed) ||
        // After 2 sentences in current paragraph
        currentParagraph.split('.').length >= 3 ||
        // Before warnings
        /немедленно|срочно|опасно|внимание/i.test(sentences[index + 1] || "")
      );
      
      if (shouldBreak || index === sentences.length - 1) {
        if (currentParagraph.trim()) {
          // Categorize paragraph type
          if (/немедленно|срочно|опасно|внимание|вызовите скорую/i.test(currentParagraph)) {
            paragraphs.push({
              type: 'warning',
              content: currentParagraph.trim() + '.'
            });
          } else if (/рекомендуется|следует|можете попробовать|советуем/i.test(currentParagraph)) {
            paragraphs.push({
              type: 'recommendation',
              content: currentParagraph.trim() + '.'
            });
          } else {
            paragraphs.push({
              type: 'text',
              content: currentParagraph.trim() + '.'
            });
          }
        }
        currentParagraph = "";
      }
    });
    
    return paragraphs;
  };

  const getUrgencyIndicator = (urgency: string) => {
    const urgencyConfig = {
      urgent: {
        color: "bg-red-500",
        icon: AlertCircle,
        text: "Срочно",
        description: "Немедленная консультация"
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
        description: "В ближайшее время"
      }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.non_urgent;
    const Icon = config.icon;

    return (
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 ${config.color} text-white px-2.5 py-1 rounded-full text-xs font-medium`}>
          <Icon size={10} />
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
        "group relative p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 rounded-lg sm:rounded-xl md:rounded-xl lg:rounded-2xl border cursor-pointer transition-all duration-300 bg-white hover:shadow-lg w-full max-w-full",
        isSelected 
          ? "border-blue-500 bg-blue-50 shadow-md ring-1 sm:ring-2 ring-blue-200" 
          : "border-gray-200 hover:border-blue-300",
        isRecommended && !isSelected && "ring-1 sm:ring-2 ring-blue-400/30"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg z-10 border-2 border-white">
          <Bot size={10} />
          <span>AI рекомендует</span>
        </div>
      )}


      <div className="flex flex-col md:flex-row items-start md:items-stretch gap-3 md:gap-4 lg:gap-5 min-h-full">
        {/* Doctor Avatar */}
        <div className="relative flex-shrink-0 md:self-start">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-xl lg:text-2xl shadow-lg overflow-hidden">
            {doctor.avatar ? (
              <Image src={doctor.avatar} alt={doctor.name} fill className="object-cover" />
            ) : (
              <div className="relative z-10">{doctor.name.charAt(0)}</div>
            )}
          </div>
          
          {/* Online Status */}
          <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
          </div>
          
          {isSelected && (
            <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10">
              <CheckCircle2 className="text-white" size={10} />
            </div>
          )}
          
          {/* Verified Badge */}
          <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10">
            <Shield className="text-white" size={6} />
          </div>
        </div>
        
        {/* Doctor Info */}
        <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
          <div>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight mb-1">
                  {doctor.name || 'Имя не указано'}
                </h3>
                <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                  <Stethoscope className="text-blue-600 flex-shrink-0" size={12} />
                  <p className="text-blue-600 font-bold text-xs sm:text-sm md:text-sm lg:text-base">{doctor.doctor_type || 'Специальность не указана'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 px-2 py-1 rounded-full self-start">
                <TrendingUp className="text-green-600" size={10} />
                <span className="text-green-700 font-bold text-xs">ТОП</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <GraduationCap className="text-indigo-500" size={10} />
                <span className="font-medium">К.м.н</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="text-purple-500" size={10} />
                <span className="font-medium">{doctor.experience || 5} лет</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="text-amber-500" size={10} />
                <span className="font-medium">Сертифицирован</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs">
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Взрослые</div>
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">Ассоциация</div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Премиум</div>
            </div>
          </div>

          {/* Languages & Communication */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold">
              <MessageSquare size={10} />
              Русский язык
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
              <Video size={10} />
              Видео
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
              <Phone size={10} />
              Аудио
            </div>
          </div>

          {/* Enhanced Rating Section */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-bold text-gray-900 text-base md:text-lg">{doctor.rating || "4.9"}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">из 1247 отзывов</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-bold">98% рекомендуют</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                <span className="font-bold">1.2k лайков</span>
              </div>
            </div>
          </div>

          {/* Premium Pricing Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 md:p-3 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">₸</span>
              </div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">ПРЕМИУМ КОНСУЛЬТАЦИЯ</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Первичная</div>
                  <div className="font-bold text-green-600 text-sm">1500,00 ₸</div>
                  <div className="text-xs text-gray-400 line-through">2000,00 ₸</div>
                </div>
              </div>
              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Повторная</div>
                  <div className="font-bold text-green-600 text-sm">1200,00 ₸</div>
                  <div className="text-xs text-gray-400 line-through">1800,00 ₸</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                🔥 СКИДКА 25%
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Schedule Section */}
        <div className="w-full md:w-auto md:flex-shrink-0 md:flex md:flex-col md:justify-between md:min-h-full">
          {/* Premium Schedule Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-indigo-200 shadow-md md:h-full md:flex md:flex-col">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="text-white" size={10} />
              </div>
              <span className="text-xs md:text-sm font-bold text-indigo-800">Расписание</span>
            </div>
            
            {/* Mini Calendar */}
            <div className="flex-1 flex flex-col justify-center space-y-3">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Пт', 'Сб', 'Вс', 'Пн', 'Вт', 'Ср', 'Чт'].map((day) => (
                  <div key={day} className="text-xs text-gray-500 font-semibold">
                    {day}
                  </div>
                ))}
                {[22, 23, 24, 25, 26, 27, 28].map((date, i) => (
                  <div 
                    key={date} 
                    className={clsx(
                      "w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs rounded-lg font-medium transition-all",
                      i === 3 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg ring-2 ring-blue-200" 
                        : i === 1 || i === 5 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    {date}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Available Slots */}
            <div className="md:flex-1 md:flex md:flex-col md:justify-center space-y-2 md:space-y-3">
              <p className="text-xs font-bold text-indigo-700 uppercase text-center">Ближайшие слоты</p>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-center shadow-lg">
                  <div className="font-bold text-sm md:text-base">18:00</div>
                  <div className="text-xs md:text-sm opacity-90">Сегодня</div>
                </div>
                <div className="bg-white border border-indigo-200 text-indigo-600 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-center hover:bg-indigo-50 transition-colors">
                  <div className="font-bold text-sm md:text-base">09:30</div>
                  <div className="text-xs md:text-sm">Завтра</div>
                </div>
              </div>
            </div>
            
            {/* Location Info */}
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <div className="flex items-center gap-2 text-xs text-indigo-600">
                <MapPin size={10} />
                <span className="font-medium">Онлайн консультация</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <div className="text-sm text-gray-500">
            {filteredDoctors.length} врачей
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

        {/* Full AI Recommendation Block */}
        <AnimatePresence>
          {showAIBlock && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={clsx(
                "rounded-xl border-2 overflow-hidden",
                fallbackUsed
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                  : recommendedDoctor
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                  : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              )}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-lg flex-shrink-0",
                    fallbackUsed ? "bg-yellow-500" : recommendedDoctor ? "bg-blue-500" : "bg-red-500"
                  )}>
                    <Bot className="text-white" size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className={clsx(
                      "font-bold text-base",
                      fallbackUsed ? "text-yellow-800" : recommendedDoctor ? "text-blue-800" : "text-red-800"
                    )}>
                      Рекомендация ИИ
                    </h4>
                    <p className={clsx(
                      "text-xs",
                      fallbackUsed ? "text-yellow-600" : recommendedDoctor ? "text-blue-600" : "text-red-600"
                    )}>
                      {fallbackUsed ? "Назначен доступный врач" : "На основе ваших симптомов"}
                    </p>
                  </div>
                </div>
              </div>

              {recommendedDoctor && (
                <div className="px-4 pb-4">
                  {/* Doctor info - always visible */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {recommendedDoctor.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 mb-0.5">
                          {fallbackUsed ? "📋 Назначен" : "✨ Рекомендуется"}
                        </p>
                        <h5 className="font-bold text-gray-900 text-sm leading-tight">{recommendedDoctor.name}</h5>
                        <p className="text-blue-600 font-semibold text-xs">{recommendedDoctor.doctor_type}</p>
                      </div>
                      {recommendedDoctor.confidence && (
                        <div className="text-center flex-shrink-0">
                          <div className={clsx(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs",
                            recommendedDoctor.confidence >= 80 ? "bg-green-500" :
                            recommendedDoctor.confidence >= 60 ? "bg-yellow-500" : "bg-orange-500"
                          )}>
                            {recommendedDoctor.confidence}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Always visible - Full recommendation details */}
                  <div className="space-y-4">
                    <div>
                      <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        💭 Медицинское обоснование
                      </h6>
                      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400 space-y-3">
                        {formatAIReasoning(recommendedDoctor.reason).map((block, index) => {
                          if (block.type === 'warning') {
                            return (
                              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 text-sm font-medium flex items-start gap-2 leading-relaxed">
                                  <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                                  <span>{block.content}</span>
                                </p>
                              </div>
                            );
                          }
                          
                          if (block.type === 'recommendation') {
                            return (
                              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-blue-800 text-sm leading-relaxed flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5 flex-shrink-0">💡</span>
                                  <span>{block.content}</span>
                                </p>
                              </div>
                            );
                          }
                          
                          return (
                            <p key={index} className="text-gray-700 text-sm leading-relaxed">
                              {block.content}
                            </p>
                          );
                        })}
                      </div>
                    </div>

                    {recommendedDoctor.urgency && (
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          ⚡ Уровень срочности
                        </h6>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          {getUrgencyIndicator(recommendedDoctor.urgency)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <input
            type="text"
            placeholder="Поиск врача..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all text-sm"
          />
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all bg-white text-sm"
          >
            <option value="all">Все специальности</option>
            {doctorTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </motion.div>

        {/* Doctor List */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-32"
              >
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 text-sm">Загружаем врачей...</p>
                </div>
              </motion.div>
            ) : filteredDoctors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-gray-50 rounded-xl"
              >
                <Users className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-gray-600 text-sm">
                  {doctors.length === 0 
                    ? "Нет доступных врачей" 
                    : "Врачи не найдены"
                  }
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 w-full max-w-full"
              >
                {filteredDoctors.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
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
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
          >
            <ArrowLeft size={16} />
            Назад
          </motion.button>

          <div className="relative">
            <motion.button
              onClick={onNext}
              disabled={!selectedDoctorId}
              whileTap={selectedDoctorId ? { scale: 0.95 } : {}}
              onTouchStart={() => setShowTooltip(!selectedDoctorId)}
              onTouchEnd={() => setShowTooltip(false)}
              onMouseEnter={() => setShowTooltip(!selectedDoctorId)}
              onMouseLeave={() => setShowTooltip(false)}
              className={clsx(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all",
                selectedDoctorId
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md"
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
                  className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10"
                >
                  Выберите врача
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
    </motion.div>
  );
};

export default VideoConsultationStep2;