"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  Mic, MicOff, Play, Square, Save, Clock, MapPin,
  User, FileText, Activity, Stethoscope, Pill, ClipboardList,
  Sparkles, ChevronLeft, AlertTriangle, Plus, X, CheckCircle,
} from "lucide-react";
import { useDeepgram } from "@/hooks/useDeepgram";
import AIConsultationReview from "@/app/video-call/doctor/components/AIConsultationReview";

interface OfflineConsultation {
  id: number;
  meeting_id: string;
  patient: number;
  patient_first_name: string;
  patient_last_name: string;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  complaints: string;
  anamnesis: string;
  diagnostics: string;
  treatment: string;
  diagnosis: string;
  session_notes: string | null;
  appointment_slot?: { consultation_type?: string; clinic?: number } | null;
}

interface ConsultationFormData {
  complaints: string;
  anamnesis: string;
  diagnostics: string;
  treatment: string;
  diagnosis: string;
  referrals: { name: string }[];
}

const EMPTY_FORM: ConsultationFormData = {
  complaints: "",
  anamnesis: "",
  diagnostics: "",
  treatment: "",
  diagnosis: "",
  referrals: [],
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type ConsultationTextField = "complaints" | "anamnesis" | "diagnostics" | "treatment" | "diagnosis";

const FIELDS_BEFORE = [
  {
    key: "complaints" as ConsultationTextField,
    label: "Жалобы пациента",
    placeholder: "Боли, симптомы, длительность...",
    icon: ClipboardList,
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "focus:border-rose-400 focus:ring-rose-100",
    rows: 3,
  },
  {
    key: "anamnesis" as ConsultationTextField,
    label: "Анамнез",
    placeholder: "История заболевания, перенесённые болезни, аллергии...",
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "focus:border-amber-400 focus:ring-amber-100",
    rows: 3,
  },
];

const FIELDS_AFTER = [
  {
    key: "treatment" as ConsultationTextField,
    label: "Лечение и рекомендации",
    placeholder: "Препараты, дозировки, режим приёма, рекомендации...",
    icon: Pill,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "focus:border-blue-400 focus:ring-blue-100",
    rows: 4,
  },
  {
    key: "diagnosis" as ConsultationTextField,
    label: "Диагноз",
    placeholder: "Окончательный или предварительный диагноз по МКБ-10...",
    icon: Stethoscope,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "focus:border-emerald-400 focus:ring-emerald-100",
    rows: 2,
  },
];

function parseReferrals(sessionNotes: string | null): { name: string }[] {
  if (!sessionNotes) return [];
  try {
    const parsed = JSON.parse(sessionNotes);
    if (Array.isArray(parsed?.referrals)) return parsed.referrals;
  } catch {}
  return [];
}

export default function OfflineConsultationByMeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const router = useRouter();

  const [consultation, setConsultation] = useState<OfflineConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [formData, setFormData] = useState<ConsultationFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showNavGuard, setShowNavGuard] = useState(false);
  const [manualReferral, setManualReferral] = useState("");
  const pendingNavUrl = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const {
    transcript,
    isConnected: isMicActive,
    error: micError,
    startTranscription,
    stopTranscription,
    clearTranscript,
  } = useDeepgram();

  const fetchConsultation = useCallback(async () => {
    try {
      const { data } = await api.get<OfflineConsultation>(`/consultations/${meetingId}/`);
      setConsultation(data);
      setFormData({
        complaints: data.complaints || "",
        anamnesis: data.anamnesis || "",
        diagnostics: data.diagnostics || "",
        treatment: data.treatment || "",
        diagnosis: data.diagnosis || "",
        referrals: parseReferrals(data.session_notes),
      });
      if (data.started_at && !data.ended_at) {
        startTimeRef.current = new Date(data.started_at).getTime();
      }
      if (data.duration_seconds) setElapsed(data.duration_seconds);
    } catch {
      toast.error("Не удалось загрузить приём");
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => { fetchConsultation(); }, [fetchConsultation]);

  useEffect(() => {
    if (consultation?.status !== "ongoing" || !startTimeRef.current) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [consultation?.status]);

  useEffect(() => {
    if (consultation?.status !== "ongoing") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [consultation?.status]);

  useEffect(() => {
    if (consultation?.status !== "ongoing") return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      pendingNavUrl.current = href;
      setShowNavGuard(true);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [consultation?.status]);

  const handleNavConfirm = () => {
    setShowNavGuard(false);
    if (pendingNavUrl.current) router.push(pendingNavUrl.current);
    else router.back();
  };

  const handleUpdate = (field: keyof ConsultationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddManualReferral = () => {
    const name = manualReferral.trim();
    if (!name) return;
    setFormData(prev => ({ ...prev, referrals: [...prev.referrals, { name }] }));
    setManualReferral("");
  };

  const handleRemoveReferral = (index: number) => {
    setFormData(prev => ({ ...prev, referrals: prev.referrals.filter((_, i) => i !== index) }));
  };

  const handleAIApply = (fields: Record<string, string>) => {
    Object.entries(fields).forEach(([k, v]) => {
      if (v && k in formData) handleUpdate(k as keyof ConsultationFormData, v);
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.patch(`/consultations/${meetingId}/`, {
        complaints: formData.complaints,
        anamnesis: formData.anamnesis,
        diagnostics: formData.diagnostics,
        treatment: formData.treatment,
        diagnosis: formData.diagnosis,
        session_notes: formData.referrals.length > 0
          ? JSON.stringify({ referrals: formData.referrals })
          : null,
      });
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }, [meetingId, formData]);

  const handleStart = async () => {
    try {
      await api.post(`/consultations/${meetingId}/status/`, { status: "ongoing" });
      const { data } = await api.get<OfflineConsultation>(`/consultations/${meetingId}/`);
      setConsultation(data);
      if (data.started_at) startTimeRef.current = new Date(data.started_at).getTime();
      toast.success("Консультация начата");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при старте");
    }
  };

  const handleEnd = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopTranscription();
      await handleSave();
      await api.post(`/consultations/${meetingId}/status/`, { status: "completed" });
      const { data } = await api.get<OfflineConsultation>(`/consultations/${meetingId}/`);
      setConsultation(data);
      if (data.duration_seconds) setElapsed(data.duration_seconds);
      toast.success("Консультация завершена");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при завершении");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <p className="text-gray-500">Приём не найден</p>
        <Link href="/doctor/consultations" className="text-blue-600 hover:underline text-sm">
          ← Назад к консультациям
        </Link>
      </div>
    );
  }

  const isOngoing = consultation.status === "ongoing";
  const isCompleted = consultation.status === "completed";
  const isPending = !isOngoing && !isCompleted;
  const patientName = [consultation.patient_first_name, consultation.patient_last_name].filter(Boolean).join(" ") || "Пациент";

  return (
    <div className="min-h-screen bg-gray-50 -mx-3 -mt-4 -mb-3">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => {
              if (isOngoing) {
                pendingNavUrl.current = null;
                setShowNavGuard(true);
              } else {
                router.back();
              }
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="w-px h-5 bg-gray-200" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {patientName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{patientName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Приём в клинике
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${isOngoing ? "text-emerald-500" : "text-gray-400"}`} />
            <span className={`text-base font-mono font-bold tabular-nums ${isOngoing ? "text-emerald-600" : "text-gray-400"}`}>
              {formatDuration(elapsed)}
            </span>
          </div>

          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            isOngoing
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isCompleted
              ? "bg-gray-100 text-gray-500 border-gray-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isOngoing ? "В процессе" : isCompleted ? "Завершена" : "Ожидание"}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>

            {isPending && (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-sm shadow-emerald-200 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Начать приём
              </button>
            )}
            {isOngoing && (
              <button
                onClick={handleEnd}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 rounded-lg shadow-sm shadow-red-200 transition-all"
              >
                <Square className="w-3.5 h-3.5" />
                Завершить
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex gap-0 min-h-[calc(100vh-57px)]">

        {/* ── Left sidebar ── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-white p-5 space-y-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Информация о приёме</p>
            <div className="space-y-2.5">
              {[
                { label: "Пациент", value: patientName, icon: User },
                {
                  label: "Время", icon: Clock,
                  value: consultation.scheduled_at
                    ? new Date(consultation.scheduled_at).toLocaleString("ru-KZ", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })
                    : "—",
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                  <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isCompleted && consultation.duration_seconds && (
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400">Длительность приёма</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">
                {Math.floor(consultation.duration_seconds / 60)} мин {consultation.duration_seconds % 60} сек
              </p>
            </div>
          )}

          <div className="w-full h-px bg-gray-100" />

          {/* Voice transcription */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Запись голоса</p>

            {isPending && (
              <p className="text-xs text-gray-400 text-center py-3">Доступно после начала приёма</p>
            )}

            {!isPending && (
              <div className="space-y-2">
                <button
                  onClick={() => isMicActive ? stopTranscription() : startTranscription()}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isMicActive
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  {isMicActive
                    ? <><MicOff className="w-4 h-4" /><span>Остановить</span><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /></>
                    : <><Mic className="w-4 h-4" /><span>Начать запись</span></>
                  }
                </button>

                {micError && <p className="text-xs text-red-500 px-1">{micError}</p>}

                {transcript && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Транскрипция</span>
                      <button onClick={clearTranscript} className="text-[10px] text-gray-400 hover:text-gray-600">Очистить</button>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed max-h-40 overflow-y-auto">{transcript}</p>
                  </div>
                )}

                {!transcript && !isMicActive && (
                  <p className="text-xs text-gray-400 text-center py-2">Речь врача появится здесь</p>
                )}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-100" />

          <button
            onClick={() => setShowAI(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 shadow-sm shadow-blue-200 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            ИИ Анализ
          </button>
        </aside>

        {/* ── Main form area ── */}
        <main className="flex-1">
          <div className="flex flex-col divide-y divide-gray-200">
            {FIELDS_BEFORE.map(({ key, label, placeholder, icon: Icon, color, bg, border, rows }) => (
              <div key={key} className="bg-white overflow-hidden">
                <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                </div>
                <textarea
                  value={formData[key]}
                  onChange={e => handleUpdate(key, e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  className={`w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border border-transparent focus:outline-none focus:ring-2 transition-all ${border}`}
                />
              </div>
            ))}

            {/* Диагностика и направления */}
            <div className="bg-white overflow-hidden">
              <div className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-gray-100 bg-cyan-50">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-semibold text-gray-800">Диагностика и направления</span>
                  {formData.referrals.length > 0 && (
                    <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
                      {formData.referrals.length} направл.
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={formData.diagnostics}
                onChange={e => handleUpdate("diagnostics", e.target.value)}
                placeholder="Обследования, анализы, результаты..."
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border border-transparent focus:outline-none focus:ring-2 focus:border-cyan-400 focus:ring-cyan-100 transition-all"
              />

              {formData.referrals.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-gray-50 pt-2">
                  {formData.referrals.map((ref, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-xl px-3 py-1.5">
                      <span className="font-medium">{ref.name}</span>
                      <button onClick={() => handleRemoveReferral(i)} className="ml-0.5 text-cyan-400 hover:text-cyan-700 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="Добавить направление вручную..."
                  value={manualReferral}
                  onChange={e => setManualReferral(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddManualReferral(); }}
                  className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all"
                />
                <button
                  onClick={handleAddManualReferral}
                  disabled={!manualReferral.trim()}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
              </div>
            </div>

            {FIELDS_AFTER.map(({ key, label, placeholder, icon: Icon, color, bg, border, rows }) => (
              <div key={key} className="bg-white overflow-hidden">
                <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                </div>
                <textarea
                  value={formData[key]}
                  onChange={e => handleUpdate(key, e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  className={`w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border border-transparent focus:outline-none focus:ring-2 transition-all ${border}`}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 border-t border-gray-200">
            Данные сохраняются вручную — нажмите «Сохранить» в шапке
          </p>
        </main>
      </div>

      {showAI && (
        <AIConsultationReview
          patientName={patientName}
          initialDescription={transcript ?? ""}
          onApply={handleAIApply}
          onClose={() => setShowAI(false)}
        />
      )}

      {showNavGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Покинуть приём?</h3>
                <p className="text-sm text-gray-500 mt-1">Приём ещё активен. Несохранённые данные будут потеряны.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNavGuard(false)}
                className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Остаться
              </button>
              <button
                onClick={handleNavConfirm}
                className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Покинуть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
