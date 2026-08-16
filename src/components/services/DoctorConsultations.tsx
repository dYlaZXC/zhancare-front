"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Settings,
  Search,
  RefreshCw
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import type { Consultation } from "@/types/consultation";
import { useConsultationManager } from "./consultations/useConsultationManager";
import DoctorConsultationsTable from "./consultations/DoctorConsultationsTable";
import UrgentConsultationPopup, { IncomingConsultation } from "./consultations/UrgentConsultationPopup";
import { websocketService } from "@/services/websocketService";
import { StatsCards } from "./consultations/StatsCards";


const DoctorConsultations: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed' | 'planned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // ✅ Popup notification state
  const [incomingConsultation, setIncomingConsultation] = useState<IncomingConsultation | null>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [notificationSound] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.7;
      return audio;
    }
    return null;
  });

  const {
    consultations,
    fetchConsultations,
  } = useConsultationManager();

  // ✅ WebSocket setup for real-time notifications
  useEffect(() => {
    if (user?.role === 'doctor') {
      // console.log('🔌 Setting up WebSocket listeners for doctor consultations');

      // Connect to WebSocket with token
      websocketService.connect(token || undefined);

      // Define callback functions for cleanup
      const handleConsultationCreated = (data: any) => {
        // console.log('🔔 New consultation request received:', data);

        // Handle both data.data and direct data structures
        const consultation = data.consultation || data.data || data;

        const consultationData: IncomingConsultation = {
          id: consultation.id,
          meeting_id: consultation.meeting_id,
          patient_name: consultation.patient_name,
          patient_email: consultation.patient_email,
          symptoms: consultation.symptoms,
          is_urgent: consultation.is_urgent,
          created_at: consultation.created_at
        };

        // Show popup notification
        setIncomingConsultation(consultationData);
        setShowNotificationPopup(true);

        // Play notification sound
        if (notificationSound) {
          notificationSound.play().catch(console.error);
        }

        // Show toast notification
        toast.info(`📞 Новый запрос на консультацию от ${consultationData.patient_name}`, {
          autoClose: 8000,
          onClick: () => setShowNotificationPopup(true)
        });

        // Auto-refresh consultations list
        fetchConsultations();
      };

      const handleStatusChanged = (data: any) => {
        // console.log('📊 Consultation status changed:', data);
        fetchConsultations();
      };

      // Listen for new consultation requests
      websocketService.on('consultation_created', handleConsultationCreated);

      // Listen for consultation status changes
      websocketService.on('consultation_status_changed', handleStatusChanged);

      // Cleanup listeners on unmount
      return () => {
        websocketService.off('consultation_created', handleConsultationCreated);
        websocketService.off('consultation_status_changed', handleStatusChanged);
      };
    }
  }, [user, token, notificationSound, fetchConsultations]);

  // ✅ Popup handlers
  const handlePopupAccept = async () => {
    if (incomingConsultation) {
      setIsProcessingRequest(true);
      try {
        await api.post(`/consultations/${incomingConsultation.meeting_id}/accept/`, {});
        toast.success("✅ Консультация принята! Переход к видеозвонку...");

        // Close popup
        setShowNotificationPopup(false);
        setIncomingConsultation(null);

        // Redirect to video call
        router.push(`/video-call/doctor?meetingId=${incomingConsultation.meeting_id}`);
        fetchConsultations();
      } catch (error) {
        console.error("Ошибка при принятии консультации:", error);
        toast.error("❌ Ошибка при принятии консультации.");
      } finally {
        setIsProcessingRequest(false);
      }
    }
  };

  const handlePopupReject = async (isTimerExpired = false) => {
    if (incomingConsultation) {
      setIsProcessingRequest(true);
      try {
        if (isTimerExpired) {
          // Timer expired - mark as missed
          await api.post(`/consultations/${incomingConsultation.meeting_id}/mark-missed/`, {});
          toast.info("⏰ Время ответа истекло.");
        } else {
          // Manual rejection
          await api.post(`/consultations/${incomingConsultation.meeting_id}/reject/`, {});
          toast.info("❌ Консультация отклонена.");
        }

        // Close popup
        setShowNotificationPopup(false);
        setIncomingConsultation(null);

        fetchConsultations();
      } catch (error) {
        console.error("Ошибка при отклонении консультации:", error);
        toast.error("❌ Ошибка при отклонении консультации.");
      } finally {
        setIsProcessingRequest(false);
      }
    }
  };

  const handlePopupClose = () => {
    setShowNotificationPopup(false);
    // Don't clear incomingConsultation immediately in case user wants to reopen
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = consultations.length;
    const pending = consultations.filter(c => c.status === 'pending').length;
    const ongoing = consultations.filter(c => c.status === 'ongoing').length;
    const completed = consultations.filter(c => c.status === 'completed').length;
    const cancelled = consultations.filter(c => c.status === 'cancelled').length;
    const planned = consultations.filter(c => c.status === 'planned' || c.status === 'scheduled').length;

    return { total, pending, ongoing, completed, cancelled, planned };
  }, [consultations]);

  // Filter consultations based on active tab and search
  const filteredConsultations = useMemo(() => {
    let filtered = consultations;
    
    if (activeTab !== 'all') {
      if (activeTab === 'planned') {
        filtered = filtered.filter(c => c.status === 'planned' || c.status === 'scheduled');
      } else {
        filtered = filtered.filter(c => c.status === activeTab);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.meeting_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [consultations, activeTab, searchTerm]);

  const acceptConsultationInTable = async (meeting_id: string) => {
    try {
      const { data } = await api.post<{ meeting_id: string }>(`/consultations/${meeting_id}/accept/`, {});
      toast.success("Консультация принята");

      router.push(`/video-call/doctor?meetingId=${data.meeting_id}`);
    } catch {
      toast.error("Ошибка при принятии консультации");
    }
    fetchConsultations();
  };

  const rejectConsultationInTable = async (meeting_id: string) => {
    try {
      await api.post(`/consultations/${meeting_id}/reject/`, {});
      toast.info("Консультация отклонена");
    } catch {
      toast.error("Ошибка при отклонении консультации");
    }
    fetchConsultations();
  };

  // Same status vocabulary mismatch as DoctorConsultationsNew — diagnostics
  // rows use DiagnosticsAppointment.status, not the generic consultation one.
  const DIAGNOSTICS_STATUS_MAP: Record<string, string> = {
    pending: "scheduled",
    planned: "scheduled",
    scheduled: "scheduled",
    ongoing: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
  };

  const changeConsultationStatus = async (consultation: Consultation, newStatus: string) => {
    try {
      if (consultation.type === "diagnostics" && consultation.diagnostics_appointment_id) {
        const diagnosticsStatus = DIAGNOSTICS_STATUS_MAP[newStatus] ?? newStatus;
        await api.patch(
          `/diagnostics/appointments/${consultation.diagnostics_appointment_id}/update-status/`,
          { status: diagnosticsStatus }
        );
      } else if (!consultation.meeting_id) {
        toast.error("Не удалось определить ID консультации");
        return;
      } else {
        await api.post(`/consultations/${consultation.meeting_id}/status/`, { status: newStatus });
      }
      toast.success("Статус консультации обновлен");
      fetchConsultations();
    } catch {
      toast.error("Ошибка при изменении статуса консультации");
    }
  };

  return (
    <>
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        body {
          overflow-x: hidden;
        }
      `}</style>

      <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 overflow-x-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl" />
        </div>

      <div className="relative z-10 w-full px-1.5 xs:px-2 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-2 xs:py-3 sm:py-4 md:py-5 space-y-2.5 xs:space-y-3 sm:space-y-4 max-w-[2560px] mx-auto overflow-x-hidden">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl border border-white/50 shadow-xl p-2.5 xs:p-3 sm:p-4 md:p-5 lg:p-6 w-full"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 xs:gap-4">
            <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
              <div className="p-2 xs:p-2.5 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg xs:rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                <Stethoscope className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate leading-tight">
                  Панель врача
                </h1>
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 truncate">
                  Добро пожаловать, {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 xs:gap-2.5 self-end sm:self-auto flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchConsultations()}
                className="flex items-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium shadow-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Обновить</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 xs:p-2 sm:p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg xs:rounded-xl transition-colors flex-shrink-0"
              >
                <Settings className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>

          {/* Statistics Cards - NEW CLEAN VERSION */}
          <div className="mt-2.5 xs:mt-3 sm:mt-4 md:mt-5">
            <StatsCards stats={stats} />
          </div>

          {/* OLD VERSION - COMMENTED OUT FOR COMPARISON
          <div className="mt-2.5 xs:mt-3 sm:mt-4 md:mt-6 lg:mt-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4 xl:gap-5 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 xs:p-2 sm:p-3 lg:p-4 xl:p-5 border border-blue-200/50 w-full"
            >
              <div className="flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-blue-700 truncate leading-tight">Всего</p>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-900 mt-0.5 truncate">{stats.total}</p>
                </div>
                <BarChart3 className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-blue-600 flex-shrink-0" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 xs:p-2 sm:p-3 lg:p-4 xl:p-5 border border-orange-200/50 w-full"
            >
              <div className="flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-orange-700 truncate leading-tight">Ожидают</p>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-900 mt-0.5 truncate">{stats.pending}</p>
                </div>
                <Clock className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-orange-600 flex-shrink-0" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 xs:p-2 sm:p-3 lg:p-4 xl:p-5 border border-green-200/50 w-full"
            >
              <div className="flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-green-700 truncate leading-tight">Активные</p>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-900 mt-0.5 truncate">{stats.ongoing}</p>
                </div>
                <Activity className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-green-600 flex-shrink-0" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 xs:p-2 sm:p-3 lg:p-4 xl:p-5 border border-emerald-200/50 w-full"
            >
              <div className="flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-emerald-700 truncate leading-tight">Завершено</p>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-emerald-900 mt-0.5 truncate">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-emerald-600 flex-shrink-0" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 xs:p-2 sm:p-3 lg:p-4 xl:p-5 border border-gray-200/50 w-full"
            >
              <div className="flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-gray-700 truncate leading-tight">Отменено</p>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mt-0.5 truncate">{stats.cancelled}</p>
                </div>
                <XCircle className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-gray-600 flex-shrink-0" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 xs:p-2 sm:p-3 lg:p-4 xl:p-5 border border-purple-200/50 w-full"
            >
              <div className="flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-purple-700 truncate leading-tight">Запланировано</p>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-purple-900 mt-0.5 truncate">{stats.planned}</p>
                </div>
                <Calendar className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-purple-600 flex-shrink-0" />
              </div>
            </motion.div>
            </div>
          </div>
          */}
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl border border-white/50 shadow-lg p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-7 w-full"
        >
          <div className="flex flex-col gap-3 xs:gap-3.5 sm:gap-4">
            {/* Tab Navigation - Scrollable on mobile */}
            <div className="overflow-x-auto -mx-2 px-2 xs:-mx-3 xs:px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              <div className="inline-flex items-center gap-1.5 xs:gap-2 sm:gap-2 p-1 xs:p-1 bg-gray-100 rounded-lg xs:rounded-xl min-w-max w-full sm:w-auto">
                {[
                  { key: 'all', label: 'Все', count: stats.total },
                  { key: 'pending', label: 'Ожидают', count: stats.pending },
                  { key: 'ongoing', label: 'Активные', count: stats.ongoing },
                  { key: 'completed', label: 'Завершено', count: stats.completed },
                  { key: 'planned', label: 'Запланировано', count: stats.planned },
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-md xs:rounded-lg font-medium text-[10px] xs:text-xs sm:text-sm md:text-base transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                    <span className={`px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] xs:text-xs font-bold ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск пациентов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 py-2 xs:py-2.5 sm:py-3 md:py-3.5 bg-gray-50 border border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* ✅ Popup Notification for Urgent Consultations */}
        <UrgentConsultationPopup
          isVisible={showNotificationPopup}
          consultation={incomingConsultation}
          isProcessing={isProcessingRequest}
          onAccept={handlePopupAccept}
          onReject={handlePopupReject}
          onClose={handlePopupClose}
        />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/95 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl border border-white/50 shadow-lg overflow-hidden w-full"
        >
          <div className="p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-7 border-b border-gray-200 w-full">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
              <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">
                Консультации
              </h2>
              <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-500">
                Найдено: <span className="font-medium text-gray-900">{filteredConsultations.length}</span> из {stats.total}
              </p>
            </div>
          </div>

          <DoctorConsultationsTable
            consultations={filteredConsultations}
            showFilters={false}
            onAccept={acceptConsultationInTable}
            onReject={rejectConsultationInTable}
            onStatusChange={changeConsultationStatus}
          />
        </motion.div>
      </div>
      </div>
    </>
  );
};

export default DoctorConsultations;
