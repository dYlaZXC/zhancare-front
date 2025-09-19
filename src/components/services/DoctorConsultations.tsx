"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Stethoscope, 
  Clock, 
  Users, 
  Video, 
  Phone, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Bell,
  Settings,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useConsultationManager } from "./consultations/useConsultationManager";
import ConsultationsTable from "./consultations/ConsultationsTable";

const DoctorConsultations: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed' | 'planned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const {
    consultations,
    fetchConsultations,
  } = useConsultationManager();

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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-6 lg:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Панель врача
                </h1>
                <p className="text-gray-600 mt-1">
                  Добро пожаловать, {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchConsultations()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Всего</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Ожидают</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Активные</p>
                  <p className="text-2xl font-bold text-green-900">{stats.ongoing}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Завершено</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 border border-gray-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Отменено</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Запланировано</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.planned}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
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

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск пациентов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* Global consultation popup will appear automatically from ConsultationProvider */}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Консультации
              </h2>
              <p className="text-sm text-gray-500">
                Найдено: {filteredConsultations.length} из {stats.total}
              </p>
            </div>
          </div>

          <ConsultationsTable
            consultations={filteredConsultations}
            showFilters={false}
            onAccept={acceptConsultationInTable}
            onReject={rejectConsultationInTable}
            onStatusChange={changeConsultationStatus}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorConsultations;
