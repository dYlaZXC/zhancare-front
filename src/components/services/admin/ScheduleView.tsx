"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Filter,
  Search,
  Video,
  Home,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface ScheduleEvent {
  id: number;
  type: 'consultation' | 'appointment';
  patient_name: string;
  doctor_name?: string;
  nurse_name?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  specialization?: string;
}

interface ScheduleViewProps {
  user: any;
}

export default function ScheduleView({ user }: ScheduleViewProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterType, setFilterType] = useState<'all' | 'consultation' | 'appointment'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSchedule();
  }, [currentDate, viewMode]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedule/?date=${currentDate.toISOString()}&view=${viewMode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить расписание");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      setError(err.message || "Не удалось загрузить расписание");

      // Mock data for development
      const mockEvents: ScheduleEvent[] = [
        {
          id: 1,
          type: 'consultation',
          patient_name: 'Айгуль Нурсултанова',
          doctor_name: 'Даурен Абаев',
          date: '2026-01-11',
          time: '09:00',
          status: 'scheduled',
          specialization: 'Кардиология'
        },
        {
          id: 2,
          type: 'appointment',
          patient_name: 'Малика Сагындыкова',
          nurse_name: 'Асель Токтарова',
          date: '2026-01-11',
          time: '10:30',
          status: 'scheduled',
          location: 'Алматы, ул. Абая 150',
          specialization: 'Процедурная'
        },
        {
          id: 3,
          type: 'consultation',
          patient_name: 'Ерлан Касымов',
          doctor_name: 'Айгуль Нурсултанова',
          date: '2026-01-11',
          time: '11:00',
          status: 'in_progress',
          specialization: 'Терапия'
        },
        {
          id: 4,
          type: 'appointment',
          patient_name: 'Даурен Токаев',
          nurse_name: 'Малика Сагындыкова',
          date: '2026-01-12',
          time: '14:00',
          status: 'scheduled',
          location: 'Астана, ул. Кабанбай Батыра 45',
          specialization: 'Патронаж'
        },
        {
          id: 5,
          type: 'consultation',
          patient_name: 'Асель Жаксылыкова',
          doctor_name: 'Даурен Абаев',
          date: '2026-01-12',
          time: '15:30',
          status: 'completed',
          specialization: 'Кардиология'
        },
        {
          id: 6,
          type: 'consultation',
          patient_name: 'Нурлан Сапаров',
          doctor_name: 'Айгуль Нурсултанова',
          date: '2026-01-13',
          time: '09:30',
          status: 'scheduled',
          specialization: 'Терапия'
        },
      ];
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesSearch =
      event.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.nurse_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  // Navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { bg: '#ebf1ff', text: '#3772ff', label: 'Запланировано' };
      case 'in_progress':
        return { bg: '#fef3c7', text: '#f59e0b', label: 'В процессе' };
      case 'completed':
        return { bg: '#d1fae5', text: '#10b981', label: 'Завершено' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#ef4444', label: 'Отменено' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: 'Неизвестно' };
    }
  };

  const stats = {
    total: filteredEvents.length,
    scheduled: filteredEvents.filter(e => e.status === 'scheduled').length,
    in_progress: filteredEvents.filter(e => e.status === 'in_progress').length,
    completed: filteredEvents.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
          Просмотр Расписания
        </h1>
        <p className="text-gray-600">
          Управляйте расписанием консультаций и визитов
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Всего", value: stats.total, icon: CalendarIcon, color: "#3772ff", bg: "#ebf1ff" },
          { label: "Запланировано", value: stats.scheduled, icon: Clock, color: "#3267e6", bg: "#e1eaff" },
          { label: "В процессе", value: stats.in_progress, icon: Loader2, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Завершено", value: stats.completed, icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
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

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Date Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border-2 border-gray-200 shadow-sm">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className="px-4 font-semibold text-gray-800 min-w-[200px] text-center">
            {currentDate.toLocaleDateString('ru-RU', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' && { day: 'numeric' })
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <div className="h-8 w-px bg-gray-300 mx-2" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
          >
            Сегодня
          </motion.button>
        </div>

        {/* View Mode */}
        <div className="flex gap-2 bg-white rounded-2xl p-2 border-2 border-gray-200 shadow-sm">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(mode)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {mode === 'day' && 'День'}
              {mode === 'week' && 'Неделя'}
              {mode === 'month' && 'Месяц'}
            </motion.button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по пациенту или врачу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
        >
          <option value="all">Все типы</option>
          <option value="consultation">Консультации</option>
          <option value="appointment">Визиты</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#3772ff' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка расписания...
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
            <p className="text-amber-700 text-sm mt-1">Отображаются демонстрационные данные.</p>
          </div>
        </motion.div>
      )}

      {/* Schedule List */}
      {!loading && (
        <div className="space-y-6">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-gray-100">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-600 mb-2">
                События не найдены
              </p>
              <p className="text-gray-500">
                Нет запланированных событий на выбранный период
              </p>
            </div>
          ) : (
            Object.entries(groupedEvents)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, dayEvents]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="font-semibold text-blue-700">
                        {new Date(date).toLocaleDateString('ru-RU', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {dayEvents
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((event, index) => {
                          const statusColor = getStatusColor(event.status);
                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.05 }}
                              className="rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  {/* Icon */}
                                  <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background: event.type === 'consultation'
                                        ? 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)'
                                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                    }}
                                  >
                                    {event.type === 'consultation' ? (
                                      <Video className="w-7 h-7 text-white" />
                                    ) : (
                                      <Home className="w-7 h-7 text-white" />
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-xl font-bold" style={{ color: '#1e263e' }}>
                                        {event.patient_name}
                                      </h3>
                                      <span
                                        className="px-3 py-1 rounded-full text-xs font-semibold"
                                        style={{
                                          backgroundColor: statusColor.bg,
                                          color: statusColor.text
                                        }}
                                      >
                                        {statusColor.label}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">{event.time}</span>
                                      </div>

                                      {event.doctor_name && (
                                        <div className="flex items-center gap-2">
                                          <Stethoscope className="w-4 h-4" />
                                          {event.doctor_name}
                                        </div>
                                      )}

                                      {event.nurse_name && (
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4" />
                                          {event.nurse_name}
                                        </div>
                                      )}

                                      {event.location && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-4 h-4" />
                                          {event.location}
                                        </div>
                                      )}

                                      {event.specialization && (
                                        <div className="flex items-center gap-2 col-span-2">
                                          <span
                                            className="px-2 py-1 rounded-lg text-xs font-medium"
                                            style={{
                                              backgroundColor: event.type === 'consultation' ? '#ebf1ff' : '#f3e8ff',
                                              color: event.type === 'consultation' ? '#3772ff' : '#8b5cf6'
                                            }}
                                          >
                                            {event.specialization}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Type Badge */}
                                <div
                                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                                  style={{
                                    backgroundColor: event.type === 'consultation' ? '#ebf1ff' : '#f3e8ff',
                                    color: event.type === 'consultation' ? '#3772ff' : '#8b5cf6'
                                  }}
                                >
                                  {event.type === 'consultation' ? 'Консультация' : 'Визит на дом'}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
