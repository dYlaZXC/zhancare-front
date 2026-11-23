"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Props {
  symptomSlug?: string;
  specialistSlug?: string;
  prefillText?: string;
}

export function AiTriageWidget({ symptomSlug, specialistSlug, prefillText = "" }: Props) {
  const [symptoms, setSymptoms] = useState(prefillText);
  const router = useRouter();
  const { user, setIsAuthOpen } = useAuth();

  const handleStart = () => {
    const text = symptoms.trim();
    if (!text) return;

    if (!user) {
      // Save intent so we can restore it after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("triage_symptom_prefill", text);
        if (symptomSlug) sessionStorage.setItem("triage_symptom_slug", symptomSlug);
        if (specialistSlug) sessionStorage.setItem("triage_specialist_slug", specialistSlug);
      }
      setIsAuthOpen(true);
      return;
    }

    const params = new URLSearchParams({ q: text });
    if (specialistSlug) params.set("specialist", specialistSlug);
    router.push(`/consultation/symptoms?${params.toString()}`);
  };

  return (
    <div className="bg-gradient-to-br from-[#3772ff] to-[#29358f] rounded-2xl p-6 md:p-8 text-white">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" aria-hidden>🤖</span>
        <h2 className="text-lg md:text-xl font-bold">AI-триаж — найдите нужного врача</h2>
      </div>
      <p className="text-blue-100 text-sm mb-5">
        Опишите симптомы — ИИ определит специализацию и предложит доступных врачей вашей клиники.
      </p>

      <textarea
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Например: болит голова уже 3 дня, особенно в висках, тошнота по утрам..."
        rows={3}
        className="w-full rounded-xl px-4 py-3 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400"
      />

      <button
        onClick={handleStart}
        disabled={!symptoms.trim()}
        className="mt-3 w-full bg-white text-[#3772ff] font-semibold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm md:text-base"
      >
        Найти врача →
      </button>

      <p className="text-xs text-blue-200 mt-3 text-center">
        Бесплатно · Без регистрации для начала · Результат за 10 секунд
      </p>
    </div>
  );
}
