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
import { useConsultationManager } from "./consultations/useConsultationManager";
import DoctorConsultationsTable from "./consultations/DoctorConsultationsTable";
import UrgentConsultationPopup, { IncomingConsultation } from "./consultations/UrgentConsultationPopup";
import { websocketService } from "@/services/websocketService";
import { StatsCards } from "./consultations/StatsCards";

const DoctorConsultationsNew: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed' | 'planned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Popup notification state
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

  // WebSocket setup for real-time notifications
  useEffect(() => {
    if (user?.role === 'doctor') {
      websocketService.connect(token || undefined);

      const handleConsultationCreated = (data: any) => {
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

        setIncomingConsultation(consultationData);
        setShowNotificationPopup(true);

        if (notificationSound) {
          notificationSound.play().catch(console.error);
        }

        toast.info(`📞 Новый запрос на консультацию от ${consultationData.patient_name}`, {
          autoClose: 8000,
          onClick: () => setShowNotificationPopup(true)
        });

        fetchConsultations();
      };

      const handleStatusChanged = (data: any) => {
        fetchConsultations();
      };

      websocketService.on('consultation_created', handleConsultationCreated);
      websocketService.on('consultation_status_changed', handleStatusChanged);

      return () => {
        websocketService.off('consultation_created', handleConsultationCreated);
        websocketService.off('consultation_status_changed', handleStatusChanged);
      };
    }
  }, [user, token, notificationSound, fetchConsultations]);

  // Popup handlers
  const handlePopupAccept = async () => {
    if (incomingConsultation) {
      setIsProcessingRequest(true);
      try {
        await api.post(`/consultations/${incomingConsultation.meeting_id}/accept/`, {});
        toast.success("✅ Консультация принята! Переход к видеозвонку...");

        setShowNotificationPopup(false);
        setIncomingConsultation(null);

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
          await api.post(`/consultations/${incomingConsultation.meeting_id}/mark-missed/`, {});
          toast.info("⏰ Время ответа истекло.");
        } else {
          await api.post(`/consultations/${incomingConsultation.meeting_id}/reject/`, {});
          toast.info("❌ Консультация отклонена.");
        }

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

  const changeConsultationStatus = async (meeting_id: string, newStatus: string) => {
    try {
      await api.post(`/consultations/${meeting_id}/status/`, { status: newStatus });
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
      `}</style>

      {/* Full-width background with proper responsive container */}
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 overflow-x-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl" />
        </div>

        {/* Responsive Container - Constrained on small, full on large */}
        <div className="w-full max-w-[100vw] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 2xl:px-12 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl border border-white/50 shadow-xl p-4 sm:p-6 lg:p-8 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                  <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">
                    Панель врача
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 truncate">
                    Добро пожаловать, {user?.first_name} {user?.last_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchConsultations()}
                  className="flex items-center gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Обновить</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 sm:p-2.5 lg:p-3 text-gray-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="mt-6 sm:mt-8">
              <StatsCards stats={stats} />
            </div>
          </motion.div>

          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/50 shadow-lg p-4 sm:p-5 lg:p-6 overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {/* Tab Navigation - Scrollable on mobile */}
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-xl min-w-max w-full sm:w-auto">
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
                      className={`flex items-center gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-all whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск пациентов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Popup Notification for Urgent Consultations */}
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
            className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/50 shadow-lg overflow-hidden"
          >
            <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  Консультации
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-500">
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

export default DoctorConsultationsNew;
