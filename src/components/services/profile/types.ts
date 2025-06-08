export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Consultation {
  id: number;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty?: string;
  created_at: string;
}

export interface HomeAppointment {
  id: number;
  doctor_name: string;
  appointment_time: string;
  status: string;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}
