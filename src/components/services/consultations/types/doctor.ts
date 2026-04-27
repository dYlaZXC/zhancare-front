export interface Clinic {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  logo?: string | null;
}

export interface WorkScheduleDay {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  enabled: boolean;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  rating?: number;
  reviews_count?: number;
  experience?: number;
  years_of_experience?: number;
  clinic_id?: number;
  clinic?: Clinic | null;  // Main clinic information
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
  online_consultation_price?: string | null;
  preferred_consultation_duration?: number | null;
  language?: string | null;
  work_schedule?: Record<string, WorkScheduleDay> | null;
  is_active?: boolean;
  is_deleted?: boolean;
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