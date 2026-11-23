export interface QuickLink {
  label: string;
  message: string;
}

export interface ClinicContext {
  clinicId: number;
  clinicSlug: string;
  agentName: string;
  welcomeMessage?: string;
  autoMessage?: string;
  primaryColor: string;
  logoUrl?: string;
  clinicName: string;
  quickLinks?: QuickLink[];
}

export interface DoctorRecommendation {
  id: number;
  name: string;
  specialization?: { ru: string; en: string; kz: string };
  doctor_type?: string;
  email: string;
  phone?: string;
  years_of_experience?: number;
  rating?: number;
  clinic?: {
    name: string;
    address: string;
    address_comment?: string;
    city: string | null;
    rating: number | null;
    gis2_url?: string;
    lat?: number | null;
    lng?: number | null;
    distance_km?: number | null;
  };
  room_number?: string | null;
  language?: string;
  urgency: string;
  nearest_slot?: { date: string; time: string; label: string };
  reason?: string;
  online_consultation_price?: number | null;
  offline_consultation_price?: number | null;
  online_payment_preference?: "pay_at_clinic" | "full_prepay" | "partial_prepay" | null;
  offline_payment_preference?: "pay_at_clinic" | "full_prepay" | "partial_prepay" | null;
  online_prepay_percent?: number | null;
  offline_prepay_percent?: number | null;
}

export interface DiagnosticsServiceSchedule {
  weekday: number; // 0=Monday .. 6=Sunday
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_active: boolean;
}

export interface DiagnosticsServiceItem {
  id: number;
  name: string;
  description?: string | null;
  price?: string | null;
  duration_minutes: number;
  category: string;
  category_label: string;
  clinic_name: string;
  schedules?: DiagnosticsServiceSchedule[];
}

export interface SymptomAnalysisRequest {
  symptoms: string;
  language?: string;
  clinicSlug?: string;
}

export interface SymptomAnalysisResult {
  success: boolean;
  injectionBlocked?: boolean;
  error?: string;
  recommendedDoctor?: DoctorRecommendation;
  alternativeDoctors?: DoctorRecommendation[];
  fallbackUsed?: boolean;
  requestedSpecialty?: string;
  aiData?: { specialty: string; reason: string; urgency: string };
  aiRecommendationId?: number;
}
