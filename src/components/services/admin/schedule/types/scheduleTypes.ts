/**
 * TypeScript interfaces for schedule management
 */

export interface ScheduleEvent {
  id: string;
  type: 'consultation' | 'appointment';
  patient_id: number;
  patient_name: string;
  doctor_id?: number;
  doctor_name?: string;
  nurse_id?: number;
  nurse_name?: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  address?: string;
  specialization?: string;
  notes?: string;
}

export type ViewMode = 'week' | 'month' | 'doctors';

export type FilterType = 'all' | 'consultation' | 'appointment';

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
