export interface User {
  id: string;
  avatar?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
  roles?: string[];
  profiles?: Record<string, Record<string, unknown>>;

  // Personal details
  birth_date?: string;
  gender?: "male" | "female" | "other";
  gender_display?: string;
  address?: string;
  city?: string;
  language?: "kz" | "ru" | "en" | "other";
  language_display?: string;
  citizenship?: string;
  marital_status?: "single" | "married" | "divorced" | "widowed";
  marital_status_display?: string;
  profession?: string;

  // Medical details
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  blood_type_display?: string;
  rhesus_factor?: "positive" | "negative";
  rhesus_factor_display?: string;
  fluorography_status?: "normal" | "abnormal" | "pending" | "expired";
  fluorography_status_display?: string;
  fluorography_date?: string;
  immunization_status?: "up_to_date" | "partial" | "expired" | "none";
  immunization_status_display?: string;
  immunization_date?: string;

  // Doctor specific
  doctor_type?: string;

  // Timestamps
  date_joined?: string;
}

export interface Consultation {
  id: number;
  created_at: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string;
}

export interface Appointment {
  id: number;
  appointment_time: string;
  doctor_name: string;
  status: 'completed' | 'scheduled' | 'cancelled';
}