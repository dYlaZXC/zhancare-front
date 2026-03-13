"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Video,
  Home,
  Clock,
  User,
  Stethoscope,
  X,
  Check,
  Loader2,
  AlertCircle,
  Filter,
  Edit,
  Trash2,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Users
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  type: 'consultation' | 'appointment';
  patient_id: number;
  patient_name: string;
  doctor_id?: number;
  doctor_name?: string;
  nurse_id?: number;
  nurse_name?: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  address?: string;
  specialization?: string;
  notes?: string;
}

interface ScheduleViewProps {
  user: any;
}

export default function ScheduleView({ user }: ScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'doctors'>('month');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDateDetailsDrawer, setShowDateDetailsDrawer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'consultation' | 'appointment'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');

  // Doctors view specific state
  const [doctorsViewDate, setDoctorsViewDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchSchedule();
  }, [currentDate, viewMode]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/schedule/');
      setEvents(response.data);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      setError(err.response?.data?.error || err.message || "Не удалось загрузить расписание");
    } finally {
      setLoading(false);
    }
  };

  // Calendar navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Get days for week view
  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  // Format date as YYYY-MM-DD using local time (avoids UTC shift from toISOString)
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Get events for a specific date
  const getEventsForDate = (dateString: string) => {
    return filteredEvents.filter(event => event.date === dateString)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  };

  const getDayNameFull = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  };

  // Get status color
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

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.doctor_name && event.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.nurse_name && event.nurse_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Get current date range string
  const getDateRangeString = () => {
    if (viewMode === 'week') {
      const weekDays = getWeekDays();
      return `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`;
    } else if (viewMode === 'doctors') {
      return new Date(doctorsViewDate + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    }
  };

  const navigateDoctorsDay = (direction: 'prev' | 'next') => {
    const d = new Date(doctorsViewDate + 'T00:00:00');
    d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    setDoctorsViewDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  // Render Week View
  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
        {weekDays.map((day) => {
          const dateString = toLocalDateStr(day);
          const dayEvents = getEventsForDate(dateString);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl md:rounded-3xl p-3 md:p-4 border-2 min-h-[400px] md:min-h-[500px] ${
                isToday ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Day header */}
              <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-semibold">
                  {getDayName(day)}
                </div>
                <div className={`text-xl md:text-2xl font-bold mt-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(dateString);
                    setShowAddModal(true);
                  }}
                  className="mt-2 w-full py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 hover:text-blue-600"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  Добавить
                </button>
              </div>

              {/* Events list */}
              <div className="space-y-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-6 md:py-8 text-gray-400 text-xs md:text-sm">
                    Нет записей
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Render Doctors Schedule View
  const renderDoctorsView = () => {
    return (
      <DoctorsScheduleContent
        selectedDate={doctorsViewDate}
        onDateChange={setDoctorsViewDate}
        events={events}
        onEventAdded={fetchSchedule}
      />
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);

    // Get the first Monday before or on the first day of the month
    const startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Generate 6 weeks (42 days) to cover all possible month layouts
    const weeks = [];
    let currentWeekStart = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + day);
        days.push(date);
      }
      weeks.push(days);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return (
      <div className="h-full flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b-2 border-gray-300 bg-gray-50 rounded-t-2xl md:rounded-t-3xl">
          {[
            { full: 'Понедельник', short: 'Пн' },
            { full: 'Вторник', short: 'Вт' },
            { full: 'Среда', short: 'Ср' },
            { full: 'Четверг', short: 'Чт' },
            { full: 'Пятница', short: 'Пт' },
            { full: 'Суббота', short: 'Сб' },
            { full: 'Воскресенье', short: 'Вс' }
          ].map((day) => (
            <div key={day.full} className="p-1.5 md:p-4 text-center text-[10px] md:text-sm font-bold text-gray-700">
              <span className="hidden md:inline">{day.full}</span>
              <span className="md:hidden">{day.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-rows-6 bg-white rounded-b-2xl md:rounded-b-3xl overflow-hidden border-2 border-gray-200">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === month;
                const dateString = toLocalDateStr(date);
                const dayEvents = getEventsForDate(dateString);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    className={`border-r border-gray-200 last:border-r-0 p-1 md:p-2 min-h-[80px] md:min-h-[120px] cursor-pointer hover:bg-blue-50/30 transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                    } ${isToday ? 'bg-blue-50/50' : ''}`}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDate(dateString);
                        setShowDateDetailsDrawer(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-semibold ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateString);
                          setShowAddModal(true);
                        }}
                        className="p-0.5 md:p-1 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Добавить запись"
                      >
                        <Plus className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </button>
                    </div>

                    <div className="space-y-0.5 md:space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-[10px] md:text-xs p-1 md:p-1.5 rounded-md md:rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            backgroundColor: event.type === 'consultation' ? '#ebf1ff' : '#f3e8ff',
                            color: event.type === 'consultation' ? '#3772ff' : '#8b5cf6'
                          }}
                        >
                          <div className="font-semibold truncate flex items-center gap-0.5 md:gap-1">
                            {event.type === 'consultation' ? (
                              <Video className="w-2 h-2 md:w-3 md:h-3 flex-shrink-0" />
                            ) : (
                              <Home className="w-2 h-2 md:w-3 md:h-3 flex-shrink-0" />
                            )}
                            {event.time}
                          </div>
                          <div className="truncate opacity-90 hidden md:block">{event.patient_name}</div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium pl-0.5 md:pl-1">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 md:mb-6 px-2 md:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-0 mb-4 md:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 truncate" style={{ color: '#1e263e' }}>
              Расписание
            </h1>
            <p className="text-xs md:text-base text-gray-600 truncate">
              Управление онлайн и оффлайн консультациями
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedDate(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-white text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Добавить Запись</span>
            <span className="sm:hidden">Добавить</span>
          </motion.button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (viewMode === 'doctors') {
                  const today = new Date();
                  setDoctorsViewDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                } else {
                  goToToday();
                }
              }}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white whitespace-nowrap flex-shrink-0 transition-all"
              style={{ backgroundColor: '#3772ff' }}
            >
              Сегодня
            </motion.button>

            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
              <motion.button
                whileHover={{ backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => viewMode === 'doctors' ? navigateDoctorsDay('prev') : navigateDate('prev')}
                className="p-2 transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </motion.button>

              <div className="flex items-center gap-2 px-3 py-2 whitespace-nowrap font-semibold text-sm border-x border-gray-200" style={{ color: '#1e263e' }}>
                <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="capitalize">{getDateRangeString()}</span>
              </div>

              <motion.button
                whileHover={{ backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => viewMode === 'doctors' ? navigateDoctorsDay('next') : navigateDate('next')}
                className="p-2 transition-colors flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* View mode selector */}
          <div className="flex items-center gap-1 md:gap-2 bg-gray-100 p-1 rounded-lg md:rounded-xl overflow-x-auto scrollbar-hide">
            {(['week', 'month', 'doctors'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${
                  viewMode === mode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'week' && 'Неделя'}
                {mode === 'month' && 'Месяц'}
                {mode === 'doctors' && (
                  <>
                    <Users className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">График врачей</span>
                    <span className="sm:hidden">Врачи</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-2 md:gap-4 mt-3 md:mt-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2 md:gap-4">
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Все типы</option>
              <option value="consultation">Онлайн</option>
              <option value="appointment">Оффлайн</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Все статусы</option>
              <option value="scheduled">Запланировано</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
        </div>
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
          <p className="text-amber-800 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Calendar View */}
      {!loading && (
        <div className="flex-1 px-2 md:px-0">
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'doctors' && renderDoctorsView()}
        </div>
      )}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        onEventAdded={fetchSchedule}
      />

      {/* Date Details Drawer */}
      <DateDetailsDrawer
        isOpen={showDateDetailsDrawer}
        onClose={() => {
          setShowDateDetailsDrawer(false);
        }}
        selectedDate={selectedDate}
        events={selectedDate ? events.filter(e => {
          const eventDate = new Date(e.date + 'T' + e.time);
          const targetDate = new Date(selectedDate);
          return eventDate.getFullYear() === targetDate.getFullYear() &&
                 eventDate.getMonth() === targetDate.getMonth() &&
                 eventDate.getDate() === targetDate.getDate();
        }) : []}
      />
    </div>
  );
}

// Event Card Component
function EventCard({ event }: { event: ScheduleEvent }) {
  const statusColor = getStatusColor(event.status);
  const isConsultation = event.type === 'consultation';
  const accentColor = isConsultation ? '#3772ff' : '#8b5cf6';
  const accentBg = isConsultation ? '#ebf1ff' : '#f3e8ff';
  const accentBorder = isConsultation ? '#c7d7ff' : '#ddd6fe';

  const initials = event.patient_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -1, shadow: 'lg' }}
      className="rounded-xl border cursor-pointer group overflow-hidden bg-white"
      style={{ borderColor: accentBorder }}
    >
      {/* Colored top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-2.5 md:p-3">
        {/* Time + type + actions row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentBg }}>
              {isConsultation
                ? <Video className="w-3 h-3" style={{ color: accentColor }} />
                : <Home className="w-3 h-3" style={{ color: accentColor }} />}
            </div>
            <span className="text-xs md:text-sm font-bold" style={{ color: accentColor }}>
              {event.time}
            </span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" title="Редактировать">
              <Edit className="w-3 h-3 text-gray-400" />
            </button>
            <button className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors" title="Удалить">
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        {/* Patient row with avatar */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${isConsultation ? '#2c5bcc' : '#7c3aed'})` }}>
            {initials}
          </div>
          <p className="text-xs md:text-sm font-semibold truncate" style={{ color: '#1e263e' }}>
            {event.patient_name}
          </p>
        </div>

        {/* Doctor */}
        {(event.doctor_name || event.nurse_name) && (
          <p className="text-[10px] md:text-xs text-gray-400 truncate pl-8 mb-1.5">
            {event.doctor_name || event.nurse_name}
          </p>
        )}

        {/* Status badge */}
        <div className="pl-8">
          <span
            className="inline-block px-2 py-0.5 rounded-md text-[10px] md:text-xs font-semibold"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {statusColor.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function getStatusColor(status: string) {
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
}

// Searchable Select Component
function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  required
}: {
  options: Array<{ id: number; label: string; subtitle?: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedLabel = options.find(o => String(o.id) === value)?.label;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors bg-white ${
          isOpen ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        {selectedLabel ? (
          <>
            <span className="flex-1 text-sm font-medium text-gray-900">{selectedLabel}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1.5 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto scrollbar-hide py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Ничего не найдено</div>
            ) : (
              filtered.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { onChange(String(option.id)); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    String(option.id) === value
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium ${String(option.id) === value ? 'text-blue-700' : 'text-gray-700'}`}>
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className={`text-xs ${String(option.id) === value ? 'text-blue-500' : 'text-gray-400'}`}>
                      {option.subtitle}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {required && (
        <input type="text" value={value} required readOnly className="sr-only" tabIndex={-1} />
      )}
    </div>
  );
}

// Add Event Modal Component
function AddEventModal({
  isOpen,
  onClose,
  selectedDate,
  onEventAdded
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onEventAdded: () => void;
}) {
  const [eventType, setEventType] = useState<'consultation' | 'appointment'>('consultation');
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    nurse_id: '',
    date: selectedDate || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })(),
    time: '',
    duration: 30,
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{
    id: number;
    start_time: string;
    end_time: string;
    available_capacity: number;
  }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDoctorIds, setAvailableDoctorIds] = useState<Set<number>>(new Set());
  const [loadingAvailableDoctors, setLoadingAvailableDoctors] = useState(false);
  const [patients, setPatients] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    gender?: string;
    address?: string;
    city?: string;
    clinic?: { id: number; name: string };
  }>>([]);
  const [doctors, setDoctors] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    years_of_experience?: number;
    address?: string;
    city?: string;
    clinic?: { id: number; name: string };
    preferred_consultation_duration?: number;
    online_work_schedule?: any;
    offline_work_schedule?: any;
  }>>([]);
  const [nurses, setNurses] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    years_of_experience?: number;
    address?: string;
    city?: string;
    clinic?: { id: number; name: string };
  }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const [patientsRes, staffRes] = await Promise.all([
          api.get('/patients/?all=true'),
          api.get('/staff/')
        ]);
        setPatients(patientsRes.data);
        setDoctors(staffRes.data.filter((s: any) => s.role === 'doctor'));
        setNurses(staffRes.data.filter((s: any) => s.role === 'nurse'));
      } catch (err) {
        console.error("Failed to load patients/staff:", err);
      }
    };
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

      setFormData({
        patient_id: '',
        doctor_id: '',
        nurse_id: '',
        date: selectedDate || dateString,
        time: '',
        duration: 30,
        address: '',
        notes: ''
      });
      setEventType('consultation');
    }
  }, [isOpen, selectedDate]);

  // Fetch available doctors when date, time, or duration changes
  useEffect(() => {
    if (!formData.date || !formData.time || eventType !== 'consultation') {
      setAvailableDoctorIds(new Set());
      return;
    }

    const fetchAvailableDoctors = async () => {
      setLoadingAvailableDoctors(true);
      try {
        const response = await api.get('/consultations/available-doctors/', {
          params: {
            date: formData.date,
            time: formData.time,
            duration: formData.duration
          }
        });
        const doctorIds = new Set<number>(response.data.available_doctors.map((d: any) => d.id));
        setAvailableDoctorIds(doctorIds);

        // If currently selected doctor is not available, clear selection
        if (formData.doctor_id && !doctorIds.has(parseInt(formData.doctor_id))) {
          setFormData(prev => ({ ...prev, doctor_id: '' }));
        }
      } catch (err) {
        console.error("Failed to fetch available doctors:", err);
        setAvailableDoctorIds(new Set());
      } finally {
        setLoadingAvailableDoctors(false);
      }
    };

    fetchAvailableDoctors();
  }, [formData.date, formData.time, formData.duration, eventType]);

  // Fetch available time slots when doctor, date, or duration changes
  useEffect(() => {
    if (!formData.doctor_id || !formData.date || eventType !== 'consultation') {
      setAvailableSlots([]);
      return;
    }

    const fetchAvailableSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await api.get('/consultations/available-slots/', {
          params: {
            doctor_id: formData.doctor_id,
            date: formData.date,
            duration: formData.duration
          }
        });
        setAvailableSlots(response.data.available_slots || []);
      } catch (err) {
        console.error("Failed to fetch available slots:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [formData.doctor_id, formData.date, formData.duration, eventType]);

  // Auto-fill duration based on doctor's preferred consultation duration
  useEffect(() => {
    if (formData.doctor_id && eventType === 'consultation') {
      const selectedDoctor = doctors.find(d => String(d.id) === formData.doctor_id);
      if (selectedDoctor?.preferred_consultation_duration) {
        setFormData(prev => ({
          ...prev,
          duration: selectedDoctor.preferred_consultation_duration!
        }));
      }
    }
  }, [formData.doctor_id, doctors, eventType]);

  // Helper function to check if doctor has a valid schedule configured
  const doctorHasSchedule = (doctor: typeof doctors[0]) => {
    return Array.isArray((doctor as any).schedules) && (doctor as any).schedules.some((s: any) => s.is_active);
  };

  // Count doctors without schedules
  const doctorsWithoutSchedule = doctors.filter(d => !doctorHasSchedule(d)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        type: eventType,
        patient_id: formData.patient_id,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        notes: formData.notes,
      };

      if (eventType === 'consultation') {
        payload.doctor_id = formData.doctor_id;
      } else {
        payload.nurse_id = formData.nurse_id;
        payload.doctor_id = formData.doctor_id || undefined;
        payload.address = formData.address;
      }

      await api.post('/schedule/', payload);
      toast.success('Запись успешно создана!');
      onClose();
      onEventAdded();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Не удалось создать запись";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
            Добавить Запись
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Тип записи
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEventType('consultation')}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  eventType === 'consultation'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Video className="w-6 h-6 mx-auto mb-2" style={{ color: '#3772ff' }} />
                <div className="font-semibold">Онлайн консультация</div>
              </button>
              <button
                type="button"
                onClick={() => setEventType('appointment')}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  eventType === 'appointment'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Home className="w-6 h-6 mx-auto mb-2" style={{ color: '#8b5cf6' }} />
                <div className="font-semibold">Оффлайн консультация</div>
              </button>
            </div>
          </div>

          {/* Patient */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Пациент <span className="text-red-500">*</span>
            </label>
            <SearchSelect
              options={patients.map(p => ({ id: p.id, label: `${p.first_name} ${p.last_name}`, subtitle: p.email }))}
              value={formData.patient_id}
              onChange={(val) => setFormData({ ...formData, patient_id: val })}
              placeholder="Выберите пациента..."
              required
            />

            {/* Patient info card */}
            {formData.patient_id && (() => {
              const patient = patients.find(p => String(p.id) === formData.patient_id);
              if (!patient) return null;
              return (
                <div className="mt-3 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/40">
                  <div className="flex items-center gap-2 mb-2.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Информация о пациенте</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {patient.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.birth_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.birth_date}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.gender === 'M' ? 'Мужчина' : patient.gender === 'F' ? 'Женщина' : patient.gender}</span>
                      </div>
                    )}
                    {(patient.address || patient.city) && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{[patient.address, patient.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {patient.clinic && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.clinic.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Доктор {eventType === 'consultation' && <span className="text-red-500">*</span>}
              {loadingAvailableDoctors && (
                <span className="ml-2 text-xs text-gray-500">
                  <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                  Проверка доступности...
                </span>
              )}
            </label>
            <SearchSelect
              options={doctors
                .filter(d => {
                  // First, check if doctor has a schedule configured
                  if (!doctorHasSchedule(d)) return false;

                  // If date & time are selected for consultation, only show available doctors
                  if (formData.date && formData.time && eventType === 'consultation') {
                    return availableDoctorIds.has(d.id);
                  }
                  // Otherwise show all doctors with schedules
                  return true;
                })
                .map(d => {
                  const isAvailable = availableDoctorIds.has(d.id);
                  const availabilityBadge = formData.date && formData.time && eventType === 'consultation' && isAvailable
                    ? ' ✅'
                    : '';

                  // Build subtitle with specialization and email
                  const subtitleParts = [];
                  if (d.specialization) subtitleParts.push(d.specialization);
                  if (d.email) subtitleParts.push(d.email);
                  const subtitle = subtitleParts.join(' • ');

                  return {
                    id: d.id,
                    label: `${d.first_name} ${d.last_name}${availabilityBadge}`,
                    subtitle: subtitle || undefined
                  };
                })}
              value={formData.doctor_id}
              onChange={(val) => setFormData({ ...formData, doctor_id: val })}
              placeholder={
                formData.date && formData.time && eventType === 'consultation' && availableDoctorIds.size === 0
                  ? "Нет доступных докторов"
                  : "Выберите доктора..."
              }
              required={eventType === 'consultation'}
            />

            {/* Info about doctors without schedules */}
            {doctorsWithoutSchedule > 0 && (
              <div className="mt-2 p-3 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{doctorsWithoutSchedule}</span> {doctorsWithoutSchedule === 1 ? 'доктор не имеет' : 'докторов не имеют'} настроенного расписания. Пожалуйста, обновите расписание для {doctorsWithoutSchedule === 1 ? 'этого доктора' : 'этих докторов'} в разделе "Персонал".
                </p>
              </div>
            )}

            {/* Availability info */}
            {formData.date && formData.time && eventType === 'consultation' && !loadingAvailableDoctors && (
              <div className="mt-2 text-sm">
                {availableDoctorIds.size > 0 ? (
                  <p className="text-emerald-600">
                    ✅ {availableDoctorIds.size} {availableDoctorIds.size === 1 ? 'доктор доступен' : 'докторов доступно'} на {formData.time}
                  </p>
                ) : (
                  <p className="text-amber-600">
                    ⚠️ Нет доступных докторов на выбранное время
                  </p>
                )}
              </div>
            )}

            {/* Doctor info card */}
            {formData.doctor_id && (() => {
              const doctor = doctors.find(d => String(d.id) === formData.doctor_id);
              if (!doctor) return null;
              return (
                <div className="mt-3 p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Информация о докторе</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {doctor.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                    {doctor.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    {doctor.specialization && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{doctor.specialization}</span>
                      </div>
                    )}
                    {doctor.years_of_experience != null && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{doctor.years_of_experience} лет опыта</span>
                      </div>
                    )}
                    {(doctor.address || doctor.city) && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{[doctor.address, doctor.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {doctor.clinic && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{doctor.clinic.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Продолжительность (минут)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value={15}>15 минут</option>
              <option value={30}>30 минут</option>
              <option value={45}>45 минут</option>
              <option value={60}>1 час</option>
              <option value={90}>1.5 часа</option>
              <option value={120}>2 часа</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Время
            </label>
            {/* Show available slots dropdown for consultations with selected doctor */}
            {eventType === 'consultation' && formData.doctor_id && formData.date ? (
              <div className="relative">
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none appearance-none"
                  required
                  disabled={loadingSlots}
                >
                  {loadingSlots ? (
                    <option value="">Загрузка доступных слотов...</option>
                  ) : availableSlots.length === 0 ? (
                    <option value="">Нет доступных слотов</option>
                  ) : (
                    <>
                      <option value="">Выберите время</option>
                      {availableSlots.map((slot) => (
                        <option key={slot.id} value={slot.start_time}>
                          {slot.start_time} - {slot.end_time} ({slot.available_capacity} доступно)
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                {!loadingSlots && availableSlots.length === 0 && formData.doctor_id && formData.date && (
                  <p className="mt-2 text-sm text-amber-600">
                    ⚠️ У выбранного доктора нет доступных слотов на эту дату
                  </p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  required
                  disabled={eventType === 'consultation' && !formData.doctor_id}
                />
                {eventType === 'consultation' && !formData.doctor_id && (
                  <p className="mt-2 text-sm text-gray-500">
                    💡 Сначала выберите доктора, чтобы увидеть доступное время
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Nurse — only for appointments */}
          {eventType === 'appointment' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Медсестра <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                options={nurses.map(n => ({ id: n.id, label: `${n.first_name} ${n.last_name}`, subtitle: n.email }))}
                value={formData.nurse_id}
                onChange={(val) => setFormData({ ...formData, nurse_id: val })}
                placeholder="Выберите медсестру..."
                required
              />

              {/* Nurse info card */}
              {formData.nurse_id && (() => {
                const nurse = nurses.find(n => String(n.id) === formData.nurse_id);
                if (!nurse) return null;
                return (
                  <div className="mt-3 p-4 rounded-2xl border-2 border-violet-100 bg-violet-50/40">
                    <div className="flex items-center gap-2 mb-2.5">
                      <User className="w-4 h-4 text-violet-600" />
                      <span className="text-sm font-bold text-violet-700">Информация о медсестре</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {nurse.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span className="truncate">{nurse.email}</span>
                        </div>
                      )}
                      {nurse.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span>{nurse.phone}</span>
                        </div>
                      )}
                      {nurse.specialization && (
                        <div className="flex items-center gap-2 text-gray-600 col-span-2">
                          <Stethoscope className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span>{nurse.specialization}</span>
                        </div>
                      )}
                      {nurse.years_of_experience != null && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span>{nurse.years_of_experience} лет опыта</span>
                        </div>
                      )}
                      {(nurse.address || nurse.city) && (
                        <div className="flex items-center gap-2 text-gray-600 col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span>{[nurse.address, nurse.city].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {nurse.clinic && (
                        <div className="flex items-center gap-2 text-gray-600 col-span-2">
                          <User className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span>{nurse.clinic.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Address — only for appointments */}
          {eventType === 'appointment' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Адрес вызова <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ул. Абая 150, кв. 25"
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Добавьте дополнительную информацию..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Создаётся...' : 'Создать Запись'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Date Details Drawer Component
function DateDetailsDrawer({
  isOpen,
  onClose,
  selectedDate,
  events
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  events: ScheduleEvent[];
}) {
  if (!isOpen || !selectedDate) return null;

  const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between z-10">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1">Консультации на дату</h2>
              <p className="text-blue-100 capitalize">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">Нет запланированных консультаций</p>
                <p className="text-gray-400 text-sm mt-2">На эту дату пока нет записей</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 font-medium">
                    Всего: {sortedEvents.length} {sortedEvents.length === 1 ? 'консультация' : 'консультаций'}
                  </p>
                </div>

                {sortedEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all"
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: event.type === 'consultation' ? '#ebf1ff' : '#f3e8ff'
                          }}
                        >
                          {event.type === 'consultation' ? (
                            <Video className="w-6 h-6" style={{ color: '#3772ff' }} />
                          ) : (
                            <Home className="w-6 h-6" style={{ color: '#8b5cf6' }} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg" style={{ color: '#1e263e' }}>
                            {event.type === 'consultation' ? 'Онлайн консультация' : 'Оффлайн консультация'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {event.time} ({event.duration} мин)
                          </p>
                        </div>
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: getStatusColor(event.status).bg,
                          color: getStatusColor(event.status).text
                        }}
                      >
                        {event.status === 'scheduled' && 'Запланировано'}
                        {event.status === 'in_progress' && 'В процессе'}
                        {event.status === 'completed' && 'Завершено'}
                        {event.status === 'cancelled' && 'Отменено'}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Patient Info */}
                      <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-blue-700">Пациент</span>
                        </div>
                        <p className="font-semibold text-gray-900">{event.patient_name}</p>
                      </div>

                      {/* Doctor Info */}
                      {event.doctor_name && (
                        <div className="bg-emerald-50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <Stethoscope className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">Доктор</span>
                          </div>
                          <p className="font-semibold text-gray-900">{event.doctor_name}</p>
                        </div>
                      )}

                      {/* Nurse Info */}
                      {event.nurse_name && (
                        <div className="bg-violet-50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-violet-600" />
                            <span className="text-sm font-bold text-violet-700">Медсестра</span>
                          </div>
                          <p className="font-semibold text-gray-900">{event.nurse_name}</p>
                        </div>
                      )}

                      {/* Address (for appointments) */}
                      {event.address && (
                        <div className="bg-purple-50 p-4 rounded-xl md:col-span-2">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-bold text-purple-700">Адрес</span>
                          </div>
                          <p className="font-semibold text-gray-900">{event.address}</p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {event.notes && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Примечания:</p>
                        <p className="text-sm text-gray-600">{event.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Doctors Schedule Content Component - Shows all doctors with their available time slots
function DoctorsScheduleContent({
  selectedDate,
  onDateChange,
  events,
  onEventAdded
}: {
  selectedDate: string;
  onDateChange: (date: string) => void;
  events: ScheduleEvent[];
  onEventAdded: () => void;
}) {
  const [doctors, setDoctors] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    years_of_experience?: number;
    preferred_consultation_duration?: number;
    online_work_schedule?: Record<string, { start: string; end: string; enabled: boolean }>;
    weekly_schedules?: Record<string, { online?: Record<string, { start: string; end: string; enabled: boolean }>; offline?: Record<string, { start: string; end: string; enabled: boolean }> }>;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [modalAvailableSlots, setModalAvailableSlots] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [doctorSlots, setDoctorSlots] = useState<Map<number, any[]>>(new Map());

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await api.get('/staff/');
        const doctorsList = response.data.filter((s: any) => s.role === 'doctor');
        setDoctors(doctorsList);
      } catch (err) {
        console.error("Failed to load doctors:", err);
        toast.error("Не удалось загрузить список врачей");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Compute available slots from normalized DoctorSchedule rows (no API calls)
  useEffect(() => {
    if (doctors.length === 0 || !selectedDate) return;

    const slotsMap = new Map<number, any[]>();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = selectedDate === todayStr;
    const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    for (const doctor of doctors) {
      const duration = doctor.preferred_consultation_duration || 30;
      const targetDate = new Date(selectedDate + 'T00:00:00');

      // weekday: JS getDay() is 0=Sunday..6=Saturday, backend is 0=Monday..6=Sunday
      const jsDay = targetDate.getDay();
      const weekday = jsDay === 0 ? 6 : jsDay - 1;

      // Find matching schedule row for this weekday (online type, active)
      const scheduleRow = (doctor.schedules || []).find(
        (s: any) => s.weekday === weekday && s.consultation_type === 'online' && s.is_active
      );

      if (!scheduleRow) {
        slotsMap.set(doctor.id, []);
        continue;
      }

      const [startH, startM] = scheduleRow.start_time.slice(0, 5).split(':').map(Number);
      const [endH, endM] = scheduleRow.end_time.slice(0, 5).split(':').map(Number);
      let cur = startH * 60 + startM;
      const end = endH * 60 + endM;
      const slots: any[] = [];

      while (cur + duration <= end) {
        if (isToday && cur <= nowMinutes) { cur += duration; continue; }
        const s = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;
        const e = `${String(Math.floor((cur + duration) / 60)).padStart(2, '0')}:${String((cur + duration) % 60).padStart(2, '0')}`;
        slots.push({ id: `gen_${s.replace(':', '')}`, start_time: s, end_time: e });
        cur += duration;
      }

      slotsMap.set(doctor.id, slots);
    }

    setDoctorSlots(slotsMap);
  }, [doctors, selectedDate]);

  const handleSlotClick = (doctorId: number, slot: any) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot(slot);
    setModalAvailableSlots(doctorSlots.get(doctorId) || []);
    setShowAssignModal(true);
  };

  const handleAddClick = (doctorId: number, availableSlots: any[]) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot(null);
    setModalAvailableSlots(availableSlots);
    setShowAssignModal(true);
  };

  const filteredDoctors = doctors.filter(doctor => {
    const fullName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
    const specialization = doctor.specialization?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || specialization.includes(query);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Дата:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск врача..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-16 h-16 animate-spin mb-4 text-blue-600" />
                <span className="text-lg font-medium text-gray-600">Загрузка врачей...</span>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">
                  {searchQuery ? 'Врачи не найдены' : 'Нет врачей'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredDoctors.map((doctor) => {
                  const slots = doctorSlots.get(doctor.id) || [];
                  const bookedSlots = events.filter(e => e.doctor_id === doctor.id && e.date === selectedDate);
                  const availableSlots = slots.filter(s => !bookedSlots.some(e => e.time === s.start_time));
                  const hasSchedule = bookedSlots.length > 0 || availableSlots.length > 0;
                  const totalSlots = bookedSlots.length + availableSlots.length;
                  const fillRatio = totalSlots > 0 ? bookedSlots.length / totalSlots : -1;

                  const gradients = [
                    ['#3772ff', '#2c5bcc'],
                    ['#8b5cf6', '#7c3aed'],
                    ['#f43f5e', '#e11d48'],
                    ['#f59e0b', '#d97706'],
                    ['#10b981', '#059669'],
                    ['#06b6d4', '#0891b2'],
                  ];
                  const [g1, g2] = gradients[doctor.id % gradients.length];

                  // Status: gray = no schedule, green = available, yellow = >70% booked, red = full
                  const statusColor = !hasSchedule
                    ? 'bg-gray-300'
                    : fillRatio === 1
                    ? 'bg-red-500'
                    : fillRatio > 0.7
                    ? 'bg-amber-400'
                    : 'bg-emerald-500';

                  return (
                    <div key={doctor.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">

                      {/* Card header */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar with status dot */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                              style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                            >
                              {doctor.first_name[0]}{doctor.last_name[0]}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                          </div>

                          {/* Name + specialty */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                              {doctor.first_name} {doctor.last_name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {doctor.specialization || 'Специализация не указана'}
                            </p>
                            {/* Inline stats */}
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`flex items-center gap-1 text-xs font-semibold ${bookedSlots.length > 0 ? 'text-blue-500' : 'text-gray-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${bookedSlots.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                {bookedSlots.length} записей
                              </span>
                              <span className={`flex items-center gap-1 text-xs font-semibold ${availableSlots.length > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${availableSlots.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                {availableSlots.length} свободно
                              </span>
                            </div>
                          </div>

                          {/* Add button */}
                          <button
                            onClick={() => handleAddClick(doctor.id, availableSlots)}
                            disabled={availableSlots.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl flex-shrink-0 shadow-sm hover:shadow-md transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Запись
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gray-100 mx-5" />

                      {/* Slots body */}
                      <div className="p-5 pt-4 flex-1 space-y-4">
                        {!hasSchedule ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                              <CalendarIcon className="w-5 h-5 text-gray-300" />
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Расписание не задано</p>
                          </div>
                        ) : (
                          <>
                            {/* Booked appointments */}
                            {bookedSlots.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Записи</p>
                                <div className="flex flex-col gap-2">
                                  {bookedSlots.map(event => (
                                    <div key={event.id} className="flex items-center gap-3 bg-blue-50/60 border border-blue-100 rounded-xl px-3.5 py-2.5 group">
                                      {/* Time block */}
                                      <div
                                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm"
                                        style={{ background: 'linear-gradient(135deg, #3772ff, #2c5bcc)' }}
                                      >
                                        <span className="text-[11px] font-black leading-tight">{event.time}</span>
                                        <span className="text-[8px] opacity-70 mt-0.5">{event.duration}мин</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate leading-tight">{event.patient_name}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                            event.type === 'consultation'
                                              ? 'bg-blue-100 text-blue-700'
                                              : 'bg-violet-100 text-violet-700'
                                          }`}>
                                            {event.type === 'consultation' ? <Video className="w-2.5 h-2.5" /> : <Home className="w-2.5 h-2.5" />}
                                            {event.type === 'consultation' ? 'Онлайн' : 'Оффлайн'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Available slots */}
                            {availableSlots.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Свободные слоты</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {availableSlots.slice(0, 12).map((slot: any, i: number) => (
                                    <button
                                      key={i}
                                      onClick={() => handleSlotClick(doctor.id, slot)}
                                      className="flex flex-col items-center justify-center py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-500 hover:border-emerald-500 transition-all group"
                                    >
                                      <span className="text-xs font-black text-emerald-700 group-hover:text-white leading-tight">{slot.start_time}</span>
                                      <span className="text-[9px] text-emerald-400 group-hover:text-emerald-100 mt-0.5">{slot.end_time}</span>
                                    </button>
                                  ))}
                                  {availableSlots.length > 12 && (
                                    <button
                                      onClick={() => handleAddClick(doctor.id, availableSlots)}
                                      className="flex flex-col items-center justify-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
                                    >
                                      <span className="text-xs font-bold text-gray-500">+{availableSlots.length - 12}</span>
                                      <span className="text-[9px] text-gray-400 mt-0.5">ещё</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedDoctor && (
        <AssignConsultationModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDoctor(null);
            setSelectedSlot(null);
            setModalAvailableSlots([]);
          }}
          doctorId={selectedDoctor}
          doctorName={(() => { const d = doctors.find(x => x.id === selectedDoctor); return d ? `${d.first_name} ${d.last_name}` : ''; })()}
          doctorSpecialization={doctors.find(x => x.id === selectedDoctor)?.specialization}
          slot={selectedSlot}
          availableSlots={modalAvailableSlots}
          date={selectedDate}
          onAssigned={() => {
            setShowAssignModal(false);
            setModalAvailableSlots([]);
            onEventAdded();
          }}
        />
      )}
    </div>
  );
}

// Patient Booking Modal
function AssignConsultationModal({
  isOpen,
  onClose,
  doctorId,
  doctorName,
  doctorSpecialization,
  slot,
  availableSlots,
  date,
  onAssigned
}: {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  slot: any;
  availableSlots: any[];
  date: string;
  onAssigned: () => void;
}) {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; phone?: string } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(slot || null);
  const [consultationType, setConsultationType] = useState<'online' | 'offline'>('online');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSlot(slot || null);
    setSelectedPatient(null);
    setPatientSearch('');
    setNotes('');
    setConsultationType('online');

    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients/?all=true');
        setPatients(response.data);
      } catch (err) {
        console.error("Failed to load patients:", err);
      }
    };
    fetchPatients();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = patients.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const q = patientSearch.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Выберите пациента'); return; }
    if (!selectedSlot) { toast.error('Выберите время приёма'); return; }
    setSubmitting(true);

    try {
      await api.post('/schedule/', {
        type: 'consultation',
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        date: date,
        time: selectedSlot.start_time,
        duration: 30,
        consultation_type: consultationType,
        notes: notes
      });
      toast.success('Запись успешно создана!');
      onAssigned();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = doctorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#1e263e' }}>Новая запись</h3>
            <p className="text-sm text-gray-400 mt-0.5">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* Doctor info */}
            <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #3772ff 0%, #6c47ff 100%)' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{doctorName}</p>
                {doctorSpecialization && <p className="text-xs text-gray-400 truncate">{doctorSpecialization}</p>}
              </div>
              <span className="flex-shrink-0 text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">Врач</span>
            </div>

            {/* Slot picker */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Время приёма <span className="text-red-500">*</span>
              </label>
              {availableSlots.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  Нет свободных слотов на этот день
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableSlots.map((s, i) => {
                    const isSelected = selectedSlot?.start_time === s.start_time;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {s.start_time}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedSlot && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Выбрано: {selectedSlot.start_time} – {selectedSlot.end_time}
                </div>
              )}
            </div>

            {/* Consultation type */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Тип консультации
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([['online', 'Онлайн', Video], ['offline', 'Офлайн', Home]] as const).map(([val, label, Icon]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setConsultationType(val)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      consultationType === val
                        ? val === 'online'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient search */}
            <div ref={patientSearchRef} className="relative">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Пациент <span className="text-red-500">*</span>
              </label>
              {selectedPatient ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.name}</p>
                    {selectedPatient.phone && <p className="text-xs text-gray-500">{selectedPatient.phone}</p>}
                  </div>
                  <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-200 text-emerald-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Поиск по имени или телефону..."
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm transition-colors"
                    />
                  </div>
                  {showPatientDropdown && patientSearch.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Пациенты не найдены</div>
                      ) : (
                        filteredPatients.slice(0, 8).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            onClick={() => {
                              setSelectedPatient({ id: p.id, name: `${p.first_name} ${p.last_name}`, phone: p.phone });
                              setPatientSearch('');
                              setShowPatientDropdown(false);
                            }}
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {p.first_name[0]}{p.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{p.first_name} {p.last_name}</p>
                              {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Примечания
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Дополнительная информация о записи..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPatient || !selectedSlot}
              className="flex-1 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Создание...' : 'Создать запись'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
