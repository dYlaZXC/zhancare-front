"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Video,
  Home,
  FlaskConical,
  Loader2,
  AlertCircle,
  Users,
  Archive,
} from "lucide-react";
import EventCard from "./schedule/components/EventCard";
import SearchSelect from "./schedule/components/SearchSelect";
import AddEventModal from "./schedule/modals/AddEventModal";
import DateDetailsDrawer from "./schedule/modals/DateDetailsDrawer";
import ArchivedRecordsDrawer from "./schedule/modals/ArchivedRecordsDrawer";
import { DoctorsScheduleContent } from "./schedule/views/DoctorsScheduleContent";
import { ReferralsContent } from "./schedule/views/ReferralsContent";
import { ServicesScheduleContent } from "./schedule/views/ServicesScheduleContent";

interface ScheduleEvent {
  id: string;
  type: 'consultation' | 'appointment' | 'diagnostics';
  consultation_type?: 'online' | 'offline';
  patient_id: number;
  patient_name: string;
  doctor_id?: number;
  doctor_name?: string;
  nurse_id?: number;
  nurse_name?: string;
  service_name?: string;
  category?: string;
  clinic_name?: string;
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
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'doctors' | 'referrals'>('month');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDateDetailsDrawer, setShowDateDetailsDrawer] = useState(false);
  const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'consultation' | 'appointment' | 'diagnostics'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');

  // Doctors view specific state
  const [doctorsViewDate, setDoctorsViewDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (viewMode === 'doctors' || viewMode === 'referrals') return;
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
                    <EventCard key={event.id} event={event} onChanged={fetchSchedule} />
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
                      <div className="flex items-center gap-1">
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
                        {dayEvents.length > 0 && (
                          <span className="inline-flex items-center justify-center h-4 md:h-5 px-1 md:px-1.5 rounded-full text-[9px] md:text-[10px] font-bold bg-gray-100 text-gray-500">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
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

                    {(() => {
                      if (dayEvents.length === 0) return null;
                      const videoCount = dayEvents.filter(e => e.type === 'consultation' && e.consultation_type !== 'offline').length;
                      const clinicCount = dayEvents.filter(e => e.type === 'consultation' && e.consultation_type === 'offline').length;
                      const diagCount = dayEvents.filter(e => e.type === 'diagnostics').length;
                      const otherCount = dayEvents.filter(e => e.type !== 'consultation' && e.type !== 'diagnostics').length;
                      const pills = [
                        videoCount > 0 && { count: videoCount, Icon: Video, bg: '#ebf1ff', color: '#3772ff', label: 'Видео' },
                        clinicCount > 0 && { count: clinicCount, Icon: Home, bg: '#dcfce7', color: '#059669', label: 'Приём' },
                        diagCount > 0 && { count: diagCount, Icon: FlaskConical, bg: '#cffafe', color: '#0891b2', label: 'Диагностика' },
                        otherCount > 0 && { count: otherCount, Icon: Home, bg: '#f3e8ff', color: '#8b5cf6', label: 'Выезд' },
                      ].filter(Boolean) as { count: number; Icon: React.ElementType; bg: string; color: string; label: string }[];
                      return (
                        <div className="flex flex-col gap-0.5 md:gap-1 mt-0.5">
                          {pills.map((pill) => (
                            <div
                              key={pill.label}
                              className="flex items-center gap-1 px-1 md:px-1.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[9px] md:text-[11px] font-semibold"
                              style={{ backgroundColor: pill.bg, color: pill.color }}
                            >
                              <pill.Icon className="w-2 h-2 md:w-3 md:h-3 flex-shrink-0" />
                              <span className="font-bold">{pill.count}</span>
                              <span className="hidden md:inline opacity-80">{pill.label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
              Консультации, выезды на дом и записи на диагностику
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowArchiveDrawer(true)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all whitespace-nowrap shadow-sm"
            >
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Архив</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedDate(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 mr-2 rounded-xl md:rounded-2xl text-white text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Добавить Запись</span>
              <span className="sm:hidden">Добавить</span>
            </motion.button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Navigation */}
          {viewMode !== 'referrals' && <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
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
          </div>}

          {/* View mode selector */}
          <div className="flex items-center gap-1 md:gap-2 bg-gray-100 p-1 rounded-lg md:rounded-xl overflow-x-auto scrollbar-hide">
            {(['week', 'month', 'doctors', 'referrals'] as const).map((mode) => (
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
                {mode === 'referrals' && (
                  <>
                    <FlaskConical className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">График услуг</span>
                    <span className="sm:hidden">Услуги</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        {viewMode !== 'referrals' && <div className="flex flex-col gap-2 md:gap-4 mt-3 md:mt-4">
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
            <div className="flex-1">
              <SearchSelect
                options={[
                  { id: 'all', label: 'Все типы' },
                  { id: 'consultation', label: 'Видеоконсультация' },
                  { id: 'appointment', label: 'Приём в клинике' },
                  { id: 'diagnostics', label: 'Диагностика' },
                ]}
                value={filterType}
                onChange={(val) => setFilterType((val || 'all') as any)}
                placeholder="Все типы"
              />
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <SearchSelect
                options={[
                  { id: 'all', label: 'Все статусы' },
                  { id: 'scheduled', label: 'Запланировано' },
                  { id: 'in_progress', label: 'В процессе' },
                  { id: 'completed', label: 'Завершено' },
                  { id: 'cancelled', label: 'Отменено' },
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus((val || 'all') as any)}
                placeholder="Все статусы"
              />
            </div>
          </div>
        </div>}
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
          {viewMode === 'referrals' && (
            <ServicesScheduleContent
              selectedDate={doctorsViewDate}
              onDateChange={setDoctorsViewDate}
              events={events as any}
              onAddClick={() => setShowAddModal(true)}
            />
          )}
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
        onClose={() => setShowDateDetailsDrawer(false)}
        selectedDate={selectedDate}
        onEventChanged={fetchSchedule}
        events={selectedDate ? events.filter(e => e.date === selectedDate) : []}
      />

      <ArchivedRecordsDrawer
        isOpen={showArchiveDrawer}
        onClose={() => setShowArchiveDrawer(false)}
        onRestored={fetchSchedule}
      />
    </div>
  );
}
