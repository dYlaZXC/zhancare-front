"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Trash2
} from "lucide-react";

interface ScheduleEvent {
  id: number;
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
  specialization?: string;
  notes?: string;
}

interface ScheduleViewProps {
  user: any;
}

export default function ScheduleView({ user }: ScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'consultation' | 'appointment'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchSchedule();
  }, [currentDate, viewMode]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedule/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
      });

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
          patient_id: 101,
          patient_name: 'Айгуль Нурсултанова',
          doctor_id: 1,
          doctor_name: 'Доктор Абаев Даурен',
          date: '2026-01-13',
          time: '09:00',
          duration: 30,
          status: 'scheduled',
          specialization: 'Кардиолог',
          notes: 'Первичная консультация'
        },
        {
          id: 2,
          type: 'appointment',
          patient_id: 102,
          patient_name: 'Ерлан Касымов',
          nurse_id: 3,
          nurse_name: 'Медсестра Малика',
          date: '2026-01-13',
          time: '10:30',
          duration: 60,
          status: 'scheduled',
          location: 'ул. Абая 150, кв. 25',
          notes: 'Взятие анализов на дому'
        },
        {
          id: 3,
          type: 'consultation',
          patient_id: 103,
          patient_name: 'Асель Токтарова',
          doctor_id: 2,
          doctor_name: 'Доктор Сагындыкова',
          date: '2026-01-13',
          time: '14:00',
          duration: 45,
          status: 'in_progress',
          specialization: 'Терапевт'
        },
        {
          id: 4,
          type: 'consultation',
          patient_id: 104,
          patient_name: 'Нурлан Аманов',
          doctor_id: 1,
          doctor_name: 'Доктор Абаев Даурен',
          date: '2026-01-14',
          time: '11:00',
          duration: 30,
          status: 'scheduled',
          specialization: 'Кардиолог'
        },
        {
          id: 5,
          type: 'appointment',
          patient_id: 105,
          patient_name: 'Динара Жумабаева',
          nurse_id: 4,
          nurse_name: 'Медсестра Асель',
          date: '2026-01-14',
          time: '15:00',
          duration: 45,
          status: 'scheduled',
          location: 'пр. Назарбаева 72, кв. 8'
        },
        {
          id: 6,
          type: 'consultation',
          patient_id: 106,
          patient_name: 'Бахыт Мұратов',
          doctor_id: 1,
          doctor_name: 'Доктор Абаев Даурен',
          date: '2026-01-15',
          time: '09:30',
          duration: 30,
          status: 'scheduled',
          specialization: 'Кардиолог'
        },
        {
          id: 7,
          type: 'consultation',
          patient_id: 107,
          patient_name: 'Гульнара Сейдахметова',
          doctor_id: 2,
          doctor_name: 'Доктор Сагындыкова',
          date: '2026-01-15',
          time: '13:00',
          duration: 30,
          status: 'scheduled',
          specialization: 'Терапевт'
        },
        {
          id: 8,
          type: 'appointment',
          patient_id: 108,
          patient_name: 'Марат Есенов',
          nurse_id: 3,
          nurse_name: 'Медсестра Малика',
          date: '2026-01-15',
          time: '16:00',
          duration: 60,
          status: 'scheduled',
          location: 'ул. Достык 200, кв. 45'
        },
      ];
      setEvents(mockEvents);
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
    } else {
      return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    }
  };

  // Render Week View
  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dateString = day.toISOString().split('T')[0];
          const dayEvents = getEventsForDate(dateString);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-4 border-2 min-h-[500px] ${
                isToday ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Day header */}
              <div className="mb-4 pb-3 border-b-2 border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-semibold">
                  {getDayName(day)}
                </div>
                <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(dateString);
                    setShowAddModal(true);
                  }}
                  className="mt-2 w-full py-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4" />
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
                  <div className="text-center py-8 text-gray-400 text-sm">
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
        <div className="grid grid-cols-7 border-b-2 border-gray-300 bg-gray-50 rounded-t-3xl">
          {['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'].map((dayName) => (
            <div key={dayName} className="p-4 text-center text-sm font-bold text-gray-700">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-rows-6 bg-white rounded-b-3xl overflow-hidden border-2 border-gray-200">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === month;
                const dateString = date.toISOString().split('T')[0];
                const dayEvents = getEventsForDate(dateString);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    className={`border-r border-gray-200 last:border-r-0 p-2 min-h-[120px] ${
                      !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                    } ${isToday ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
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
                        onClick={() => {
                          setSelectedDate(dateString);
                          setShowAddModal(true);
                        }}
                        className="p-1 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Добавить запись"
                      >
                        <Plus className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1.5 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            backgroundColor: event.type === 'consultation' ? '#ebf1ff' : '#f3e8ff',
                            color: event.type === 'consultation' ? '#3772ff' : '#8b5cf6'
                          }}
                        >
                          <div className="font-semibold truncate flex items-center gap-1">
                            {event.type === 'consultation' ? (
                              <Video className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <Home className="w-3 h-3 flex-shrink-0" />
                            )}
                            {event.time}
                          </div>
                          <div className="truncate opacity-90">{event.patient_name}</div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 font-medium pl-1">
                          +{dayEvents.length - 2} еще
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
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Расписание
            </h1>
            <p className="text-gray-600">
              Управление консультациями и записями на дому
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedDate(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
          >
            <Plus className="w-5 h-5" />
            Добавить Запись
          </motion.button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToToday}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-blue-300 font-medium transition-colors"
            >
              Сегодня
            </motion.button>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateDate('prev')}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="min-w-[250px] text-center font-semibold text-lg" style={{ color: '#1e263e' }}>
                {getDateRangeString()}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateDate('next')}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* View mode selector */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            {(['week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени пациента или доктора..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все типы</option>
            <option value="consultation">Консультации</option>
            <option value="appointment">Записи на дому</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все статусы</option>
            <option value="scheduled">Запланировано</option>
            <option value="in_progress">В процессе</option>
            <option value="completed">Завершено</option>
            <option value="cancelled">Отменено</option>
          </select>
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
          <div>
            <h3 className="text-amber-900 font-bold text-base mb-1">Демонстрационный режим</h3>
            <p className="text-amber-800 text-sm">{error}</p>
            <p className="text-amber-700 text-sm mt-1">Отображаются демонстрационные данные.</p>
          </div>
        </motion.div>
      )}

      {/* Calendar View */}
      {!loading && (
        <div className="flex-1">
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
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
    </div>
  );
}

// Event Card Component
function EventCard({ event }: { event: ScheduleEvent }) {
  const statusColor = getStatusColor(event.status);
  const typeColor = event.type === 'consultation'
    ? { bg: '#ebf1ff', text: '#3772ff' }
    : { bg: '#f3e8ff', text: '#8b5cf6' };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-3 rounded-xl border-l-4 cursor-pointer group"
      style={{
        backgroundColor: typeColor.bg,
        borderLeftColor: typeColor.text
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-1">
          {event.type === 'consultation' ? (
            <Video className="w-4 h-4 flex-shrink-0" style={{ color: typeColor.text }} />
          ) : (
            <Home className="w-4 h-4 flex-shrink-0" style={{ color: typeColor.text }} />
          )}
          <span className="text-sm font-bold" style={{ color: typeColor.text }}>
            {event.time}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded hover:bg-white/50 transition-colors" title="Редактировать">
            <Edit className="w-3 h-3 text-gray-600" />
          </button>
          <button className="p-1 rounded hover:bg-white/50 transition-colors" title="Удалить">
            <Trash2 className="w-3 h-3 text-red-600" />
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold mb-0.5" style={{ color: '#1e263e' }}>
        {event.patient_name}
      </p>

      <p className="text-xs text-gray-700 mb-1">
        {event.doctor_name || event.nurse_name}
      </p>

      {event.specialization && (
        <p className="text-xs text-gray-600">{event.specialization}</p>
      )}

      {event.location && (
        <p className="text-xs text-gray-600 mt-1">📍 {event.location}</p>
      )}

      <div className="mt-2">
        <span
          className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
          style={{
            backgroundColor: statusColor.bg,
            color: statusColor.text
          }}
        >
          {statusColor.label}
        </span>
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
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    notes: ''
  });

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement API call to create event
    console.log('Creating event:', { type: eventType, ...formData });

    // For now, just close the modal
    onClose();
    onEventAdded();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                <div className="font-semibold">Консультация</div>
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
                <div className="font-semibold">Запись на дому</div>
              </button>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Время
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
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

          {/* Patient Selection - TODO: Add actual patient selector */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Пациент
            </label>
            <input
              type="text"
              placeholder="Выберите пациента..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Doctor/Nurse Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              {eventType === 'consultation' ? 'Доктор' : 'Медсестра'}
            </label>
            <input
              type="text"
              placeholder={`Выберите ${eventType === 'consultation' ? 'доктора' : 'медсестру'}...`}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

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
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              Создать Запись
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
