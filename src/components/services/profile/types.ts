export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  city?: string;
  gender?: string;
  language?: string;
  blood_type?: string;
  role?: string;
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