"use client";

import React, { useState } from "react";
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
  Phone
} from "lucide-react";

interface Consultation {
  id: string;
  date: string;
  time: string;
  doctor: {
    name: string;
    specialty: string;
    avatar?: string;
  };
  symptoms: string;
  type: "video" | "chat" | "phone";
  status: "completed" | "scheduled" | "cancelled" | "in-progress";
  diagnosis?: string;
  prescription?: boolean;
}

interface ConsultationsTableProps {
  consultations?: Consultation[];
}

const ConsultationsTable: React.FC<ConsultationsTableProps> = ({ 
  consultations = [] 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Mock data for demonstration
  const mockConsultations: Consultation[] = [
    {
      id: "1",
      date: "2024-01-15",
      time: "14:30",
      doctor: {
        name: "Д-р Алиев К.С.",
        specialty: "Терапевт"
      },
      symptoms: "Головная боль, повышенная температура",
      type: "video",
      status: "completed",
      diagnosis: "ОРВИ",
      prescription: true
    },
    {
      id: "2", 
      date: "2024-01-10",
      time: "10:15",
      doctor: {
        name: "Д-р Нурланова А.М.",
        specialty: "Кардиолог"
      },
      symptoms: "Боль в груди, одышка",
      type: "chat",
      status: "completed",
      diagnosis: "Рекомендована ЭКГ"
    },
    {
      id: "3",
      date: "2024-01-08",
      time: "16:45",
      doctor: {
        name: "Д-р Смирнов Д.В.",
        specialty: "Невролог"
      },
      symptoms: "Мигрень, головокружение",
      type: "video",
      status: "scheduled"
    }
  ];

  const displayConsultations = consultations.length > 0 ? consultations : mockConsultations;
  const visibleConsultations = isExpanded ? displayConsultations : displayConsultations.slice(0, 3);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "scheduled": 
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "in-progress":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
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
      case "scheduled":
        return "Запланирована";
      case "cancelled":
        return "Отменена";
      case "in-progress":
        return "В процессе";
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

  if (displayConsultations.length === 0) {
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
          <h3 className="text-xl font-bold text-gray-800 mb-2">История консультаций пуста</h3>
          <p className="text-gray-600 max-w-sm mx-auto">Ваши консультации будут отображаться здесь после их проведения</p>
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
        <motion.span 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm font-semibold text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full border border-gray-300/50 shadow-sm"
        >
          {displayConsultations.length} консультаций
        </motion.span>
      </div>

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
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Врач</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Симптомы</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Тип</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Статус</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Действия</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {visibleConsultations.map((consultation, index) => (
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
                          {formatDate(consultation.date)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {consultation.time}
                        </div>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.doctor.name}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {consultation.doctor.specialty}
                        </div>
                      </div>
                    </td>

                    {/* Symptoms */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 max-w-xs">
                          {consultation.symptoms.length > 50 
                            ? `${consultation.symptoms.slice(0, 50)}...` 
                            : consultation.symptoms
                          }
                        </div>
                        {consultation.diagnosis && (
                          <div className="text-xs text-blue-600 font-medium">
                            Диагноз: {consultation.diagnosis}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                          {getTypeIcon(consultation.type)}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {getTypeText(consultation.type)}
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
                        {consultation.prescription && (
                          <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Рецепт выдан
                          </div>
                        )}
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
                        {consultation.prescription && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 border border-green-200/50 hover:border-green-300"
                            title="Скачать рецепт"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                        )}
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
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Show More Button */}
        {displayConsultations.length > 3 && (
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
                  Показать все ({displayConsultations.length - 3} ещё)
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