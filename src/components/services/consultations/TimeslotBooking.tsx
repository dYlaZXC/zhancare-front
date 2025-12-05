import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Info,
  Zap
} from "lucide-react";
import clsx from "clsx";

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  available_spots: number;
  max_consultations: number;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface TimeslotBookingProps {
  doctorId: number;
  aiRecommendationId?: number;
  urgency: "urgent" | "non_urgent";
  onBookingComplete: (consultationId: number) => void;
  onBack: () => void;
}

const TimeslotBooking: React.FC<TimeslotBookingProps> = ({
  doctorId,
  aiRecommendationId,
  urgency,
  onBookingComplete,
  onBack
}) => {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState<TimeSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Generate next 7 days for date selection
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : date.toLocaleDateString('ru-RU', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }),
        date: date
      });
    }
    return dates;
  }, []);

  // Set default date to today
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].value);
    }
  }, [availableDates, selectedDate]);

  // Fetch available timeslots
  useEffect(() => {
    const fetchTimeslots = async () => {
      if (!selectedDate || !doctorId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/consultations/timeslots/available/?doctor_id=${doctorId}&start_date=${selectedDate}&end_date=${selectedDate}&limit=20`,
          {
            headers: {
              'Authorization': `Token ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Ошибка загрузки временных слотов');
        }

        const data = await response.json();
        setTimeslots(data.timeslots || []);
      } catch (err: any) {
        console.error('Error fetching timeslots:', err);
        setError(err.message || 'Ошибка загрузки временных слотов');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeslots();
  }, [selectedDate, doctorId]);

  // Book selected timeslot
  const handleBooking = async () => {
    if (!selectedTimeslot) return;

    setBooking(true);
    setError(null);

    try {
      const response = await fetch('/api/consultations/book-scheduled/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeslot_id: selectedTimeslot.id,
          ai_recommendation_id: aiRecommendationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка бронирования');
      }

      const data = await response.json();
      onBookingComplete(data.consultation.id);
    } catch (err: any) {
      console.error('Error booking consultation:', err);
      setError(err.message || 'Ошибка бронирования консультации');
    } finally {
      setBooking(false);
    }
  };

  // Group timeslots by time periods
  const groupedTimeslots = useMemo(() => {
    const groups = {
      morning: timeslots.filter(slot => {
        const hour = new Date(slot.start_time).getHours();
        return hour >= 9 && hour < 12;
      }),
      afternoon: timeslots.filter(slot => {
        const hour = new Date(slot.start_time).getHours();
        return hour >= 12 && hour < 17;
      }),
      evening: timeslots.filter(slot => {
        const hour = new Date(slot.start_time).getHours();
        return hour >= 17 && hour < 20;
      }),
    };
    return groups;
  }, [timeslots]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TimeSlotGroup = ({ title, slots, icon }: { title: string; slots: TimeSlot[]; icon: React.ReactNode }) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          <span>{title}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {slots.map((slot) => (
            <motion.button
              key={slot.id}
              onClick={() => setSelectedTimeslot(slot)}
              className={clsx(
                "p-3 rounded-xl border-2 transition-all duration-200 text-center",
                selectedTimeslot?.id === slot.id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-sm">{formatTime(slot.start_time)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {slot.available_spots} мест
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  // If urgent, show immediate booking option
  if (urgency === "urgent") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Экстренная консультация</h3>
          <p className="text-red-700 mb-4">
            AI определил, что ваши симптомы требуют немедленного внимания врача.
          </p>
          <p className="text-sm text-red-600 mb-6">
            Врач свяжется с вами в ближайшее время. Ожидаемое время ответа: 5-10 минут.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={() => {
                // Process urgent consultation immediately
                // This would call the urgent consultation endpoint
                onBookingComplete(0); // Placeholder - would be actual consultation ID
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Начать экстренную консультацию
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выберите удобное время</h2>
        <p className="text-gray-600">Доступные слоты для онлайн консультации</p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Выберите дату
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {availableDates.map((date) => (
            <button
              key={date.value}
              onClick={() => setSelectedDate(date.value)}
              className={clsx(
                "p-3 rounded-xl text-center transition-all duration-200",
                selectedDate === date.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-50 hover:bg-blue-50 text-gray-700"
              )}
            >
              <div className="font-medium text-sm">{date.label}</div>
              <div className="text-xs opacity-75">
                {date.date.getDate()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Timeslots */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Доступные времена
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Загрузка временных слотов...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Попробовать снова
            </button>
          </div>
        ) : timeslots.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">На выбранную дату нет доступных временных слотов</p>
          </div>
        ) : (
          <div className="space-y-6">
            <TimeSlotGroup
              title="Утро (9:00 - 12:00)"
              slots={groupedTimeslots.morning}
              icon={<Clock className="w-4 h-4" />}
            />
            <TimeSlotGroup
              title="День (12:00 - 17:00)"
              slots={groupedTimeslots.afternoon}
              icon={<Clock className="w-4 h-4" />}
            />
            <TimeSlotGroup
              title="Вечер (17:00 - 20:00)"
              slots={groupedTimeslots.evening}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        )}
      </div>

      {/* Selected Timeslot Info */}
      {selectedTimeslot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-2xl border border-blue-200 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Выбранное время</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{availableDates.find(d => d.value === selectedDate)?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{formatTime(selectedTimeslot.start_time)} - {formatTime(selectedTimeslot.end_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-600" />
              <span>Онлайн консультация</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>
        <button
          onClick={handleBooking}
          disabled={!selectedTimeslot || booking}
          className={clsx(
            "px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200",
            selectedTimeslot && !booking
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          {booking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Бронирование...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Забронировать консультацию
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TimeslotBooking;