export interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  rating?: number;
  experience?: number;
  availability?: string;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
  availability_note?: string;
  last_seen?: string;
  avatar?: string;
  specialties?: string[];
  specialization?: {
    id: number;
    name_ru: string;
    name_kz: string;
    name_en: string;
  } | null;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  available_spots: number;
  max_consultations: number;
  is_booked?: boolean; // Add field to track if slot is booked
}

export interface RecommendedDoctor {
  id: number;
  name: string;
  doctor_type: string;
  reason: string;
  urgency: string;
  confidence?: number;
}

export interface AIErrorData {
  specialty: string;
  reason: string;
  raw: string;
}

export type Language = 'ru' | 'kz' | 'en';

export interface CalendarDate {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isTomorrow: boolean;
}