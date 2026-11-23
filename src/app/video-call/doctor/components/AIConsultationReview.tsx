"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Loader2, ChevronRight, CheckCircle2,
  MessageSquare, History, FlaskConical, Pill, Stethoscope,
  ClipboardList, BookOpen, StickyNote, AlertCircle, FileText,
  Maximize2, Minimize2,
} from "lucide-react";
import type { ConsultationFormSection } from "@/types/consultation";

// Icon per well-known legacy key — anything else (a clinic's custom section)
// falls back to a generic document icon.
const SECTION_ICONS: Record<string, any> = {
  complaints: MessageSquare,
  anamnesis: History,
  diagnostics: FlaskConical,
  diagnosis: Stethoscope,
  treatment: Pill,
  prescription: ClipboardList,
  recommendations: BookOpen,
  session_notes: StickyNote,
};

interface AIConsultationReviewProps {
  // Real doctor flow: resolves sections + patient facts server-side from the
  // saved source record — required unless previewMode is set.
  sourceType?: "consultation" | "clinic_appointment";
  sourceId?: number;
  // Admin template-constructor flow: no saved source exists yet, so sections
  // are sent directly to the admin-only preview endpoint instead (see
  // analyze_consultation_preview on the backend — safe there specifically
  // because it's the admin's own template and no real patient is involved).
  previewMode?: boolean;
  templateSections: ConsultationFormSection[];
  patientName?: string;
  initialDescription?: string;
  onApply: (fields: Record<string, string>) => void;
  onClose: () => void;
}

export default function AIConsultationReview({
  sourceType, sourceId, previewMode = false, templateSections: allTemplateSections, patientName, initialDescription = "", onApply, onClose,
}: AIConsultationReviewProps) {
  // The AI never fills diagnostics_referral sections (no grounded knowledge
  // of the clinic's real service catalog — see analyze_consultation on the
  // backend, which excludes them from the prompt the same way) — so this
  // checklist only ever shows the text sections it can actually fill.
  const templateSections = allTemplateSections.filter(s => (s.type || "text") === "text");
  const [step, setStep] = useState<"input" | "review">("input");
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filledCount = Object.values(fields).filter(v => v && v.trim()).length;

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { api } = await import("@/utils/api");
      const res = previewMode
        ? await api.post("/chat/analyze-consultation-preview/", {
            sections: templateSections,
            description,
          })
        : await api.post("/chat/analyze-consultation/", {
            source_type: sourceType,
            source_id: sourceId,
            description,
          });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      const normalized = Object.fromEntries(
        Object.entries(data.result).map(([k, v]) => [k, typeof v === 'string' ? v : ''])
      );
      setFields(normalized);
      setStep("review");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Не удалось проанализировать");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    const nonEmpty = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v && v.trim())
    );
    onApply(nonEmpty);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          layout
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ layout: { duration: 0.35, ease: [0.32, 0.72, 0, 1] }, default: { duration: 0.2 } }}
          className={`relative flex flex-col overflow-hidden shadow-2xl ${
            isFullscreen ? "w-full h-full" : "w-full max-w-2xl max-h-[90vh]"
          }`}
          style={{
            background: "#1a2035",
            border: "1px solid #283353",
            borderRadius: isFullscreen ? 0 : 16,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1e2d50, #2956bf)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">ИИ Анализ консультации</p>
                <p className="text-blue-300 text-[11px]">
                  {step === "input" ? "Опишите ситуацию — ИИ заполнит карту" : `${filledCount} из ${templateSections.length} полей заполнено`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsFullscreen(f => !f)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={isFullscreen ? "Свернуть" : "Развернуть на весь экран"}
              >
                {isFullscreen
                  ? <Minimize2 className="w-4 h-4 text-white/60" />
                  : <Maximize2 className="w-4 h-4 text-white/60" />
                }
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#283353" }}>
            {["Описание", "Проверка и подтверждение"].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                  (i === 0 && step === "input") || (i === 1 && step === "review")
                    ? "bg-blue-600 text-white"
                    : "text-white/30"
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    (i === 0 && step === "review") ? "bg-emerald-500 text-white" : "bg-white/10"
                  }`}>
                    {i === 0 && step === "review" ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </span>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {step === "input" ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2 block">
                    Свободное описание пациента и осмотра
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={`Например: Пациент ${patientName ?? ""} 35 лет, жалуется на головную боль в затылочной области 3 дня, давление 150/95, принимал анальгин без эффекта. При осмотре — незначительная отёчность. Назначил эналаприл 10мг...`}
                    rows={isFullscreen ? 20 : 8}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    style={{ background: "#202942", border: "1px solid #283353" }}
                  />
                  <p className="text-white/30 text-[11px] mt-2">
                    Можно использовать расшифровку речи или свободный текст — ИИ структурирует всё сам
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-xs">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 space-y-3">
                <p className="text-white/40 text-xs mb-1">Проверьте и отредактируйте поля при необходимости</p>
                {templateSections.map(({ key, label, placeholder }) => {
                  const Icon = SECTION_ICONS[key] || FileText;
                  return (
                    <div key={key} className="rounded-xl overflow-hidden" style={{ border: "1px solid #283353" }}>
                      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "#202942" }}>
                        <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</span>
                        {fields[key] && (
                          <span className="ml-auto">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <textarea
                        value={fields[key] ?? ""}
                        onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder || `${label}...`}
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none"
                        style={{ background: "#1a2035", borderTop: "1px solid #283353" }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: "#283353", background: "#161d30" }}>
            {step === "input" ? (
              <>
                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/70 transition-colors">
                  Отмена
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!description.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #2956bf, #3772ff)" }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Анализирую...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Анализировать</>
                  )}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep("input")}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/70 transition-colors">
                  ← Назад
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Применить ({filledCount} полей)
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
