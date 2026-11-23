/**
 * Patient interface.
 *
 * Note: The backend uses PatientProfile for personal information
 * (citizenship, marital_status, profession) and PatientMedicalProfile
 * for medical data. The API flattens this data for compatibility.
 */
export interface Patient {
  // Basic user fields
  id: number;
  // The API can return null for any of these (e.g. a phone-only
  // registration has no email) — don't call string methods on them without
  // a null check.
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  is_active: boolean;
  created_at: string;

  // Profile fields (from PatientProfile)
  citizenship?: string;
  marital_status?: string;
  profession?: string;
  referral_source?: string;

  clinic?: { id: number; name: string } | null;
  additional_clinics?: { id: number; name: string }[];
  clinic_created?: boolean;
  last_visit?: string | null;
  last_visit_type?: 'consultation' | 'appointment' | null;
  visits_count?: number;
}

export interface Clinic {
  id: number;
  name: string;
}

// Result of GET /patients/lookup/ — pre-submit duplicate check in the
// "Добавить Пациента" flow, used to offer linking an existing patient
// (registered under a different clinic) instead of hard-blocking on
// "user already exists".
export interface FoundPatient {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  has_email: boolean;
  clinic: { id: number; name: string } | null;
  additional_clinics: { id: number; name: string }[];
}

export interface PatientLookupResponse {
  found: boolean;
  already_in_clinic?: boolean;
  patient?: FoundPatient;
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  clinic_id: string;
  referral_source: string;
}

export const EMPTY_PATIENT_FORM: PatientFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  birth_date: '',
  gender: 'male',
  address: '',
  city: '',
  clinic_id: '',
  referral_source: '',
};

// Matches PatientProfile.REFERRAL_SOURCE_CHOICES on the backend.
export const REFERRAL_SOURCE_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'internet', label: 'Интернет (поиск)' },
  { value: 'word_of_mouth', label: 'Сарафанное радио' },
  { value: 'other', label: 'Другое' },
];

export const PAGE_SIZE = 50;
