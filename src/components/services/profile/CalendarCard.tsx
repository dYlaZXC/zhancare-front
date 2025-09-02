"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useProfileData } from "./useProfileData";

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
  isSelected: boolean;
}

export const CalendarCard = ({ 
  onDateSelect,
  selectedDate 
}: CalendarCardProps) => {
  const { appointments, loading } = useProfileData();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false
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

      days.push({
        day,
        date,
        isCurrentMonth: true,
        isToday,
        hasAppointment: dayAppointments.length > 0,
        appointmentCount: dayAppointments.length,
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false
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
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false
      });
    }

    return days;
  }, [currentMonth, appointments, selectedDate]);

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
  };

  const getAppointmentIndicator = (appointmentCount: number) => {
    if (appointmentCount === 0) return null;
    
    if (appointmentCount === 1) {
      return <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-sm" />;
    }
    
    if (appointmentCount <= 3) {
      return (
        <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
          {Array.from({ length: Math.min(appointmentCount, 3) }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm" />
          ))}
        </div>
      );
    }
    
    // For more than 3 appointments, show a badge
    return (
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md border-2 border-white">
        {appointmentCount > 9 ? '9+' : appointmentCount}
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
              className={`relative text-center py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-200 min-h-[2.5rem] sm:min-h-[3.5rem] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 group ${
                !dayInfo.isCurrentMonth
                  ? "text-gray-300 hover:text-gray-400 hover:bg-gray-50"
                  : dayInfo.isSelected
                  ? "bg-blue-600 text-white font-bold shadow-lg scale-105"
                  : dayInfo.isToday
                  ? "bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 border-2 border-blue-300"
                  : dayInfo.hasAppointment
                  ? "text-gray-900 hover:bg-blue-50 font-semibold bg-blue-25"
                  : index % 7 >= 5 && dayInfo.isCurrentMonth
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              disabled={!onDateSelect}
              title={
                dayInfo.hasAppointment 
                  ? `${dayInfo.appointmentCount} записей на ${dayInfo.date.toLocaleDateString('ru-RU')}`
                  : dayInfo.date.toLocaleDateString('ru-RU')
              }
            >
              <span className="relative z-10">{dayInfo.day}</span>
              {getAppointmentIndicator(dayInfo.appointmentCount)}
              
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
            <span className="text-xs sm:text-sm font-medium text-gray-600">Есть записи</span>
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

        {/* Appointment Summary */}
        {appointments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Всего записей в этом месяце: <span className="font-semibold text-blue-600">{appointments.length}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};