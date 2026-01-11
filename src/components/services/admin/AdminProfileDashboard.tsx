"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Star,
  Calendar,
  Video,
  CheckCircle,
  Clock,
  UserPlus,
  Stethoscope,
  Shield,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  clinic?: {
    id: number;
    name: string;
    address: string;
    city: string;
    rating: number;
  };
}

interface AdminProfileDashboardProps {
  user: User;
}

interface AnalyticsDataPoint {
  date: string;
  day: string;
  consultations: number;
  completed_consultations: number;
  appointments: number;
  revenue: number;
  new_patients: number;
}

interface UserDistribution {
  doctors: number;
  nurses: number;
  patients: number;
}

interface ConsultationStatusDistribution {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

interface ClinicInfo {
  id: number;
  name: string;
  address: string;
  rating: number;
}

interface ClinicStats {
  is_super_admin: boolean;
  clinic_info?: ClinicInfo | null;
  total_doctors: number;
  total_nurses: number;
  total_patients: number;
  active_consultations: number;
  completed_consultations_today: number;
  pending_appointments: number;
  total_revenue_month: number;
  average_rating: number;
  analytics_data?: AnalyticsDataPoint[];
  user_distribution?: UserDistribution;
  consultation_status_distribution?: ConsultationStatusDistribution;
}

export default function AdminProfileDashboard({ user }: AdminProfileDashboardProps) {
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClinicStats();
  }, []);

  const fetchClinicStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clinic-stats/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить статистику клиники");
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error("Error fetching clinic stats:", err);
      // More user-friendly error message
      if (err.message.includes('fetch')) {
        setError("Не удается подключиться к серверу. Пожалуйста, убедитесь, что бэкенд-сервер запущен.");
      } else {
        setError(err.message || "Не удалось загрузить статистику клиники");
      }

      // Set mock data for development/demo purposes
      const mockAnalyticsData: AnalyticsDataPoint[] = [
        { date: '2026-01-05', day: 'Вс', consultations: 12, completed_consultations: 10, appointments: 8, revenue: 50000, new_patients: 5 },
        { date: '2026-01-06', day: 'Пн', consultations: 18, completed_consultations: 15, appointments: 12, revenue: 75000, new_patients: 8 },
        { date: '2026-01-07', day: 'Вт', consultations: 15, completed_consultations: 13, appointments: 10, revenue: 65000, new_patients: 6 },
        { date: '2026-01-08', day: 'Ср', consultations: 20, completed_consultations: 18, appointments: 15, revenue: 90000, new_patients: 10 },
        { date: '2026-01-09', day: 'Чт', consultations: 22, completed_consultations: 20, appointments: 17, revenue: 100000, new_patients: 12 },
        { date: '2026-01-10', day: 'Пт', consultations: 25, completed_consultations: 22, appointments: 20, revenue: 110000, new_patients: 15 },
        { date: '2026-01-11', day: 'Сб', consultations: 16, completed_consultations: 14, appointments: 11, revenue: 70000, new_patients: 7 },
      ];

      setStats({
        is_super_admin: false,
        clinic_info: {
          id: 1,
          name: "Демо Клиника",
          address: "Алматы, ул. Демонстрационная 123",
          rating: 4.8
        },
        total_doctors: 12,
        total_nurses: 8,
        total_patients: 156,
        active_consultations: 3,
        completed_consultations_today: 15,
        pending_appointments: 7,
        total_revenue_month: 2500000,
        average_rating: 4.8,
        analytics_data: mockAnalyticsData,
        user_distribution: {
          doctors: 12,
          nurses: 8,
          patients: 156
        },
        consultation_status_distribution: {
          pending: 5,
          in_progress: 3,
          completed: 142,
          cancelled: 8
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    {
      title: "Всего Докторов",
      value: stats.total_doctors,
      icon: Stethoscope,
      gradient: "from-[#3772ff] to-[#2956bf]",
      bgColor: "bg-[#ebf1ff]",
      iconColor: "text-[#3772ff]",
      changeText: "Активные специалисты",
      changeColor: "text-[#2956bf]"
    },
    {
      title: "Всего Медсестер",
      value: stats.total_nurses,
      icon: UserPlus,
      gradient: "from-[#3267e6] to-[#214499]",
      bgColor: "bg-[#e1eaff]",
      iconColor: "text-[#3267e6]",
      changeText: "Медицинский персонал",
      changeColor: "text-[#214499]"
    },
    {
      title: "Всего Пациентов",
      value: stats.total_patients,
      icon: Users,
      gradient: "from-[#2c5bcc] to-[#193373]",
      bgColor: "bg-[#c1d3ff]",
      iconColor: "text-[#2c5bcc]",
      changeText: "Зарегистрированные",
      changeColor: "text-[#193373]"
    },
    {
      title: "Активные Консультации",
      value: stats.active_consultations,
      icon: Video,
      gradient: "from-[#283353] to-[#1e263e]",
      bgColor: "bg-[#eaebee]",
      iconColor: "text-[#283353]",
      changeText: "Сейчас онлайн",
      changeColor: "text-[#1e263e]"
    },
    {
      title: "Завершено Сегодня",
      value: stats.completed_consultations_today,
      icon: CheckCircle,
      gradient: "from-[#3772ff] to-[#3267e6]",
      bgColor: "bg-[#ebf1ff]",
      iconColor: "text-[#3772ff]",
      changeText: "Успешно выполнено",
      changeColor: "text-[#2956bf]"
    },
    {
      title: "Ожидающие Записи",
      value: stats.pending_appointments,
      icon: Clock,
      gradient: "from-[#2c5bcc] to-[#2956bf]",
      bgColor: "bg-[#e1eaff]",
      iconColor: "text-[#2c5bcc]",
      changeText: "В очереди",
      changeColor: "text-[#214499]"
    },
    {
      title: "Доход за Месяц",
      value: `${stats.total_revenue_month.toLocaleString()} ₸`,
      icon: DollarSign,
      gradient: "from-[#3267e6] to-[#193373]",
      bgColor: "bg-[#c1d3ff]",
      iconColor: "text-[#3267e6]",
      changeText: "Общий доход",
      changeColor: "text-[#2956bf]"
    },
    {
      title: "Средний Рейтинг",
      value: stats.average_rating.toFixed(1),
      icon: Star,
      gradient: "from-[#3772ff] to-[#2c5bcc]",
      bgColor: "bg-[#ebf1ff]",
      iconColor: "text-[#3772ff]",
      changeText: "Оценка клиники",
      changeColor: "text-[#214499]"
    },
  ] : [];

  return (
    <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#3772ff' }} />
            <span className="text-lg font-medium" style={{ color: '#283353' }}>
              Загрузка статистики...
            </span>
          </div>
        ) : null}

        {/* Clinic Info Banner - Show when admin manages specific clinic */}
        {!loading && stats && !stats.is_super_admin && stats.clinic_info && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8"
            style={{
              background: 'linear-gradient(135deg, #ebf1ff 0%, #d6e4ff 100%)',
              borderColor: '#3772ff'
            }}
          >
            <Stethoscope className="w-7 h-7 flex-shrink-0" style={{ color: '#3772ff' }} />
            <div className="flex-1">
              <h3 className="font-bold text-base mb-1" style={{ color: '#1e263e' }}>
                {stats.clinic_info.name}
              </h3>
              <p className="text-sm" style={{ color: '#283353' }}>
                {stats.clinic_info.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" style={{ color: '#fbbf24' }} fill="#fbbf24" />
              <span className="font-semibold text-lg" style={{ color: '#1e263e' }}>
                {stats.clinic_info.rating.toFixed(1)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Super Admin Badge */}
        {!loading && stats && stats.is_super_admin && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8"
            style={{
              background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
              borderColor: '#8b5cf6'
            }}
          >
            <Shield className="w-7 h-7 flex-shrink-0" style={{ color: '#8b5cf6' }} />
            <div>
              <h3 className="font-bold text-base mb-1" style={{ color: '#1e263e' }}>
                Системный Администратор
              </h3>
              <p className="text-sm" style={{ color: '#6b21a8' }}>
                Управление всей платформой и всеми клиниками
              </p>
            </div>
          </motion.div>
        )}

        {/* Show stats even if there's an error (using mock data) */}
        {stats && (
          <>
        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
            <TrendingUp className="w-8 h-8" style={{ color: '#3772ff' }} />
            Статистика Клиники
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group relative overflow-hidden rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    }}
                  >
                    {/* Gradient Accent */}
                    <div
                      className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.gradient}`}
                    ></div>

                    {/* Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                        <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${card.bgColor} animate-pulse`}></div>
                    </div>

                    {/* Content */}
                    <h3 className="text-sm font-semibold mb-2 text-gray-600 uppercase tracking-wide">
                      {card.title}
                    </h3>
                    <p className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
                      {card.value}
                    </p>
                    <p className={`text-sm font-medium ${card.changeColor} flex items-center gap-1`}>
                      <Activity className="w-4 h-4" />
                      {card.changeText}
                    </p>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-8 shadow-lg border border-gray-100"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
            <Calendar className="w-7 h-7" style={{ color: '#3772ff' }} />
            Быстрые Действия
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Управление Персоналом', icon: Users, color: '#3772ff' },
              { title: 'Просмотр Расписания', icon: Calendar, color: '#3267e6' },
              { title: 'Просмотр Отчетов', icon: TrendingUp, color: '#2c5bcc' },
              { title: 'История Активности', icon: Activity, color: '#2956bf' },
            ].map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 rounded-2xl border-2 border-gray-200 hover:border-transparent transition-all duration-300 text-left group"
                style={{
                  background: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`;
                  e.currentTarget.style.borderColor = `${action.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <action.icon
                  className="w-8 h-8 mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: action.color }}
                />
                <h3 className="font-semibold text-gray-800 group-hover:text-gray-900">
                  {action.title}
                </h3>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Analytics Charts Section */}
        {stats?.analytics_data && stats.analytics_data.length > 0 && (
          <>
            {/* Revenue & Consultations Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"
            >
              {/* Revenue Trend Chart */}
              <div className="rounded-3xl p-8 shadow-lg border border-gray-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                  <BarChart3 className="w-7 h-7" style={{ color: '#3772ff' }} />
                  Тренд Доходов (7 дней)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.analytics_data}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3772ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3772ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '14px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} ₸`, 'Доход']}
                      labelFormatter={(label) => `День: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3772ff"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      name="Доход"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Consultations Trend */}
              <div className="rounded-3xl p-8 shadow-lg border border-gray-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                  <TrendingUp className="w-7 h-7" style={{ color: '#3267e6' }} />
                  Консультации и Записи
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.analytics_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '14px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                      labelFormatter={(label) => `День: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="consultations"
                      stroke="#3267e6"
                      strokeWidth={3}
                      dot={{ fill: '#3267e6', r: 5 }}
                      name="Консультации"
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#2c5bcc"
                      strokeWidth={3}
                      dot={{ fill: '#2c5bcc', r: 5 }}
                      name="Записи"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Distribution Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"
            >
              {/* User Distribution Pie Chart */}
              {stats.user_distribution && (
                <div className="rounded-3xl p-8 shadow-lg border border-gray-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                    <PieChartIcon className="w-7 h-7" style={{ color: '#2956bf' }} />
                    Распределение Пользователей
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Пациенты', value: stats.user_distribution.patients, color: '#3772ff' },
                          { name: 'Доктора', value: stats.user_distribution.doctors, color: '#3267e6' },
                          { name: 'Медсестры', value: stats.user_distribution.nurses, color: '#2c5bcc' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Пациенты', value: stats.user_distribution.patients, color: '#3772ff' },
                          { name: 'Доктора', value: stats.user_distribution.doctors, color: '#3267e6' },
                          { name: 'Медсестры', value: stats.user_distribution.nurses, color: '#2c5bcc' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Consultation Status Bar Chart */}
              {stats.consultation_status_distribution && (
                <div className="rounded-3xl p-8 shadow-lg border border-gray-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                    <Activity className="w-7 h-7" style={{ color: '#2956bf' }} />
                    Статус Консультаций
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'Ожидание', value: stats.consultation_status_distribution.pending, color: '#f59e0b' },
                        { name: 'В процессе', value: stats.consultation_status_distribution.in_progress, color: '#3772ff' },
                        { name: 'Завершено', value: stats.consultation_status_distribution.completed, color: '#10b981' },
                        { name: 'Отменено', value: stats.consultation_status_distribution.cancelled, color: '#ef4444' },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                        formatter={(value: number) => [`${value}`, 'Количество']}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Количество">
                        {[
                          { name: 'Ожидание', value: stats.consultation_status_distribution.pending, color: '#f59e0b' },
                          { name: 'В процессе', value: stats.consultation_status_distribution.in_progress, color: '#3772ff' },
                          { name: 'Завершено', value: stats.consultation_status_distribution.completed, color: '#10b981' },
                          { name: 'Отменено', value: stats.consultation_status_distribution.cancelled, color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* New Patients Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-3xl p-8 shadow-lg border border-gray-100 mt-8"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                <UserPlus className="w-7 h-7" style={{ color: '#8b5cf6' }} />
                Новые Пациенты (7 дней)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.analytics_data}>
                  <defs>
                    <linearGradient id="patientGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [`${value}`, 'Новые пациенты']}
                    labelFormatter={(label) => `День: ${label}`}
                  />
                  <Bar dataKey="new_patients" fill="url(#patientGradient)" radius={[8, 8, 0, 0]} name="Новые пациенты" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </>
        )}
        </>
        )}
    </div>
  );
}
