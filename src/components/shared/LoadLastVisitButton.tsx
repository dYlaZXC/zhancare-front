"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { History, Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import type { ConsultationFormSection } from "@/types/consultation";

const THEMES = {
  light: { button: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" },
  dark: { button: "border text-[#ebf1ff] hover:brightness-125" },
} as const;
const DARK_SURFACE = { backgroundColor: "#202942", borderColor: "#2956bf" };

/**
 * "Загрузить прошлый приём" — for a repeat ("вторичный") patient, pulls the
 * doctor's own most recent COMPLETED visit with this same patient (video
 * consultation or in-clinic appointment, whichever is more recent) and
 * copies its text sections into the matching cells of the CURRENT template.
 *
 * Deliberately text-only, same as ConsultationFormPresetPicker: the
 * diagnostics_referral section's bookings belonged to that past visit's own
 * date/time and aren't meaningful to replay onto a new one, so that
 * section's key is always skipped here even if the backend snapshot
 * includes it.
 *
 * Deliberately scoped to visits with THIS SAME DOCTOR only (see
 * consultations/views.py::last_visit_form's own docstring) — a colleague's
 * visit with the same patient is never offered here.
 */
export function LoadLastVisitButton({
  patientId,
  excludeMeetingId,
  sections,
  hasContent,
  onApply,
  disabled = false,
  theme = "light",
}: {
  patientId?: number | null;
  /** The visit currently being documented — so it's never offered back to itself. */
  excludeMeetingId?: string | number | null;
  sections: ConsultationFormSection[];
  hasContent: boolean;
  onApply: (values: Record<string, string>) => void;
  disabled?: boolean;
  theme?: "light" | "dark";
}) {
  const [loading, setLoading] = useState(false);
  const dark = theme === "dark";
  const t = THEMES[theme];

  const handleClick = async () => {
    if (disabled || loading) return;
    if (!patientId) {
      toast.info("Пациент ещё не определён");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ patient_id: String(patientId) });
      if (excludeMeetingId) params.set("exclude_meeting_id", String(excludeMeetingId));
      const { data } = await api.get(`/consultations/last-visit-form/?${params.toString()}`);
      if (!data.found) {
        toast.info("У этого пациента ещё нет прошлых завершённых приёмов у вас");
        return;
      }
      const textKeys = new Set(
        sections.filter(s => (s.type || "text") !== "diagnostics_referral").map(s => s.key)
      );
      const remoteFormData: Record<string, unknown> = data.form_data || {};
      const patch: Record<string, string> = {};
      for (const [key, value] of Object.entries(remoteFormData)) {
        if (!textKeys.has(key)) continue;
        if (typeof value === "string" && value.trim()) patch[key] = value;
      }
      if (Object.keys(patch).length === 0) {
        toast.info("В прошлом приёме нет данных, подходящих для текущего шаблона");
        return;
      }
      const when = data.visited_at
        ? new Date(data.visited_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
        : "";
      const visitLabel = data.visit_type === "consultation" ? "видео-консультации" : "приёма в клинике";
      const confirmMsg =
        `Загрузить данные из прошлого приёма (${visitLabel}${when ? ` от ${when}` : ""})?` +
        (hasContent ? " Совпадающие поля будут перезаписаны." : "");
      if (!window.confirm(confirmMsg)) return;
      onApply(patch);
      toast.success("Данные прошлого приёма загружены");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось загрузить прошлый приём");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || !patientId}
      title="Загрузить консультативный лист последнего завершённого приёма этого пациента у вас"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${t.button}`}
      style={dark ? DARK_SURFACE : undefined}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
      Прошлый приём
    </button>
  );
}

export default LoadLastVisitButton;
