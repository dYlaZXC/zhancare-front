import type { CalendarDate } from "../types/doctor";

export const formatTime = (timeString: string): string => {
  return new Date(timeString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeLabel = (timeString: string): string => {
  const date = new Date(timeString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Завтра';
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
};

export const generateCalendarDates = (daysCount: number = 14): CalendarDate[] => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: i === 0,
      isTomorrow: i === 1
    });
  }

  return dates;
};