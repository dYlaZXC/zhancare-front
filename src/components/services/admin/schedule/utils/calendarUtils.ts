/**
 * Calendar utility functions for schedule management
 */

/**
 * Get the start of the week (Monday) for a given date
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * Get array of 7 dates for the week starting from Monday
 */
export const getWeekDays = (currentDate: Date): Date[] => {
  const weekStart = getWeekStart(currentDate);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });
};

/**
 * Format date as YYYY-MM-DD using local time (avoids UTC shift from toISOString)
 */
export const toLocalDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Format date for display (DD.MM.YYYY)
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Get short day name (e.g., "Mon")
 */
export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', { weekday: 'short' });
};

/**
 * Get full day name (e.g., "Monday")
 */
export const getDayNameFull = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', { weekday: 'long' });
};

/**
 * Get date range string based on view mode
 */
export const getDateRangeString = (currentDate: Date, viewMode: 'week' | 'month' | 'doctors'): string => {
  if (viewMode === 'week') {
    const weekDays = getWeekDays(currentDate);
    return `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`;
  } else {
    return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};
