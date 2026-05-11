/**
 * Central AI service — all AI-related API calls go through here.
 * Components import from this file, never call fetch() directly for AI.
 */

import { isInjectionAttempt } from "./injectionGuard";
import type {
  SymptomAnalysisRequest,
  SymptomAnalysisResult,
  DoctorRecommendation,
} from "./types";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// Centralised chat endpoint — all Mistral calls go through Django, not Next.js proxy
export const CHAT_ENDPOINT = `${API}/chat/`;
export const CHAT_UPLOAD_ENDPOINT = `${API}/chat/upload-image/`;

const INJECTION_BLOCKED: Record<string, string> = {
  ru: "Я медицинский ассистент и не могу изменить свою роль. Пожалуйста, опишите ваши симптомы — я помогу подобрать врача.",
  en: "I'm a medical assistant and cannot change my role. Please describe your symptoms so I can help you find the right doctor.",
  kz: "Мен медициналық көмекшімін және рөлімді өзгерте алмаймын. Симптомдарыңызды сипаттаңыз.",
};

export const aiService = {
  /**
   * Analyse symptoms and return a doctor recommendation.
   * Handles:
   *   - client-side injection guard (before network call)
   *   - parallel fetch of alternatives
   *   - backend injection_blocked response
   *   - merging alternative_doctors from both sources
   */
  async analyzeSymptoms(
    req: SymptomAnalysisRequest
  ): Promise<SymptomAnalysisResult> {
    const lang = req.language ?? "ru";

    if (isInjectionAttempt(req.symptoms)) {
      return {
        success: false,
        injectionBlocked: true,
        error: INJECTION_BLOCKED[lang] ?? INJECTION_BLOCKED.ru,
      };
    }

    const [recRes, altRes] = await Promise.all([
      fetch(`${API}/consultations/ai-recommend/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          symptoms: req.symptoms,
          language: lang,
          ...(req.clinicSlug ? { clinic_slug: req.clinicSlug } : {}),
        }),
      }),
      fetch(`${API}/consultations/get-random-doctors/`, {
        credentials: "include",
      }),
    ]);

    if (!recRes.ok) throw new Error(`AI API error: ${recRes.status}`);

    const raw = await recRes.json();
    const altRaw = altRes.ok ? await altRes.json() : null;

    if (raw.injection_blocked) {
      return { success: false, injectionBlocked: true, error: raw.error };
    }

    // Merge alternatives: prefer ranked list from ai-recommend, fall back to random
    const alternativeDoctors: DoctorRecommendation[] = raw.alternative_doctors
      ?.length
      ? raw.alternative_doctors
      : altRaw?.success && altRaw?.doctors
      ? (altRaw.doctors as DoctorRecommendation[])
          .filter((d) => d.id !== raw.recommended_doctor?.id)
          .slice(0, 3)
      : [];

    return {
      success: raw.success,
      error: raw.error,
      recommendedDoctor: raw.recommended_doctor,
      alternativeDoctors,
      fallbackUsed: raw.fallback_used,
      requestedSpecialty: raw.requested_specialty,
      aiData: raw.ai_data,
      aiRecommendationId: raw.ai_recommendation_id,
    };
  },

  /** Fetch a random selection of available doctors (used for "show other doctors"). */
  async getRandomDoctors(): Promise<DoctorRecommendation[]> {
    const res = await fetch(`${API}/consultations/get-random-doctors/`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? (data.doctors as DoctorRecommendation[]) : [];
  },

  /** Fetch available offline doctors sorted by distance to the patient's coordinates. */
  async getNearbyOfflineDoctors(
    lat: number,
    lng: number,
    specialty?: string
  ): Promise<DoctorRecommendation[]> {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (specialty) params.set("specialty", specialty);
    const res = await fetch(
      `${API}/consultations/nearby-doctors/?${params.toString()}`,
      { credentials: "include" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? (data.doctors as DoctorRecommendation[]) : [];
  },
};
