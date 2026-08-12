/**
 * Staff member interface representing doctors and nurses.
 *
 * Note: The backend uses profile models (DoctorProfile/NurseProfile) to store
 * role-specific fields like availability_status, clinic, pricing, and schedules.
 * The API flattens this data for backward compatibility, so all fields appear
 * at the top level in the response.
 */
export interface StaffMember {
  // Basic user fields
  id: number;
  // Required by the create/edit form, but not guaranteed non-null for
  // every record at runtime (e.g. legacy data) — same caveat as
  // PatientManagement.tsx's Patient interface.
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  role: 'doctor' | 'nurse';
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
  address?: string | null;
  city?: string | null;
  language?: string[] | null;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;

  // Profile fields (from DoctorProfile/NurseProfile)
  specialization?: string;
  years_of_experience?: number | null;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
  clinic?: {
    id: number;
    name: string;
    logo?: string | null;
  } | null;

  // Pricing and scheduling (from profile)
  offline_consultation_price?: number;
  online_consultation_price?: number;
  offline_doctor_share_percent?: number;
  online_doctor_share_percent?: number;
  diagnostics_commissions?: { id: number; service_id: number; service_name: string; doctor_share_percent: number }[];
  preferred_consultation_duration?: number; // in minutes
  room_number?: string | null;
  work_schedule?: {
    [key: string]: { // day name as key
      start: string; // HH:MM format
      end: string; // HH:MM format
      enabled: boolean;
    };
  };
  online_work_schedule?: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  offline_work_schedule?: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  weekly_schedules?: {
    [weekStartDate: string]: { // ISO date string (Monday of week)
      online: {
        [key: string]: {
          start: string;
          end: string;
          enabled: boolean;
        };
      };
      offline: {
        [key: string]: {
          start: string;
          end: string;
          enabled: boolean;
        };
      };
    };
  };
  schedules?: Array<{
    id?: number;
    consultation_type: 'online' | 'offline';
    weekday: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

export interface Clinic {
  id: number;
  name: string;
}

export interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: 'doctor' | 'nurse';
  clinic_id: string;
  gender: '' | 'male' | 'female' | 'other';
  birth_date: string;
  address: string;
  city: string;
  language: string[];
  years_of_experience: string;
  offline_consultation_price: string;
  online_consultation_price: string;
  offline_doctor_share_percent: string;
  online_doctor_share_percent: string;
  preferred_consultation_duration: string;
  room_number: string;
}

export const EMPTY_STAFF_FORM: StaffFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'doctor',
  clinic_id: '',
  gender: '',
  birth_date: '',
  address: '',
  city: '',
  language: ['ru'],
  years_of_experience: '',
  offline_consultation_price: '',
  online_consultation_price: '',
  offline_doctor_share_percent: '50',
  online_doctor_share_percent: '50',
  preferred_consultation_duration: '',
  room_number: '',
};

export const LANGUAGES = [
  { value: 'ru', label: 'Русский', emoji: '🇷🇺' },
  { value: 'kz', label: 'Казахский', emoji: '🇰🇿' },
  { value: 'en', label: 'Английский', emoji: '🇬🇧' },
  { value: 'other', label: 'Другой', emoji: '🌍' },
];

// Weekly schedule format keyed by week-start date (Monday), storing
// online/offline day configs. Mirrors the DoctorSchedule row shape used
// by the backend after conversion via buildSchedulesArray().
export type WeeklyScheduleDay = { start: string; end: string; enabled: boolean };
export type WeeklyScheduleWeek = {
  online: Record<string, WeeklyScheduleDay>;
  offline: Record<string, WeeklyScheduleDay>;
};
export type WeeklySchedules = Record<string, WeeklyScheduleWeek>;

export const PAGE_SIZE = 20;
