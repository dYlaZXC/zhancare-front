"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock, User, Video, MessageSquare, Phone, MapPin, Stethoscope } from "lucide-react";
import { useProfileData, type Consultation, type HomeAppointment } from "./useProfileData";

interface CalendarCardProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

interface DayInfo {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAppointment: boolean;
  appointmentCount: number;
  hasConsultation: boolean;
  consultationCount: number;
  totalEvents: number;
  isSelected: boolean;
  consultations: Consultation[];
  appointments: HomeAppointment[];
}

interface DayDetailsPopupProps {
  dayInfo: DayInfo;
  onClose: () => void;
}

// Popup component for showing day details
const DayDetailsPopup = ({ dayInfo, onClose }: DayDetailsPopupProps) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'pending':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'ongoing':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'cancelled':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Завершена';
      case 'pending':
        return 'Ожидает';
      case 'ongoing':
        return 'В процессе';
      case 'cancelled':
        return 'Отменена';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{formatDate(dayInfo.date)}</h3>
              <p className="text-blue-100 text-sm mt-1">
                {dayInfo.totalEvents} {dayInfo.totalEvents === 1 ? 'событие' : dayInfo.totalEvents < 5 ? 'события' : 'событий'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {dayInfo.totalEvents === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">На этот день нет запланированных событий</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Consultations */}
              {dayInfo.consultations.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    Консультации ({dayInfo.consultations.length})
                  </h4>
                  <div className="space-y-3">
                    {dayInfo.consultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {consultation.doctor_first_name} {consultation.doctor_last_name}
                              </span>
                            </div>
                            {consultation.doctor_specialty && (
                              <p className="text-sm text-blue-700 mb-2">
                                {consultation.doctor_specialty}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {formatTime(consultation.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Home Appointments */}
              {dayInfo.appointments.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Домашние визиты ({dayInfo.appointments.length})
                  </h4>
                  <div className="space-y-3">
                    {dayInfo.appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-green-50 border border-green-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-gray-900">
                                {appointment.doctor_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Clock className="w-4 h-4" />
                              {formatTime(appointment.appointment_time)}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(appointment.status)}
                              <span className="text-sm font-medium">
                                {getStatusText(appointment.status)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CalendarCard = ({
  onDateSelect,
  selectedDate
}: CalendarCardProps) => {
  const { appointments, consultations, loading } = useProfileData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState<DayInfo | null>(null);

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getDaysInMonth = useMemo((): DayInfo[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: DayInfo[] = [];

    // Previous month's trailing days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: false,
        hasAppointment: false,
        appointmentCount: 0,
        hasConsultation: false,
        consultationCount: 0,
        totalEvents: 0,
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        consultations: [],
        appointments: []
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isSameDay(date, today);

      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_time);
        return isSameDay(aptDate, date);
      });

      const dayConsultations = consultations.filter(consultation => {
        const consultationDate = new Date(consultation.created_at);
        return isSameDay(consultationDate, date);
      });

      const totalEvents = dayAppointments.length + dayConsultations.length;

      days.push({
        day,
        date,
        isCurrentMonth: true,
        isToday,
        hasAppointment: dayAppointments.length > 0,
        appointmentCount: dayAppointments.length,
        hasConsultation: dayConsultations.length > 0,
        consultationCount: dayConsultations.length,
        totalEvents,
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        consultations: dayConsultations,
        appointments: dayAppointments
      });
    }

    // Next month's leading days to fill the grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: false,
        hasAppointment: false,
        appointmentCount: 0,
        hasConsultation: false,
        consultationCount: 0,
        totalEvents: 0,
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        consultations: [],
        appointments: []
      });
    }

    return days;
  }, [currentMonth, appointments, consultations, selectedDate]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (dayInfo: DayInfo) => {
    if (onDateSelect) {
      onDateSelect(dayInfo.date);
    }

    // Show popup if there are events on this day or if it's just a general click
    if (dayInfo.totalEvents > 0 || dayInfo.isCurrentMonth) {
      setSelectedDayInfo(dayInfo);
    }
  };

  const getEventIndicator = (dayInfo: DayInfo) => {
    const { totalEvents, hasConsultation, hasAppointment } = dayInfo;

    if (totalEvents === 0) return null;

    if (totalEvents === 1) {
      // Single event - show colored dot based on type
      const color = hasConsultation ? 'bg-blue-500' : 'bg-green-500';
      return <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 ${color} rounded-full shadow-sm`} />;
    }

    if (totalEvents <= 3) {
      // Multiple events but few - show multiple dots
      return (
        <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
          {hasConsultation && (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm" />
          )}
          {hasAppointment && (
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm" />
          )}
          {totalEvents > 2 && (
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-sm" />
          )}
        </div>
      );
    }

    // For many events, show a badge
    return (
      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md border-2 border-white">
        {totalEvents > 9 ? '9+' : totalEvents}
      </div>
    );
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="bg-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="h-6 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="w-32 h-6 bg-gray-300 rounded"></div>
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Calendar grid skeleton */}
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Day headers */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
            {/* Calendar days */}
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="h-10 sm:h-14 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Календарь</h3>
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              title="Перейти к сегодняшнему дню"
            >
              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-1.5" />
              Сегодня
            </button>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={goToPrevMonth}
              className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            
            <div className="text-base sm:text-lg font-semibold text-gray-900 capitalize min-w-[160px] sm:min-w-[200px] text-center">
              {formatMonthYear(currentMonth)}
            </div>

            <button 
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-3 sm:p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Day headers */}
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
            <div 
              key={day} 
              className={`text-xs sm:text-sm font-semibold text-center py-2 sm:py-3 ${
                index >= 5 ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {getDaysInMonth.map((dayInfo, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(dayInfo)}
              className={`relative text-center py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-200 min-h-[2.5rem] sm:min-h-[3.5rem] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 group cursor-pointer ${
                !dayInfo.isCurrentMonth
                  ? "text-gray-300 hover:text-gray-400 hover:bg-gray-50"
                  : dayInfo.isSelected
                  ? "bg-blue-600 text-white font-bold shadow-lg scale-105"
                  : dayInfo.isToday
                  ? "bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 border-2 border-blue-300"
                  : dayInfo.totalEvents > 0
                  ? "text-gray-900 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 font-semibold"
                  : index % 7 >= 5 && dayInfo.isCurrentMonth
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={
                dayInfo.totalEvents > 0
                  ? `${dayInfo.totalEvents} ${dayInfo.totalEvents === 1 ? 'событие' : dayInfo.totalEvents < 5 ? 'события' : 'событий'} на ${dayInfo.date.toLocaleDateString('ru-RU')}`
                  : dayInfo.date.toLocaleDateString('ru-RU')
              }
            >
              <span className="relative z-10">{dayInfo.day}</span>
              {getEventIndicator(dayInfo)}
              
              {/* Subtle hover effect */}
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            </button>
          ))}
        </div>

        {/* Enhanced Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Сегодня</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Консультации</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Домашние визиты</span>
          </div>
          {selectedDate && (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-600">Выбрано</span>
            </div>
          )}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-100 rounded"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Выходные</span>
          </div>
        </div>

        {/* Events Summary */}
        {(appointments.length > 0 || consultations.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Всего событий в этом месяце: <span className="font-semibold text-purple-600">{appointments.length + consultations.length}</span>
              </p>
              <div className="flex justify-center gap-4 text-xs">
                {consultations.length > 0 && (
                  <span className="text-blue-600">
                    <strong>{consultations.length}</strong> консультаций
                  </span>
                )}
                {appointments.length > 0 && (
                  <span className="text-green-600">
                    <strong>{appointments.length}</strong> домашних визитов
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Details Popup */}
      {selectedDayInfo && (
        <DayDetailsPopup
          dayInfo={selectedDayInfo}
          onClose={() => setSelectedDayInfo(null)}
        />
      )}
    </div>
  );
};