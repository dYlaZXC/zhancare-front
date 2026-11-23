/**
 * TypeScript interfaces for schedule management
 */

export type PaymentStatus = 'not_required' | 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentType = 'free' | 'pay_at_clinic' | 'full_prepay' | 'partial_prepay';

export interface PaymentHistoryEntry {
  old_status: string;
  new_status: string;
  note: string;
  created_at: string;
  changed_by: string;
}

export interface PaymentInfo {
  id?: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  amount_due: string;
  amount_paid: string;
  // The amount agreed at booking time, only meaningful for payment_type ===
  // 'partial_prepay' — distinct from amount_due (full price) and amount_paid
  // (actually collected so far).
  prepay_amount?: string;
  currency: string;
  notes?: string;
  history?: PaymentHistoryEntry[];
}

export interface ScheduleEvent {
  id: string;
  type: 'consultation' | 'appointment' | 'diagnostics' | 'class';
  // Group-class occurrence (type === 'class' only) — one event per
  // ClassSession, not per participant. patient_id/patient_name are still
  // populated (patient_id = the ClassSession's own id, patient_name = a
  // "Service (booked/capacity)" label) so every other event-list code path
  // that keys off those two fields keeps working unmodified.
  class_session_id?: number;
  instructor_names?: string;
  capacity?: number;
  booked_count?: number;
  consultation_type?: 'online' | 'offline';
  payment_info?: PaymentInfo | null;
  // Patient
  patient_id: number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_birth_date?: string;
  patient_gender?: string;
  // Doctor. For diagnostics events specifically, `doctor_*` is the
  // *referring* doctor (who ordered the test — may be nobody in
  // particular) and `performing_doctor_*` is who actually carries it
  // out (the service's own responsible doctor, snapshotted at booking
  // time) — two distinct roles, don't conflate them in the UI.
  doctor_id?: number;
  doctor_name?: string;
  doctor_phone?: string;
  doctor_email?: string;
  doctor_specialization?: string;
  doctor_years_of_experience?: number;
  doctor_room_number?: string | number | null;
  // Кабинет (clinic room) actually resolved/locked for this specific
  // offline appointment at booking time — see ClinicRoom/DoctorRoomAssignment.
  // Distinct from doctor_room_number above (a free-text, permanent label on
  // the doctor's profile, unrelated to any real booking): null here means
  // either the event isn't room-eligible (online/home/diagnostics) or it IS
  // offline but the doctor currently has no DoctorRoomAssignment covering
  // it — never fall back to doctor_room_number to fill this in, that would
  // contradict the "Без кабинета" worklist in RoomsScheduleContent.
  room_id?: number | null;
  room_name?: string | null;
  // Performing doctor (diagnostics only)
  performing_doctor_id?: number | null;
  performing_doctor_name?: string | null;
  performing_doctor_phone?: string | null;
  performing_doctor_email?: string | null;
  performing_doctor_specialization?: string | null;
  performing_doctor_years_of_experience?: number | null;
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
  // The event's own clinic timezone (IANA name or bare "+HH:MM" offset) —
  // `date`/`time` above are already rendered in it server-side, but this is
  // needed wherever the FRONTEND re-derives a date/time from a raw
  // timestamp elsewhere in the drawer (e.g. payment/reschedule history).
  // See src/utils/clinicTime.ts.
  clinic_timezone?: string | null;
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

export type FilterType = 'all' | 'consultation' | 'appointment' | 'diagnostics' | 'class';

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
