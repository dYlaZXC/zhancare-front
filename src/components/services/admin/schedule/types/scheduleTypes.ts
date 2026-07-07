/**
 * TypeScript interfaces for schedule management
 */

export type PaymentStatus = 'not_required' | 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentType = 'free' | 'pay_at_clinic' | 'full_prepay' | 'partial_prepay';

export interface PaymentInfo {
  payment_type: PaymentType;
  status: PaymentStatus;
  amount_due: string;
  amount_paid: string;
  currency: string;
}

export interface ScheduleEvent {
  id: string;
  type: 'consultation' | 'appointment' | 'diagnostics';
  consultation_type?: 'online' | 'offline';
  payment_info?: PaymentInfo | null;
  // Patient
  patient_id: number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_birth_date?: string;
  patient_gender?: string;
  // Doctor
  doctor_id?: number;
  doctor_name?: string;
  doctor_phone?: string;
  doctor_email?: string;
  doctor_specialization?: string;
  doctor_years_of_experience?: number;
  // Nurse (appointments only)
  nurse_id?: number;
  nurse_name?: string;
  nurse_phone?: string;
  nurse_email?: string;
  // Diagnostic service booking (diagnostics only)
  service_name?: string;
  category?: string;
  clinic_name?: string;
  // Scheduling
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  // Access (consultations)
  meeting_id?: string;
  access_code?: string;
  // Location (appointments / diagnostics)
  address?: string;
  notes?: string;
  reschedule_count?: number;
  reschedule_reason?: string;
}

export type ViewMode = 'week' | 'month' | 'doctors';

export type FilterType = 'all' | 'consultation' | 'appointment' | 'diagnostics';

export type FilterStatus = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Patient {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  date_of_birth?: string;
  birth_date?: string; // Alternative field name
  gender?: string;
  clinic_name?: string;
  clinic?: { id: number; name: string };
}

export interface Doctor {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  preferred_consultation_duration?: number;
  online_work_schedule?: any; // Work schedule object
  schedule_type?: 'weekly' | 'constant'; // Недельное или Постоянное
  years_of_experience?: number;
  address?: string;
  city?: string;
  clinic_name?: string;
  clinic?: { id: number; name: string };
}

export interface Nurse {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  specialization?: string;
  years_of_experience?: number;
  address?: string;
  city?: string;
  clinic_name?: string;
  clinic?: { id: number; name: string };
}

export interface TimeSlot {
  time: string;
  available: boolean;
  doctor_id?: number;
}
