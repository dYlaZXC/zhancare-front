export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  city?: string;
  clinic?: { id: number; name: string };
}

export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  years_of_experience?: number;
  address?: string;
  city?: string;
  clinic?: { id: number; name: string };
  preferred_consultation_duration?: number;
  online_consultation_price?: string | null;
  offline_consultation_price?: string | null;
  online_work_schedule?: any;
  offline_work_schedule?: any;
  has_availability?: boolean;
}

export interface DiagService {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  duration_minutes: number;
  clinic_name: string;
  category: string | null;
  category_label: string | null;
  // The service's own responsible/performing doctor — who actually
  // carries this out, distinct from whoever refers a patient to it.
  doctor_id?: number | null;
  doctor_name?: string | null;
}

export interface DiagCategoryItem {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

export interface EventFormData {
  patient_id: string;
  doctor_id: string;
  referring_doctor_id: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
}

export type PaymentTypeOption = 'pay_at_clinic' | 'free' | 'full_prepay' | 'partial_prepay';

export type ConsultationType = 'online' | 'offline' | 'home' | 'diagnostics';

export interface CreatedInfo {
  meeting_id?: string;
  access_code?: string;
}

export interface DiagSlot {
  start: string;
  end: string;
  label: string;
  available: number | null;
}

export interface DoctorSlot {
  start: string;
  end: string;
  busy: boolean;
}
