"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Loader2, ChevronRight, CheckCircle2,
  MessageSquare, History, FlaskConical, Pill, Stethoscope,
  ClipboardList, BookOpen, StickyNote, AlertCircle,
  Maximize2, Minimize2,
} from "lucide-react";

interface AIFields {
  complaints: string;
  anamnesis: string;
  diagnostics: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  recommendations: string;
  session_notes: string;
}

interface AIConsultationReviewProps {
  patientName?: string;
  initialDescription?: string;
  onApply: (fields: Partial<AIFields>) => void;
  onClose: () => void;
}

const FIELD_META: { key: keyof AIFields; label: string; icon: any; placeholder: string }[] = [
  { key: "complaints",     label: "Жалобы",             icon: MessageSquare,  placeholder: "Жалобы пациента..." },
  { key: "anamnesis",      label: "Анамнез",             icon: History,        placeholder: "История болезни..." },
  { key: "diagnostics",    label: "Диагностика",         icon: FlaskConical,   placeholder: "Обследования и анализы..." },
  { key: "diagnosis",      label: "Диагноз (МКБ-10)",   icon: Stethoscope,    placeholder: "Диагноз..." },
  { key: "treatment",      label: "Лечение",             icon: Pill,           placeholder: "Назначения..." },
  { key: "prescription",   label: "Рецепт",              icon: ClipboardList,  placeholder: "Препараты для выписки..." },
  { key: "recommendations",label: "Рекомендации",        icon: BookOpen,       placeholder: "Рекомендации пациенту..." },
  { key: "session_notes",  label: "Заметки врача",       icon: StickyNote,     placeholder: "Заметки для следующего приёма..." },
];

const empty: AIFields = {
  complaints: "", anamnesis: "", diagnostics: "", diagnosis: "",
  treatment: "", prescription: "", recommendations: "", session_notes: "",
};

export default function AIConsultationReview({
  patientName, initialDescription = "", onApply, onClose,
}: AIConsultationReviewProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<AIFields>(empty);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filledCount = Object.values(fields).filter(v => typeof v === 'string' && v.trim()).length;

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-consultation/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, patientName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "AI error");
      const normalized = Object.fromEntries(
        Object.entries(data.result).map(([k, v]) => [k, typeof v === 'string' ? v : ''])
      );
      setFields({ ...empty, ...normalized });
      setStep("review");
    } catch (err: any) {
      setError(err.message || "Не удалось проанализировать");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    const nonEmpty = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => typeof v === 'string' && v.trim())
    ) as Partial<AIFields>;
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`relative flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
            isFullscreen
              ? "w-full h-full rounded-none"
              : "w-full max-w-2xl max-h-[90vh] rounded-2xl"
          }`}
          style={{ background: "#1a2035", border: "1px solid #283353" }}
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
                  {step === "input" ? "Опишите ситуацию — ИИ заполнит карту" : `${filledCount} из ${FIELD_META.length} полей заполнено`}
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
                {FIELD_META.map(({ key, label, icon: Icon, placeholder }) => (
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
                      value={fields[key]}
                      onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={key === "diagnosis" ? 2 : 3}
                      className="w-full px-3 py-2.5 text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none"
                      style={{ background: "#1a2035", borderTop: "1px solid #283353" }}
                    />
                  </div>
                ))}
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
