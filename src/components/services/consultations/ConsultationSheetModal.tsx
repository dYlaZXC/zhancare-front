"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  X, FileText, ClipboardList, NotebookText, Pill, ClipboardCheck,
  MessageSquare, FlaskConical, Loader2, Download,
} from "lucide-react";
import type { Consultation } from "@/types/consultation";

interface Referral {
  name: string;
  category_label?: string;
  price?: number | string | null;
  currency?: string | null;
  booked_at?: string;
}

interface SheetDocument {
  id: number;
  original_filename: string;
  download_url?: string | null;
  file_size?: number | null;
}

interface SheetData {
  patientName: string;
  dateLabel?: string;
  complaints?: string;
  anamnesis?: string;
  diagnostics?: string;
  treatment?: string;
  diagnosis?: string;
  sessionNotes?: string;
  prescription?: string;
  recommendations?: string;
  transcription?: string;
  referrals?: Referral[];
  description?: string;
  conclusion?: string;
  documents?: SheetDocument[];
}

type SheetMode = "consultation" | "clinic-offline" | "diagnostics";

const isBlank = (v?: string | null) => !v || v === "<null>";
const showOr = (v: string | undefined | null, fallback: string) => (isBlank(v) ? fallback : (v as string));

// Mirrors parseNotes() in src/app/doctor/appointments/[id]/offline/page.tsx —
// ClinicAppointment stores the whole form as one JSON-stringified `notes` blob.
function parseClinicNotes(raw: string | null): {
  complaints?: string; anamnesis?: string; diagnostics?: string;
  treatment?: string; diagnosis?: string; referrals: Referral[];
} {
  if (!raw) return { referrals: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...parsed, referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [] };
    }
  } catch {
    return { complaints: raw, referrals: [] };
  }
  return { referrals: [] };
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDateTime(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Read-only "Консультационный лист" for a doctor to review what was
 * documented — dispatches to the right endpoint/shape depending on how the
 * appointment was conducted (video/meetingId-offline Consultation record,
 * ClinicAppointment-based offline visit, or a diagnostics appointment).
 */
export default function ConsultationSheetModal({
  consultation,
  onClose,
}: {
  consultation: Consultation;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<SheetMode>("consultation");
  const [data, setData] = useState<SheetData | null>(null);
  const [activeTab, setActiveTab] = useState("main");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (consultation.type === "diagnostics" && consultation.diagnostics_appointment_id) {
          const { data: d } = await api.get(`/diagnostics/appointments/${consultation.diagnostics_appointment_id}/doctor-view/`);
          if (cancelled) return;
          setMode("diagnostics");
          setData({
            patientName: d.patient_name || consultation.patient_name || "Пациент",
            dateLabel: d.appointment_time,
            description: d.description,
            conclusion: d.conclusion,
            documents: d.documents,
          });
        } else if (consultation.type === "offline" && consultation.clinic_appointment_id) {
          const { data: d } = await api.get(`/clinic-appointments/${consultation.clinic_appointment_id}/`);
          if (cancelled) return;
          const parsed = parseClinicNotes(d.notes);
          setMode("clinic-offline");
          setData({
            patientName: d.patient_name || consultation.patient_name || "Пациент",
            dateLabel: d.appointment_time,
            ...parsed,
          });
        } else if (consultation.meeting_id) {
          const { data: d } = await api.get(`/consultations/${consultation.meeting_id}/`);
          if (cancelled) return;
          setMode("consultation");
          setData({
            patientName: [d.patient_first_name, d.patient_last_name].filter(Boolean).join(" ")
              || d.patient_name || consultation.patient_name || "Пациент",
            dateLabel: d.scheduled_at,
            complaints: d.complaints,
            anamnesis: d.anamnesis,
            diagnostics: d.diagnostics,
            treatment: d.treatment,
            diagnosis: d.diagnosis,
            sessionNotes: d.session_notes,
            prescription: d.prescription,
            recommendations: d.recommendations,
            transcription: d.transcription,
          });
        } else {
          setData(null);
        }
      } catch {
        if (!cancelled) {
          toast.error("Не удалось загрузить консультационный лист");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [consultation]);

  const tabs = mode === "diagnostics"
    ? [
        { id: "main", label: "Описание и заключение", icon: FlaskConical },
        { id: "documents", label: `Документы${data?.documents?.length ? ` (${data.documents.length})` : ""}`, icon: FileText },
      ]
    : mode === "clinic-offline"
    ? [
        { id: "main", label: "Консультационный лист", icon: ClipboardList },
        { id: "referrals", label: `Направления${data?.referrals?.length ? ` (${data.referrals.length})` : ""}`, icon: FlaskConical },
      ]
    : [
        { id: "main", label: "Консультационный лист", icon: ClipboardList },
        { id: "notes", label: "Заметки", icon: NotebookText },
        { id: "prescription", label: "Рецепт", icon: Pill },
        { id: "recommendations", label: "Рекомендации", icon: ClipboardCheck },
        ...(data?.transcription ? [{ id: "transcription", label: "Транскрипция", icon: MessageSquare }] : []),
      ];

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #3772ff 0%, #29358f 100%)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <FileText className="text-white w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">
                Консультационный лист{data ? `: ${data.patientName}` : ""}
              </h2>
              {data?.dateLabel && (
                <p className="text-sm text-white/80">{formatDateTime(data.dateLabel)}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="text-white w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center p-16">
              <FileText className="w-14 h-14 text-gray-300 mb-4" />
              <p className="text-gray-500">Не удалось загрузить данные</p>
            </div>
          ) : (
            <div>
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-5 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-5">
                {activeTab === "main" && mode !== "diagnostics" && (
                  <>
                    <SheetField icon={MessageSquare} color="text-rose-600" label="Жалобы пациента" value={data.complaints} empty="Не указано" />
                    <SheetField icon={NotebookText} color="text-amber-600" label="Анамнез" value={data.anamnesis} empty="Не указано" />
                    <SheetField icon={FlaskConical} color="text-cyan-600" label="Диагностика" value={data.diagnostics} empty="Не указано" />
                    <SheetField icon={Pill} color="text-blue-600" label="Лечение и рекомендации" value={data.treatment} empty="Не указано" />
                    <SheetField icon={ClipboardCheck} color="text-emerald-600" label="Диагноз" value={data.diagnosis} empty="Не указано" />
                  </>
                )}

                {activeTab === "notes" && (
                  <SheetField label="Заметки" value={data.sessionNotes} empty="Заметки отсутствуют" bare />
                )}
                {activeTab === "prescription" && (
                  <SheetField label="Рецепт" value={data.prescription} empty="Рецепт не выписан" bare />
                )}
                {activeTab === "recommendations" && (
                  <SheetField label="Рекомендации" value={data.recommendations} empty="Рекомендации отсутствуют" bare />
                )}
                {activeTab === "transcription" && (
                  <SheetField label="Транскрипция" value={data.transcription} empty="Транскрипция отсутствует" bare />
                )}

                {activeTab === "referrals" && (
                  data.referrals && data.referrals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {data.referrals.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-xl px-3 py-1.5">
                          {r.category_label && (
                            <span className="text-cyan-400 text-[10px] uppercase tracking-wide font-semibold">{r.category_label}</span>
                          )}
                          <span className="font-medium">{r.name}</span>
                          {r.booked_at && (
                            <span className="text-cyan-500">
                              — запись: {new Date(r.booked_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Направления не добавлены</p>
                  )
                )}

                {activeTab === "main" && mode === "diagnostics" && (
                  <>
                    <SheetField icon={FlaskConical} color="text-cyan-600" label="Описание" value={data.description} empty="Не указано" />
                    <SheetField icon={ClipboardCheck} color="text-emerald-600" label="Заключение" value={data.conclusion} empty="Не указано" />
                  </>
                )}

                {activeTab === "documents" && (
                  data.documents && data.documents.length > 0 ? (
                    <div className="space-y-1.5">
                      {data.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.download_url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                        >
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate flex-1">{doc.original_filename}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(doc.file_size)}</span>
                          <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Документы не прикреплены</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            Только для просмотра
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors text-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SheetField({
  icon: Icon, color, label, value, empty, bare,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  label: string;
  value?: string | null;
  empty: string;
  bare?: boolean;
}) {
  return (
    <div>
      {!bare && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className={`w-4 h-4 ${color ?? "text-gray-600"}`} />}
          <h3 className="font-semibold text-gray-900">{label}</h3>
        </div>
      )}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 whitespace-pre-wrap">{showOr(value, empty)}</p>
      </div>
    </div>
  );
}
