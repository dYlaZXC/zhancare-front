"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { api } from "@/utils/api";
import {
  Activity,
  Calendar,
  Clock,
  User,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  FileEdit,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Search,
  Download,
  Eye,
  Settings,
  LogIn,
  LogOut,
  Database,
  FileText,
  Users,
  HelpCircle
} from "lucide-react";

interface ActivityLog {
  id: number;
  user_name: string;
  user_role: 'admin' | 'doctor' | 'nurse';
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export';
  action_category: 'user' | 'staff' | 'consultation' | 'appointment' | 'schedule' | 'settings' | 'report';
  description: string;
  target_object?: string;
  ip_address?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
}

interface ActivityViewProps {
  user: any;
}

export default function ActivityView({ user }: ActivityViewProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Joyride tour state
  const [runTour, setRunTour] = useState(false);
  const [tourSteps] = useState<Step[]>([
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">Добро пожаловать в Журнал Активности! 🎉</h2>
          <p>Давайте совершим быстрый тур по основным возможностям этой страницы.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.stats-cards',
      content: (
        <div>
          <h3 className="font-bold mb-2">Статистика активности</h3>
          <p>Здесь отображается общая статистика: всего действий, действий за сегодня, успешных операций и ошибок.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.search-bar',
      content: (
        <div>
          <h3 className="font-bold mb-2">Поиск действий</h3>
          <p>Используйте поиск для быстрого нахождения действий по имени пользователя или описанию.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.filter-category',
      content: (
        <div>
          <h3 className="font-bold mb-2">Фильтр по категориям</h3>
          <p>Фильтруйте логи по категориям: пользователи, персонал, консультации, записи и другие.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.filter-action',
      content: (
        <div>
          <h3 className="font-bold mb-2">Фильтр по типу действия</h3>
          <p>Отфильтруйте логи по типу: создание, обновление, удаление, вход/выход, просмотр или экспорт.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.filter-status',
      content: (
        <div>
          <h3 className="font-bold mb-2">Фильтр по статусу</h3>
          <p>Выберите статус: успешно, ошибка или предупреждение для отображения соответствующих логов.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.export-button',
      content: (
        <div>
          <h3 className="font-bold mb-2">Экспорт логов</h3>
          <p>Экспортируйте логи активности для анализа или архивирования.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.activity-timeline',
      content: (
        <div>
          <h3 className="font-bold mb-2">Временная шкала активности</h3>
          <p>Здесь отображаются все действия пользователей с подробной информацией: кто, что, когда и откуда (IP адрес).</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.help-tour-button',
      content: (
        <div>
          <h3 className="font-bold mb-2">Повторный показ тура</h3>
          <p>Нажмите эту кнопку в любое время, чтобы снова запустить этот тур. Удачной работы! 🚀</p>
        </div>
      ),
      placement: 'left',
    },
  ]);

  // Check if user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('activityViewTourCompleted');
    if (!hasSeenTour && user?.roles?.includes('admin')) {
      // Delay tour start to ensure DOM is ready
      setTimeout(() => setRunTour(true), 1000);
    }
  }, [user]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('activityViewTourCompleted', 'true');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/activity/');
      setActivities(response.data);
    } catch (err: any) {
      console.error("Error fetching activities:", err);
      setError(err.message || "Не удалось загрузить логи активности");

      // Mock data for development
      const mockActivities: ActivityLog[] = [
        {
          id: 1,
          user_name: "Айгуль Нурсултанова",
          user_role: "admin",
          action_type: "create",
          action_category: "staff",
          description: "Добавлен новый доктор: Даурен Абаев (Терапевт)",
          target_object: "Doctor #12",
          ip_address: "192.168.1.45",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: "success"
        },
        {
          id: 2,
          user_name: "Ерлан Касымов",
          user_role: "doctor",
          action_type: "update",
          action_category: "consultation",
          description: "Обновлена консультация для пациента Малика Сагындыкова",
          target_object: "Consultation #456",
          ip_address: "192.168.1.78",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: "success"
        },
        {
          id: 3,
          user_name: "Айгуль Нурсултанова",
          user_role: "admin",
          action_type: "login",
          action_category: "user",
          description: "Вход в систему",
          ip_address: "192.168.1.45",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: "success"
        },
        {
          id: 4,
          user_name: "Асель Токтарова",
          user_role: "nurse",
          action_type: "create",
          action_category: "appointment",
          description: "Создана новая запись для пациента Нурлан Бекетов",
          target_object: "Appointment #789",
          ip_address: "192.168.1.92",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          status: "success"
        },
        {
          id: 5,
          user_name: "Айгуль Нурсултанова",
          user_role: "admin",
          action_type: "delete",
          action_category: "staff",
          description: "Удален сотрудник: Ержан Кенжебеков",
          target_object: "Nurse #8",
          ip_address: "192.168.1.45",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          status: "success"
        },
        {
          id: 6,
          user_name: "Даурен Абаев",
          user_role: "doctor",
          action_type: "view",
          action_category: "report",
          description: "Просмотрен отчет по консультациям за месяц",
          target_object: "Monthly Report",
          ip_address: "192.168.1.103",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          status: "success"
        },
        {
          id: 7,
          user_name: "Айгуль Нурсултанова",
          user_role: "admin",
          action_type: "update",
          action_category: "settings",
          description: "Изменены настройки клиники",
          target_object: "Clinic Settings",
          ip_address: "192.168.1.45",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          status: "success"
        },
        {
          id: 8,
          user_name: "Малика Сагындыкова",
          user_role: "nurse",
          action_type: "login",
          action_category: "user",
          description: "Неудачная попытка входа (неверный пароль)",
          ip_address: "192.168.1.115",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
          status: "failed"
        },
        {
          id: 9,
          user_name: "Айгуль Нурсултанова",
          user_role: "admin",
          action_type: "export",
          action_category: "report",
          description: "Экспортированы данные о доходах за квартал",
          target_object: "Revenue Report Q1",
          ip_address: "192.168.1.45",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          status: "success"
        },
        {
          id: 10,
          user_name: "Ерлан Касымов",
          user_role: "doctor",
          action_type: "update",
          action_category: "schedule",
          description: "Обновлено расписание на следующую неделю",
          target_object: "Schedule",
          ip_address: "192.168.1.78",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          status: "success"
        },
        {
          id: 11,
          user_name: "Айгуль Нурсултанова",
          user_role: "admin",
          action_type: "create",
          action_category: "user",
          description: "Создан новый аккаунт пациента: Сауле Абылкасова",
          target_object: "Patient #234",
          ip_address: "192.168.1.45",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
          status: "success"
        },
        {
          id: 12,
          user_name: "Асель Токтарова",
          user_role: "nurse",
          action_type: "delete",
          action_category: "appointment",
          description: "Отменена запись пациента (по просьбе пациента)",
          target_object: "Appointment #823",
          ip_address: "192.168.1.92",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          status: "warning"
        },
      ];
      setActivities(mockActivities);
    } finally {
      setLoading(false);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || activity.action_category === filterCategory;
    const matchesAction = filterAction === 'all' || activity.action_type === filterAction;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;

    return matchesSearch && matchesCategory && matchesAction && matchesStatus;
  });

  // Get icon for action type
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <UserPlus className="w-5 h-5" />;
      case 'update': return <Edit className="w-5 h-5" />;
      case 'delete': return <Trash2 className="w-5 h-5" />;
      case 'login': return <LogIn className="w-5 h-5" />;
      case 'logout': return <LogOut className="w-5 h-5" />;
      case 'view': return <Eye className="w-5 h-5" />;
      case 'export': return <Download className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <User className="w-4 h-4" />;
      case 'staff': return <Users className="w-4 h-4" />;
      case 'consultation': return <FileText className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      case 'report': return <Database className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Get color for action type
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return { bg: '#d1fae5', text: '#10b981' };
      case 'update': return { bg: '#dbeafe', text: '#3b82f6' };
      case 'delete': return { bg: '#fee2e2', text: '#ef4444' };
      case 'login': return { bg: '#e0e7ff', text: '#6366f1' };
      case 'logout': return { bg: '#f3e8ff', text: '#a855f7' };
      case 'view': return { bg: '#fef3c7', text: '#f59e0b' };
      case 'export': return { bg: '#cffafe', text: '#06b6d4' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return { bg: '#fef3c7', text: '#f59e0b' };
      case 'doctor': return { bg: '#dbeafe', text: '#3b82f6' };
      case 'nurse': return { bg: '#f3e8ff', text: '#a855f7' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  // Get Russian role name
  const getRoleNameRu = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'doctor': return 'Доктор';
      case 'nurse': return 'Медсестра';
      default: return role;
    }
  };

  // Get Russian category name
  const getCategoryNameRu = (category: string) => {
    switch (category) {
      case 'user': return 'Пользователь';
      case 'staff': return 'Персонал';
      case 'consultation': return 'Консультация';
      case 'appointment': return 'Запись';
      case 'schedule': return 'Расписание';
      case 'settings': return 'Настройки';
      case 'report': return 'Отчет';
      default: return category;
    }
  };

  const stats = {
    total: activities.length,
    today: activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      const today = new Date();
      return activityDate.toDateString() === today.toDateString();
    }).length,
    success: activities.filter(a => a.status === 'success').length,
    failed: activities.filter(a => a.status === 'failed').length,
  };

  return (
    <div className="w-full">
      {/* Joyride Tour Component */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        disableScrolling={true}
        disableScrollParentFix={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3772ff',
            textColor: '#1e263e',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
          },
          overlay: {
            zIndex: 99998,
          },
          tooltip: {
            borderRadius: 16,
            padding: 20,
          },
          buttonNext: {
            backgroundColor: '#3772ff',
            borderRadius: 12,
            padding: '10px 20px',
            fontWeight: 600,
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#6b7280',
          },
        }}
        locale={{
          back: 'Назад',
          close: 'Закрыть',
          last: 'Завершить',
          next: 'Далее',
          skip: 'Пропустить',
        }}
      />

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Журнал Активности
            </h1>
            <p className="text-gray-600">
              Отслеживайте все действия пользователей и системные события
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRunTour(true)}
              className="help-tour-button flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-blue-500 text-blue-500 font-semibold hover:bg-blue-50 transition-all"
              title="Показать тур по странице"
            >
              <HelpCircle className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="export-button flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              <Download className="w-5 h-5" />
              Экспорт Логов
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Всего действий", value: stats.total, icon: Activity, color: "#3772ff", bg: "#ebf1ff" },
            { label: "Сегодня", value: stats.today, icon: Calendar, color: "#8b5cf6", bg: "#f3e8ff" },
            { label: "Успешных", value: stats.success, icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
            { label: "Ошибок", value: stats.failed, icon: XCircle, color: "#ef4444", bg: "#fee2e2" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl p-4 border border-gray-100 shadow-sm"
              style={{ backgroundColor: stat.bg }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="search-bar flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по пользователю или действию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-category px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все категории</option>
            <option value="user">Пользователи</option>
            <option value="staff">Персонал</option>
            <option value="consultation">Консультации</option>
            <option value="appointment">Записи</option>
            <option value="schedule">Расписание</option>
            <option value="settings">Настройки</option>
            <option value="report">Отчеты</option>
          </select>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="filter-action px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все действия</option>
            <option value="create">Создание</option>
            <option value="update">Обновление</option>
            <option value="delete">Удаление</option>
            <option value="login">Вход</option>
            <option value="logout">Выход</option>
            <option value="view">Просмотр</option>
            <option value="export">Экспорт</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-status px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все статусы</option>
            <option value="success">Успешно</option>
            <option value="failed">Ошибка</option>
            <option value="warning">Предупреждение</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#3772ff' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка логов активности...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderColor: '#fbbf24'
          }}
        >
          <AlertCircle className="w-7 h-7 text-amber-700 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 font-bold text-base mb-1">Демонстрационный режим</h3>
            <p className="text-amber-800 text-sm">{error}</p>
            <p className="text-amber-700 text-sm mt-1">Отображаются демонстрационные логи.</p>
          </div>
        </motion.div>
      )}

      {/* Activity Timeline */}
      {!loading && (
        <div className="activity-timeline space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-600 mb-2">
                Активность не найдена
              </p>
              <p className="text-gray-500">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredActivities.map((activity, index) => {
                const actionColor = getActionColor(activity.action_type);
                const roleColor = getRoleBadgeColor(activity.user_role);

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: actionColor.bg, color: actionColor.text }}
                      >
                        {getActionIcon(activity.action_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold text-lg" style={{ color: '#1e263e' }}>
                            {activity.user_name}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: roleColor.bg,
                              color: roleColor.text
                            }}
                          >
                            {getRoleNameRu(activity.user_role)}
                          </span>
                          <span
                            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: actionColor.bg,
                              color: actionColor.text
                            }}
                          >
                            {getCategoryIcon(activity.action_category)}
                            {getCategoryNameRu(activity.action_category)}
                          </span>
                          {getStatusIcon(activity.status)}
                        </div>

                        {/* Description */}
                        <p className="text-gray-700 mb-3">
                          {activity.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatTimestamp(activity.timestamp)}
                          </div>
                          {activity.ip_address && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              {activity.ip_address}
                            </div>
                          )}
                          {activity.target_object && (
                            <div className="flex items-center gap-2">
                              <FileEdit className="w-4 h-4" />
                              {activity.target_object}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
