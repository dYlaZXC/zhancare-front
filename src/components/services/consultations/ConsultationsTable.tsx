"use client";

import React, { useState, useMemo } from "react";
import { 
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Stethoscope,
  Video,
  MessageSquare,
  Phone,
  Filter,
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  PhoneCall,
  ChevronDown,
  Edit
} from "lucide-react";
import { useConsultationManager } from "./useConsultationManager";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/context/AuthContext";

interface ConsultationsTableProps {
  consultations?: Consultation[];
  showFilters?: boolean;
  onAccept?: (meetingId: string) => void;
  onReject?: (meetingId: string) => void;
  onStatusChange?: (meetingId: string, newStatus: string) => void;
}

type FilterStatus = "all" | "pending" | "ongoing" | "completed" | "cancelled" | "missed";
type FilterType = "all" | "video" | "chat" | "phone";

const ConsultationsTable: React.FC<ConsultationsTableProps> = ({ 
  consultations: propConsultations,
  showFilters = true,
  onAccept,
  onReject,
  onStatusChange
}) => {
  const { user } = useAuth();
  const { consultations: hookConsultations, fetchConsultations } = useConsultationManager();
  const consultations = propConsultations || hookConsultations;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Check if user is doctor
  const isDoctor = user?.role === 'doctor';

  // Apply filters
  const filteredConsultations = useMemo(() => {
    let filtered = consultations;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(consultation => {
        const doctorName = `${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim();
        const patientName = `${consultation.patient_first_name || ''} ${consultation.patient_last_name || ''}`.trim();
        
        return consultation.patient_name?.toLowerCase().includes(term) ||
               patientName.toLowerCase().includes(term) ||
               doctorName.toLowerCase().includes(term) ||
               consultation.patient_email?.toLowerCase().includes(term) ||
               consultation.meeting_id?.toLowerCase().includes(term);
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(consultation => consultation.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(consultation => {
        const consultationType = consultation.type || "video"; // Default to "video" like in display
        return consultationType === typeFilter;
      });
    }

    return filtered;
  }, [consultations, searchTerm, statusFilter, typeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleConsultations = filteredConsultations.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

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

  const availableStatuses = [
    { value: 'pending', label: 'Ожидает', color: 'text-blue-700' },
    { value: 'ongoing', label: 'В процессе', color: 'text-yellow-700' },
    { value: 'completed', label: 'Завершена', color: 'text-green-700' },
    { value: 'cancelled', label: 'Отменена', color: 'text-red-700' },
    { value: 'missed', label: 'Пропущена', color: 'text-orange-700' }
  ];

  const handleStatusChange = (meetingId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(meetingId, newStatus);
    }
    setShowStatusDropdown(null);
  };

  const renderStatusDropdown = (consultation: Consultation, isCompact = false) => {
    const isOpen = showStatusDropdown === consultation.meeting_id;
    
    const buttonClasses = isCompact 
      ? "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border-2 shadow-sm"
      : "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 shadow-sm";
    
    if (!isDoctor) {
      return (
        <span className={`${buttonClasses} ${getStatusColor(consultation.status)}`}>
          {getStatusIcon(consultation.status)}
          <span className={isCompact ? "hidden xs:inline" : ""}>{getStatusText(consultation.status)}</span>
        </span>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setShowStatusDropdown(isOpen ? null : consultation.meeting_id)}
          className={`${buttonClasses} ${getStatusColor(consultation.status)} hover:shadow-md transition-all duration-200 group`}
        >
          {getStatusIcon(consultation.status)}
          <span className={isCompact ? "hidden xs:inline" : ""}>{getStatusText(consultation.status)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowStatusDropdown(null)}
            />
            
            {/* Dropdown */}
            <div className={`absolute top-full ${isCompact ? 'right-0' : 'left-0'} mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] overflow-hidden`}>
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <Edit className="w-3 h-3" />
                  Изменить статус
                </div>
              </div>
              <div className="py-1">
                {availableStatuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(consultation.meeting_id, status.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      consultation.status === status.value 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {getStatusIcon(status.value)}
                    {status.label}
                    {consultation.status === status.value && (
                      <Check className="w-4 h-4 ml-auto text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-white" />;
      case "chat":
        return <MessageSquare className="w-4 h-4 text-white" />;
      case "phone":
        return <Phone className="w-4 h-4 text-white" />;
      default:
        return <Video className="w-4 h-4 text-white" />;
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

  const renderActionButtons = (consultation: Consultation) => {
    const isPending = consultation.status === 'pending';
    const canAccept = isPending && onAccept;
    const canReject = isPending && onReject;

    return (
      <div className="flex items-center justify-center gap-2">
        {/* Accept Call Button */}
        {canAccept && (
          <button 
            onClick={() => onAccept(consultation.meeting_id)}
            className="p-3 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 border border-green-200 hover:border-green-300 shadow-sm group-hover:shadow-md"
            title="Принять вызов"
          >
            <Check className="w-5 h-5" />
          </button>
        )}

        {/* Reject Call Button */}
        {canReject && (
          <button 
            onClick={() => onReject(consultation.meeting_id)}
            className="p-3 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 shadow-sm group-hover:shadow-md"
            title="Отклонить вызов"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Join Call Button for ongoing consultations */}
        {consultation.status === 'ongoing' && (
          <button 
            onClick={() => window.open(`/video-call?meetingId=${consultation.meeting_id}`, '_blank')}
            className="p-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm group-hover:shadow-md"
            title="Присоединиться к звонку"
          >
            <PhoneCall className="w-5 h-5" />
          </button>
        )}

        {/* View Details Button */}
        <button className="p-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm group-hover:shadow-md">
          <Eye className="w-5 h-5" />
        </button>

        {/* More Options Button */}
        <button className="p-3 text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm group-hover:shadow-md">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderCompactActionButtons = (consultation: Consultation) => {
    const isPending = consultation.status === 'pending';
    const canAccept = isPending && onAccept;
    const canReject = isPending && onReject;

    return (
      <div className="flex items-center justify-center gap-2">
        {/* Accept Call Button */}
        {canAccept && (
          <button 
            onClick={() => onAccept(consultation.meeting_id)}
            className="p-2.5 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-300 shadow-sm"
            title="Принять вызов"
          >
            <Check className="w-4 h-4" />
          </button>
        )}

        {/* Reject Call Button */}
        {canReject && (
          <button 
            onClick={() => onReject(consultation.meeting_id)}
            className="p-2.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 shadow-sm"
            title="Отклонить вызов"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Join Call Button for ongoing consultations */}
        {consultation.status === 'ongoing' && (
          <button 
            onClick={() => window.open(`/video-call?meetingId=${consultation.meeting_id}`, '_blank')}
            className="p-2.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm"
            title="Присоединиться к звонку"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        )}

        {/* View Details Button */}
        <button className="p-2.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm">
          <Eye className="w-4 h-4" />
        </button>

        {/* More Options Button */}
        <button className="p-2.5 text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderMobileActionButtons = (consultation: Consultation) => {
    const isPending = consultation.status === 'pending';
    const canAccept = isPending && onAccept;
    const canReject = isPending && onReject;

    return (
      <div className="flex items-center gap-2 mt-3">
        {/* Accept Call Button - Full width when pending */}
        {canAccept && (
          <button 
            onClick={() => onAccept(consultation.meeting_id)}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 text-green-600 bg-green-50 rounded-lg transition-colors border border-green-200"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Принять</span>
          </button>
        )}

        {/* Reject Call Button - Full width when pending */}
        {canReject && (
          <button 
            onClick={() => onReject(consultation.meeting_id)}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 text-red-600 bg-red-50 rounded-lg transition-colors border border-red-200"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Отклонить</span>
          </button>
        )}

        {/* Join Call Button for ongoing consultations */}
        {consultation.status === 'ongoing' && (
          <button 
            onClick={() => window.open(`/video-call?meetingId=${consultation.meeting_id}`, '_blank')}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 text-blue-600 bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            <PhoneCall className="w-4 h-4" />
            <span className="text-sm font-medium">Подключиться</span>
          </button>
        )}

        {/* View Details Button - Always present when no primary actions */}
        {!isPending && consultation.status !== 'ongoing' && (
          <button className="flex-1 flex items-center justify-center gap-2 p-2.5 text-blue-600 bg-blue-50 rounded-lg transition-colors border border-blue-200">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Детали</span>
          </button>
        )}

        {/* More Options Button */}
        <button className="p-2.5 text-gray-600 bg-gray-50 rounded-lg transition-colors border border-gray-200">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative mt-8 space-y-6 px-4 md:px-6">
      {/* Floating background decorations */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-200/15 to-purple-200/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-tr from-indigo-200/15 to-blue-200/15 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="relative">
        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            История консультаций
          </h3>
          <div className="flex items-center gap-3">
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200 border ${
                  showFilterPanel 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white/70 text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Фильтры
              </button>
            )}
            
            <button 
              onClick={() => fetchConsultations()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm bg-white/70 text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-semibold text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full border border-gray-300/50 shadow-sm">
              {filteredConsultations.length} из {consultations.length}
            </span>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 flex-1">
              История консультаций
            </h3>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {showFilters && (
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                    showFilterPanel 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white/70 text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden xs:inline">Фильтры</span>
                </button>
              )}
              
              <button 
                onClick={() => fetchConsultations()}
                className="p-2 bg-white/70 text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <span className="text-xs font-semibold text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-full border border-gray-300/50 shadow-sm">
              {filteredConsultations.length}/{consultations.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilterPanel && showFilters && (
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Фильтры</h4>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Сбросить
              </button>
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
        </div>
      )}

      {/* Table Container */}
      <div className="relative space-y-4">
        {/* No Results State */}
        {filteredConsultations.length === 0 && (
          <div className="relative p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 border-2 border-gray-200/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full blur-2xl" />
            
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {consultations.length === 0 ? "История консультаций пуста" : "Нет результатов"}
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {consultations.length === 0 
                  ? "Ваши консультации будут отображаться здесь после их проведения"
                  : "Попробуйте изменить критерии фильтрации"
                }
              </p>
            </div>
          </div>
        )}
        {/* Desktop Table View */}
        {filteredConsultations.length > 0 && (
          <div className="hidden xl:block bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wider">Дата/Время</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wider">Врач/Пациент</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wider">Детали</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wider">Тип</th>
                  <th className="text-left p-6 font-semibold text-gray-800 text-sm uppercase tracking-wider">Статус</th>
                  <th className="text-center p-6 font-semibold text-gray-800 text-sm uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleConsultations.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 group"
                  >
                    {/* Date/Time */}
                    <td className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
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
                        </div>
                      </div>
                    </td>

                    {/* Doctor/Patient */}
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user?.role === 'doctor' 
                              ? (consultation.patient_name || consultation.patient_first_name || "П").charAt(0).toUpperCase()
                              : (consultation.doctor_first_name || "В").charAt(0).toUpperCase()
                            }
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {user?.role === 'doctor' 
                              ? consultation.patient_name || `${consultation.patient_first_name || ''} ${consultation.patient_last_name || ''}`.trim() || "Пациент не указан"
                              : `${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || "Врач не назначен"
                            }
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {user?.role === 'doctor'
                              ? consultation.patient_email || "Email не указан"
                              : "Врач общей практики"
                            }
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="p-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-mono text-gray-700">
                            {consultation.meeting_id}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID встречи
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-blue-50 border-blue-200">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500">
                          {getTypeIcon(consultation.type || "video")}
                        </div>
                        <span className="text-sm font-semibold text-blue-700">
                          {getTypeText(consultation.type || "video")}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-6">
                      {renderStatusDropdown(consultation)}
                    </td>

                    {/* Actions */}
                    <td className="p-6">
                      {renderActionButtons(consultation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Tablet Compact Table View */}
        {filteredConsultations.length > 0 && (
          <div className="hidden md:block xl:hidden bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-800 text-sm">Пациент/Врач</th>
                  <th className="text-left p-4 font-semibold text-gray-800 text-sm">Дата</th>
                  <th className="text-left p-4 font-semibold text-gray-800 text-sm">Статус</th>
                  <th className="text-center p-4 font-semibold text-gray-800 text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleConsultations.map((consultation) => (
                  <tr
                    key={`tablet-${consultation.id}`}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user?.role === 'doctor' 
                              ? (consultation.patient_name || consultation.patient_first_name || "П").charAt(0).toUpperCase()
                              : (consultation.doctor_first_name || "В").charAt(0).toUpperCase()
                            }
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user?.role === 'doctor' 
                              ? consultation.patient_name || `${consultation.patient_first_name || ''} ${consultation.patient_last_name || ''}`.trim() || "Пациент не указан"
                              : `${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || "Врач не назначен"
                            }
                          </div>
                          <div className="text-xs text-blue-600 font-medium truncate">
                            {user?.role === 'doctor'
                              ? consultation.patient_email || "Email не указан"
                              : "Врач общей практики"
                            }
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">
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

                    <td className="p-4">
                      {renderStatusDropdown(consultation)}
                    </td>

                    <td className="p-4">
                      {renderCompactActionButtons(consultation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Mobile Card Layout */}
        {filteredConsultations.length > 0 && (
          <div className="md:hidden space-y-3">
          {visibleConsultations.map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-md overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {user?.role === 'doctor' 
                          ? (consultation.patient_name || consultation.patient_first_name || "П").charAt(0).toUpperCase()
                          : (consultation.doctor_first_name || "В").charAt(0).toUpperCase()
                        }
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user?.role === 'doctor' 
                          ? consultation.patient_name || `${consultation.patient_first_name || ''} ${consultation.patient_last_name || ''}`.trim() || "Пациент не указан"
                          : `${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || "Врач не назначен"
                        }
                      </div>
                      <div className="text-xs text-blue-600 font-medium truncate">
                        {user?.role === 'doctor'
                          ? consultation.patient_email || "Email не указан"
                          : "Врач общей практики"
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-2">
                    {renderStatusDropdown(consultation, true)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {consultation.created_at ? formatDate(consultation.created_at) : "Не указано"}
                      </div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {consultation.started_at 
                          ? new Date(consultation.started_at).toLocaleTimeString('ru-RU', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : "Не начата"
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-blue-500">
                      {getTypeIcon(consultation.type || "video")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-blue-700">
                        {getTypeText(consultation.type || "video")}
                      </div>
                      <div className="text-gray-500">Консультация</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs text-gray-600">ID:</span>
                    <span className="text-xs font-mono text-gray-900 truncate">
                      {consultation.meeting_id}
                    </span>
                  </div>
                </div>

                {renderMobileActionButtons(consultation)}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 p-4 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredConsultations.length)} из {filteredConsultations.length}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                            page === currentPage
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === 2 && currentPage > 3) {
                      return <span key={page} className="text-gray-400 px-1">...</span>;
                    } else if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key={page} className="text-gray-400 px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsTable;