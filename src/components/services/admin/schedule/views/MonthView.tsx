"use client";

import { Plus, Video, Home } from "lucide-react";
import { toLocalDateStr, getDayName, isToday } from "../utils/calendarUtils";
import { getEventsForDate } from "../hooks/useScheduleData";
import EventCard from "../components/EventCard";
import { ScheduleEvent } from "../types/scheduleTypes";

interface MonthViewProps {
  currentDate: Date;
  filteredEvents: ScheduleEvent[];
  onDateClick: (date: string) => void;
  onAddClick: () => void;
  onShowDateDetails: (date: string) => void;
}

export default function MonthView({
  currentDate,
  filteredEvents,
  onDateClick,
  onAddClick,
  onShowDateDetails,
}: MonthViewProps) {
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
              const dayEvents = getEventsForDate(dateString, filteredEvents);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`border-r border-gray-200 last:border-r-0 p-1 md:p-2 min-h-[80px] md:min-h-[120px] cursor-pointer hover:bg-blue-50/30 transition-colors ${
                    !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                  } ${isTodayDate ? 'bg-blue-50/50' : ''}`}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      onDateClick(dateString);
                      onShowDateDetails(dateString);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-semibold ${
                        isTodayDate
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
                        onDateClick(dateString);
                        onAddClick();
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
}
