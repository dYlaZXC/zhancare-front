import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { ScheduleEvent, FilterType, FilterStatus } from '../types/scheduleTypes';

export const useScheduleData = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/schedule/');
      // Ensure we set an array, even if the API returns something else
      const data = Array.isArray(response.data) ? response.data : [];
      setEvents(data);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      setError(err.response?.data?.error || err.message || "Не удалось загрузить расписание");
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return { events, loading, error, fetchSchedule, setEvents };
};

/**
 * Filter events based on search query and filter criteria
 */
export const useFilteredEvents = (
  events: ScheduleEvent[],
  searchQuery: string,
  filterType: FilterType,
  filterStatus: FilterStatus
) => {
  // Safety check: ensure events is an array
  if (!Array.isArray(events)) {
    return [];
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.doctor_name && event.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.nurse_name && event.nurse_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return filteredEvents;
};

/**
 * Get events for a specific date
 */
export const getEventsForDate = (events: ScheduleEvent[], dateString: string) => {
  // Safety check: ensure events is an array
  if (!Array.isArray(events)) {
    return [];
  }

  return events.filter(event => event.date === dateString)
    .sort((a, b) => a.time.localeCompare(b.time));
};
