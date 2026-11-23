export interface Clinic {
  id: number;
  name: string;
  address?: string;
  address_comment?: string;
  phone?: string;
  phones?: Array<{ value?: string; number?: string } | string> | null;
  city?: string;
  logo?: string | null;
  gis2_url?: string;
  lat?: number | null;
  lng?: number | null;
  distance_km?: number | null;
  // IANA name or bare "+HH:MM" offset — see src/utils/clinicTime.ts.
  time_zone?: string | null;
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
  offline_consultation_price?: string | null;
  // How much of the price (if any) is actually charged online at booking
  // time — see OfflineBookingFlow.tsx/VideoConsultation.tsx's amount
  // computation, which must mirror resolve_consultation_payment_plan
  // (payments/services.py) for display purposes. The backend is always the
  // enforced source of truth regardless of what this computes.
  online_payment_preference?: 'pay_at_clinic' | 'full_prepay' | 'partial_prepay' | null;
  offline_payment_preference?: 'pay_at_clinic' | 'full_prepay' | 'partial_prepay' | null;
  online_prepay_percent?: number | null;
  offline_prepay_percent?: number | null;
  preferred_consultation_duration?: number | null;
  language?: string | null;
  work_schedule?: Record<string, WorkScheduleDay> | null;
  is_active?: boolean;
  is_deleted?: boolean;
  room_number?: string | null;
}

export interface TimeSlot {
  id: number;
  start_time: string;   // local display string, e.g. "2026-03-15T09:00:00"
  end_time: string;
  start_utc?: string;   // UTC ISO for booking, e.g. "2026-03-15T04:00:00Z"
  // AppointmentSlot fields
  location_type?: string | null;
  status?: string;
  staff_id?: number;
  // UI-layer fields derived from schedule display
  available_spots?: number;
  max_consultations?: number;
  is_booked?: boolean;
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