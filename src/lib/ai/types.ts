export interface ClinicContext {
  clinicId: number;
  clinicSlug: string;
  agentName: string;
  welcomeMessage?: string;
  autoMessage?: string;
  primaryColor: string;
  logoUrl?: string;
  clinicName: string;
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
    city: string | null;
    rating: number | null;
  };
  language?: string;
  urgency: string;
  nearest_slot?: { date: string; time: string; label: string };
  reason?: string;
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
