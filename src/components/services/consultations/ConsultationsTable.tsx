"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  Clock,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Stethoscope,
  Video,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Phone,
  Filter,
  Search,
  X,
  RefreshCw
} from "lucide-react";
import { useConsultationManager } from "./useConsultationManager";
import type { Consultation as APIConsultation } from "@/types/consultation";
import { useAuth } from "@/context/AuthContext";

// Extended interface for display purposes
interface ExtendedConsultation extends APIConsultation {
  date?: string;
  time?: string;
  doctor?: {
    name: string;
    specialty: string;
    avatar?: string;
  };
  symptoms?: string;
  type?: "video" | "chat" | "phone";
  diagnosis?: string;
  prescription?: boolean;
}

interface ConsultationsTableProps {
  consultations?: ExtendedConsultation[];
  showFilters?: boolean;
}

type FilterStatus = "all" | "pending" | "ongoing" | "completed" | "cancelled" | "missed";
type FilterType = "all" | "video" | "chat" | "phone";

const ConsultationsTable: React.FC<ConsultationsTableProps> = ({ 
  consultations = [],
  showFilters = true 
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Use real API data if no consultations provided
  const { consultations: apiConsultations, fetchConsultations } = useConsultationManager();
  
  // Mock data for demonstration when no API data
  const mockConsultations: ExtendedConsultation[] = [
    {
      id: 1,
      meeting_id: "mock-1",
      patient_name: "Иван Иванов",
      patient_email: "ivan@example.com",
      status: "completed",
      date: "2024-01-15",
      time: "14:30",
      doctor: {
        name: "Д-р Алиев К.С.",
        specialty: "Терапевт"
      },
      symptoms: "Головная боль, повышенная температура",
      type: "video",
      diagnosis: "ОРВИ",
      prescription: true
    },
    {
      id: 2,
      meeting_id: "mock-2", 
      patient_name: "Мария Петрова",
      patient_email: "maria@example.com",
      status: "completed",
      date: "2024-01-10",
      time: "10:15",
      doctor: {
        name: "Д-р Нурланова А.М.",
        specialty: "Кардиолог"
      },
      symptoms: "Боль в груди, одышка",
      type: "chat",
      diagnosis: "Рекомендована ЭКГ"
    },
    {
      id: 3,
      meeting_id: "mock-3",
      patient_name: "Алексей Сидоров", 
      patient_email: "alex@example.com",
      status: "pending",
      date: "2024-01-08",
      time: "16:45",
      doctor: {
        name: "Д-р Смирнов Д.В.",
        specialty: "Невролог"
      },
      symptoms: "Мигрень, головокружение",
      type: "video"
    }
  ];

  // Transform API data to match expected format
  const transformApiConsultations = (consultations: APIConsultation[]): ExtendedConsultation[] => {
    return consultations.map(consultation => ({
      ...consultation,
      // Map API fields to expected format for display
      doctor: {
        name: `${consultation.doctor_first_name} ${consultation.doctor_last_name}`,
        specialty: "Врач общей практики" // Default since API doesn't provide specialty
      },
      date: consultation.created_at ? consultation.created_at.split('T')[0] : undefined,
      time: consultation.started_at ? new Date(consultation.started_at).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : undefined,
      type: "video" as const // Default type since API doesn't specify
    }));
  };

  // Use provided consultations, transformed API data, or mock data
  const baseConsultations = consultations.length > 0 
    ? consultations 
    : (apiConsultations.length > 0 
        ? transformApiConsultations(apiConsultations) 
        : mockConsultations);

  // Apply filters
  const filteredConsultations = useMemo(() => {
    let filtered = baseConsultations;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(consultation => {
        const extendedConsultation = consultation as ExtendedConsultation;
        return extendedConsultation.patient_name?.toLowerCase().includes(term) ||
               extendedConsultation.doctor?.name?.toLowerCase().includes(term) ||
               extendedConsultation.doctor?.specialty?.toLowerCase().includes(term) ||
               extendedConsultation.symptoms?.toLowerCase().includes(term) ||
               extendedConsultation.diagnosis?.toLowerCase().includes(term) ||
               extendedConsultation.meeting_id?.toLowerCase().includes(term);
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(consultation => consultation.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(consultation => {
        const extendedConsultation = consultation as ExtendedConsultation;
        return extendedConsultation.type === typeFilter;
      });
    }

    return filtered;
  }, [baseConsultations, searchTerm, statusFilter, typeFilter]);

  const visibleConsultations = isExpanded ? filteredConsultations : filteredConsultations.slice(0, 3);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "ongoing":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "missed":
        return <XCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending": 
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ongoing":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "missed":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-purple-600" />;
      case "chat":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "phone":
        return <Phone className="w-4 h-4 text-green-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Завершена";
      case "pending":
        return "Ожидает";
      case "ongoing":
        return "В процессе";
      case "cancelled":
        return "Отменена";
      case "missed":
        return "Пропущена";
      default:
        return "Неизвестно";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "video":
        return "Видео";
      case "chat":
        return "Чат";
      case "phone":
        return "Телефон";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (filteredConsultations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mt-8 p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 border-2 border-gray-200/50 rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `,
        }}
      >
        {/* Floating decorations */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full blur-2xl" />
        
        <div className="relative text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg"
          >
            <Stethoscope className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {baseConsultations.length === 0 ? "История консультаций пуста" : "Нет результатов"}
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            {baseConsultations.length === 0 
              ? "Ваши консультации будут отображаться здесь после их проведения"
              : "Попробуйте изменить критерии фильтрации"
            }
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative mt-8 space-y-6 px-4 md:px-6"
    >
      {/* Floating background decorations */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-200/15 to-purple-200/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-tr from-indigo-200/15 to-blue-200/15 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between">
        <motion.h3 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-800 flex items-center gap-3"
        >
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          История консультаций
        </motion.h3>
        <div className="flex items-center gap-3">
          {showFilters && (
            <motion.button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200 border ${
                showFilterPanel 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white/70 text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </motion.button>
          )}
          
          <motion.button
            onClick={() => fetchConsultations()}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm bg-white/70 text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          
          <motion.span 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-semibold text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full border border-gray-300/50 shadow-sm"
          >
            {filteredConsultations.length} из {baseConsultations.length}
          </motion.span>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilterPanel && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative bg-white/95 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-lg overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Фильтры</h4>
                <motion.button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  Сбросить
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Поиск</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Имя пациента, врач, симптомы..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Статус</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">Все статусы</option>
                    <option value="pending">Ожидает</option>
                    <option value="ongoing">В процессе</option>
                    <option value="completed">Завершена</option>
                    <option value="cancelled">Отменена</option>
                    <option value="missed">Пропущена</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Тип</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">Все типы</option>
                    <option value="video">Видео</option>
                    <option value="chat">Чат</option>
                    <option value="phone">Телефон</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Дата/Время</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Врач/Пациент</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Детали</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Тип</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Статус</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Действия</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {visibleConsultations.map((consultation, index) => {
                  const extendedConsultation = consultation as ExtendedConsultation;
                  return (
                  <motion.tr
                    key={consultation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-200"
                  >
                    {/* Date/Time */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.created_at ? formatDate(consultation.created_at) : "Не указано"}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {consultation.started_at 
                            ? new Date(consultation.started_at).toLocaleTimeString('ru-RU', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : "Не начата"
                          }
                        </div>
                      </div>
                    </td>

                    {/* Doctor/Patient */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.role === 'doctor' 
                            ? consultation.patient_name || "Пациент не указан"
                            : `${consultation.doctor_first_name} ${consultation.doctor_last_name}` || "Врач не назначен"
                          }
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {user?.role === 'doctor'
                            ? consultation.patient_email || "Email не указан"
                            : "Врач общей практики"
                          }
                        </div>
                      </div>
                    </td>

                    {/* Symptoms/Meeting ID */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 max-w-xs">
                          ID встречи: {consultation.meeting_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          Статус: {getStatusText(consultation.status)}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                          {getTypeIcon("video")}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {getTypeText("video")}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(consultation.status)}`}>
                          {getStatusIcon(consultation.status)}
                          {getStatusText(consultation.status)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200/50 hover:border-blue-300"
                          title="Просмотреть детали"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200/50 hover:border-gray-300"
                          title="Еще действия"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Show More Button */}
        {filteredConsultations.length > 3 && (
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm text-blue-700 hover:text-blue-800 font-semibold transition-all duration-200 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl shadow-sm hover:shadow-md"
            >
              {isExpanded ? (
                <>
                  Показать меньше
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Показать все ({filteredConsultations.length - 3} ещё)
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ConsultationsTable;