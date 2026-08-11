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
  first_name: string;
  last_name: string;
  email: string;
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

  clinic?: { id: number; name: string } | null;
  clinic_created?: boolean;
  last_visit?: string | null;
  last_visit_type?: 'consultation' | 'appointment' | null;
  visits_count?: number;
}

export interface Clinic {
  id: number;
  name: string;
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
};

export const PAGE_SIZE = 50;
