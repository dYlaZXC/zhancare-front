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
  Search, CalendarCheck, ChevronUp, PenLine, Loader2,
} from "lucide-react";
import { useDeepgram } from "@/hooks/useDeepgram";
import { useAuth } from "@/context/AuthContext";
import { aiService } from "@/lib/ai/aiService";
import { DiagnosticsServiceItem } from "@/lib/ai/types";
import AIConsultationReview from "@/app/video-call/doctor/components/AIConsultationReview";
import { SignatureModal } from "@/components/shared/SignatureModal";
import { ConsultationTemplatePicker, TEMPLATE_SWITCH_CONFIRM } from "@/components/shared/ConsultationTemplatePicker";
import { ConsultationFormPresetPicker } from "@/components/shared/ConsultationFormPresetPicker";
import { LoadLastVisitButton } from "@/components/shared/LoadLastVisitButton";
import type { ConsultationFormSection } from "@/types/consultation";

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
  appointment_slot?: { consultation_type?: string; clinic?: number } | null;
  // Which sections render, and in what order — the clinic's/doctor's active
  // template, fixed on this record once anything is saved (see backend
  // ensure_consultation_template_snapshot).
  template_snapshot?: { id?: number | null; name?: string; selected?: boolean; sections: ConsultationFormSection[] } | null;
  // Keyed by section — a text section's value is a string, a
  // diagnostics_referral section's value is {comment, referrals}.
  form_data?: Record<string, unknown>;
}

// Catalog-sourced referrals carry `serviceId` (used for dedup and to upgrade
// an already-added referral in place when it gets booked); manually typed
// referrals have neither.
interface DiagnosticReferral {
  serviceId?: number;
  name: string;
  categoryLabel?: string;
  price?: string | null;
  bookedAt?: string;
  appointmentId?: number;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Icon/color per well-known legacy key, purely cosmetic — anything else (a
// clinic's custom section) falls back to the generic style below. The
// diagnostics_referral section isn't listed: it always gets the special
// combined block with the referral catalog, never this generic textarea.
const SECTION_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  complaints: { icon: ClipboardList, color: "text-rose-500", bg: "bg-rose-50", border: "focus:border-rose-400 focus:ring-rose-100" },
  anamnesis: { icon: FileText, color: "text-amber-500", bg: "bg-amber-50", border: "focus:border-amber-400 focus:ring-amber-100" },
  treatment: { icon: Pill, color: "text-blue-500", bg: "bg-blue-50", border: "focus:border-blue-400 focus:ring-blue-100" },
  diagnosis: { icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-50", border: "focus:border-emerald-400 focus:ring-emerald-100" },
};
const DEFAULT_SECTION_STYLE = { icon: FileText, color: "text-gray-500", bg: "bg-gray-50", border: "focus:border-gray-400 focus:ring-gray-100" };
const getSectionStyle = (key: string) => SECTION_STYLE[key] || DEFAULT_SECTION_STYLE;

const isReferralSection = (section: ConsultationFormSection) => (section.type || "text") === "diagnostics_referral";

// Referrals are kept in this page's own camelCase shape; the backend stores
// (and validates) the snake_case wire shape inside the section's value.
function toWireReferral(r: DiagnosticReferral) {
  return {
    service_id: r.serviceId,
    name: r.name,
    category_label: r.categoryLabel,
    price: r.price ?? null,
    booked_at: r.bookedAt,
    appointment_id: r.appointmentId,
  };
}

function fromWireReferral(r: any): DiagnosticReferral {
  return {
    serviceId: r.service_id ?? undefined,
    name: r.name,
    categoryLabel: r.category_label,
    price: r.price ?? null,
    bookedAt: r.booked_at,
    appointmentId: r.appointment_id,
  };
}

export default function OfflineConsultationByMeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  // Prefer the clinic this specific booking is tied to; fall back to the
  // doctor's own clinic (already loaded onto the auth user via
  // GET /user-profile/profile/, no extra request needed).
  const doctorClinicId = (user as any)?.profiles?.doctor?.clinic?.id as number | undefined;

  const [consultation, setConsultation] = useState<OfflineConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [templateSections, setTemplateSections] = useState<ConsultationFormSection[]>([]);
  const [sectionValues, setSectionValues] = useState<Record<string, string>>({});
  const [referrals, setReferrals] = useState<DiagnosticReferral[]>([]);
  // At most one section is type="diagnostics_referral" in v1 (whatever the
  // clinic named it, or the legacy "diagnostics" fallback key) — it gets the
  // combined textarea + referral-catalog block, all others a plain textarea.
  const diagnosticsSection = templateSections.find(isReferralSection);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showNavGuard, setShowNavGuard] = useState(false);
  const [manualReferral, setManualReferral] = useState("");

  // Signed PDF report — same flow as the video-call consultation page.
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Diagnostics catalog + inline booking
  const [showServicePanel, setShowServicePanel] = useState(false);
  const [clinicServices, setClinicServices] = useState<DiagnosticsServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [bookingServiceId, setBookingServiceId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlots, setBookingSlots] = useState<{ start: string; end: string; label: string; available: number }[]>([]);
  const [bookingSlotsLoading, setBookingSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

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

  // Fill the form from the record. form_data can carry keys that aren't in the
  // template (for a record with nothing saved yet it is the legacy 8-field
  // mapping) — only the template's own sections are taken, otherwise the next
  // save would send unknown keys and be rejected.
  const applyLoadedForm = useCallback((data: OfflineConsultation) => {
    const sections = data.template_snapshot?.sections || [];
    setTemplateSections(sections);

    const formData = data.form_data || {};
    const diagSection = sections.find(isReferralSection);
    const values: Record<string, string> = {};
    for (const section of sections) {
      if (section === diagSection) continue;
      const value = formData[section.key];
      // Falls back to default_text (real, editable starting content), not
      // plain "" — same reasoning as FloatingConsultationButton.tsx.
      values[section.key] = typeof value === "string" ? value : (section.default_text || "");
    }

    if (diagSection) {
      const diagValue = formData[diagSection.key] as { comment?: unknown; referrals?: unknown[] } | string | undefined;
      const diagObject = diagValue && typeof diagValue === "object" ? diagValue : null;
      values[diagSection.key] = typeof diagObject?.comment === "string" ? diagObject.comment : "";
      setReferrals(Array.isArray(diagObject?.referrals) ? diagObject.referrals.map(fromWireReferral) : []);
    } else {
      setReferrals([]);
    }
    setSectionValues(values);
  }, []);

  // The doctor picked another template for this visit (see ConsultationTemplatePicker).
  // What is already in the form — including text typed but not yet saved — stays
  // as it is, and values the record has saved under the NEW template's own
  // sections (e.g. from before switching away) fill in whatever is still empty.
  const handleTemplateChanged = (record: OfflineConsultation) => {
    const sections = record.template_snapshot?.sections || [];
    const saved = record.form_data || {};
    setConsultation(prev => (prev ? { ...prev, template_snapshot: record.template_snapshot, form_data: record.form_data } : prev));
    setTemplateSections(sections);
    setSectionValues(prev => {
      const next = { ...prev };
      for (const section of sections) {
        if (next[section.key] !== undefined) continue;
        const value = saved[section.key] as { comment?: unknown } | string | undefined;
        next[section.key] = isReferralSection(section)
          ? (value && typeof value === "object" && typeof value.comment === "string" ? value.comment : "")
          : (typeof value === "string" ? value : (section.default_text || ""));
      }
      return next;
    });
    const diagSection = sections.find(isReferralSection);
    const savedDiag = diagSection ? (saved[diagSection.key] as { referrals?: unknown[] } | undefined) : undefined;
    if (savedDiag && Array.isArray(savedDiag.referrals)) {
      setReferrals(prev => (prev.length > 0 ? prev : savedDiag.referrals!.map(fromWireReferral)));
    }
  };

  const fetchConsultation = useCallback(async () => {
    try {
      const { data } = await api.get<OfflineConsultation>(`/consultations/${meetingId}/`);
      setConsultation(data);
      applyLoadedForm(data);
      if (data.started_at && !data.ended_at) {
        startTimeRef.current = new Date(data.started_at).getTime();
      }
      if (data.duration_seconds) setElapsed(data.duration_seconds);
    } catch {
      toast.error("Не удалось загрузить приём");
    } finally {
      setLoading(false);
    }
  }, [meetingId, applyLoadedForm]);

  useEffect(() => { fetchConsultation(); }, [fetchConsultation]);

  const clinicIdForServices = consultation?.appointment_slot?.clinic ?? doctorClinicId;

  useEffect(() => {
    if (!clinicIdForServices) {
      setClinicServices([]);
      return;
    }
    setServicesLoading(true);
    aiService
      .getDiagnosticsServices(clinicIdForServices)
      .then(setClinicServices)
      .catch(() => setClinicServices([]))
      .finally(() => setServicesLoading(false));
  }, [clinicIdForServices]);

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

  const handleUpdate = (key: string, value: string) => {
    setSectionValues(prev => ({ ...prev, [key]: value }));
  };

  const [addingManualReferral, setAddingManualReferral] = useState(false);

  const handleAddManualReferral = async () => {
    const name = manualReferral.trim();
    if (!name || !consultation) return;
    setAddingManualReferral(true);
    try {
      const { data } = await api.post<{ appointment: { id: number } }>("/diagnostics/appointments/", {
        service_name: name,
        source_type: "consultation",
        source_id: consultation.id,
      });
      setReferrals(prev => [...prev, { name, appointmentId: data?.appointment?.id }]);
      setManualReferral("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось добавить направление");
    } finally {
      setAddingManualReferral(false);
    }
  };

  const handleRemoveReferral = (index: number) => {
    const referral = referrals[index];
    if (referral?.appointmentId) {
      const confirmed = window.confirm(
        "Приём уже создан в системе. Удаление уберёт направление только из этого списка — сама запись на приём останется активной. Продолжить?"
      );
      if (!confirmed) return;
    }
    setReferrals(prev => prev.filter((_, i) => i !== index));
  };

  // Diagnostics catalog — filtering, add-without-booking, inline booking
  const canBookDiagnostics = Boolean(consultation?.patient && user?.id);

  const filteredServices = clinicServices.filter(s => {
    const matchCat = activeCategory === "all" || s.category === activeCategory;
    const q = serviceSearch.trim().toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const uniqueCategories = Array.from(
    new Map(clinicServices.map(s => [s.category, s.category_label])).entries()
  );

  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("ru-KZ", { weekday: "short", day: "numeric", month: "short" }),
    };
  });

  const [addingServiceId, setAddingServiceId] = useState<number | null>(null);

  const handleAddReferral = async (service: DiagnosticsServiceItem) => {
    if (referrals.some(r => r.serviceId === service.id) || !consultation) return;
    setAddingServiceId(service.id);
    try {
      const { data } = await api.post<{ appointment: { id: number } }>("/diagnostics/appointments/", {
        service_id: service.id,
        source_type: "consultation",
        source_id: consultation.id,
      });
      setReferrals(prev => [...prev, {
        serviceId: service.id,
        name: service.name,
        categoryLabel: service.category_label,
        price: service.price,
        appointmentId: data?.appointment?.id,
      }]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось добавить направление");
    } finally {
      setAddingServiceId(null);
    }
  };

  const openBooking = (service: DiagnosticsServiceItem) => {
    if (bookingServiceId === service.id) {
      setBookingServiceId(null);
      return;
    }
    setBookingServiceId(service.id);
    setBookingDate("");
    setBookingSlots([]);
    setSelectedSlot(null);
  };

  const fetchSlots = async (serviceId: number, date: string) => {
    setBookingDate(date);
    setSelectedSlot(null);
    setBookingSlots([]);
    setBookingSlotsLoading(true);
    try {
      const patientParam = consultation?.patient ? `&patient_id=${consultation.patient}` : "";
      const { data } = await api.get<{ slots: typeof bookingSlots }>(
        `/diagnostics/services/${serviceId}/available-slots/?date=${date}${patientParam}`
      );
      setBookingSlots(data.slots ?? []);
    } catch {
      setBookingSlots([]);
    } finally {
      setBookingSlotsLoading(false);
    }
  };

  const handleBook = async (service: DiagnosticsServiceItem) => {
    if (!selectedSlot || !canBookDiagnostics || !consultation) return;
    setBookingSubmitting(true);
    try {
      const { data } = await api.post<{ appointment: { id: number } }>("/diagnostics/appointments/", {
        service_id: service.id,
        patient_id: consultation.patient,
        // Referring doctor = the doctor running this appointment (drives
        // commission on the backend) — never an appointment/consultation PK.
        doctor_id: user?.id,
        scheduled_time: selectedSlot,
      });
      const appointmentId = data?.appointment?.id;
      const slotObj = bookingSlots.find(s => s.start === selectedSlot);
      const dateLabel = nextDays.find(d => d.iso === bookingDate)?.label ?? bookingDate;
      const timeLabel = slotObj?.label ?? selectedSlot;

      setReferrals(prev => {
        const existingIndex = prev.findIndex(r => r.serviceId === service.id);
        const bookedReferral: DiagnosticReferral = {
          serviceId: service.id,
          name: service.name,
          categoryLabel: service.category_label,
          price: service.price,
          bookedAt: selectedSlot,
          appointmentId,
        };
        if (existingIndex === -1) return [...prev, bookedReferral];
        // Already added without a booking — upgrade in place instead of duplicating.
        const next = [...prev];
        next[existingIndex] = bookedReferral;
        return next;
      });

      toast.success(`Записано: ${service.name} — ${dateLabel}, ${timeLabel}`);
      setBookingServiceId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при записи");
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Only this record's own template sections are taken; an empty AI value
  // never overwrites what the doctor already typed.
  const handleAIApply = (fields: Record<string, string>) => {
    const allowed = new Set(templateSections.map(s => s.key));
    setSectionValues(prev => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(fields)) {
        if (allowed.has(key) && value && value.trim()) next[key] = value;
      }
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Keyed strictly by the template's own sections — the backend rejects
      // unknown keys. The diagnostics_referral section nests its text and
      // referrals as {comment, referrals}, the wire shape it validates.
      const structuredData: Record<string, unknown> = {};
      for (const section of templateSections) {
        structuredData[section.key] = isReferralSection(section)
          ? { comment: sectionValues[section.key] || "", referrals: referrals.map(toWireReferral) }
          : sectionValues[section.key] || "";
      }
      await api.patch(`/consultations/${meetingId}/save-consultation-form/`, { structured_data: structuredData });
      toast.success("Сохранено");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }, [meetingId, templateSections, sectionValues, referrals]);

  // Server renders the PDF from the record's own saved structured_data (and
  // archives it to the patient's documents in the same request) via the same
  // generate-pdf endpoint the video-call flow uses — so the form is saved
  // first, otherwise the PDF would miss whatever was just typed.
  const generateAndUploadPdf = async (signature: string) => {
    if (!consultation) return;
    setGeneratingPdf(true);
    try {
      await handleSave();

      const response = await api.post(
        `/consultations/${meetingId}/generate-pdf/`,
        { signature },
        { responseType: "blob" }
      );
      const blob = response.data as Blob;
      const disposition = response.headers["content-disposition"] as string | undefined;
      const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : "consultation.pdf";

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename; a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success("PDF сформирован и сохранён в документы пациента");
    } catch {
      toast.error("Не удалось сформировать PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGeneratePdfClick = () => {
    if (signatureData) {
      generateAndUploadPdf(signatureData);
    } else {
      setShowSignatureModal(true);
    }
  };

  const handleSignatureSaved = (dataUrl: string) => {
    setSignatureData(dataUrl);
    setShowSignatureModal(false);
    generateAndUploadPdf(dataUrl);
  };

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
  const hasContent = referrals.length > 0 || Object.values(sectionValues).some(v => v && v.trim());

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

            <button
              onClick={handleGeneratePdfClick}
              disabled={generatingPdf || !hasContent}
              title={signatureData ? "Сформировать подписанный PDF" : "Подписать и сформировать PDF"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-blue-200 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              {generatingPdf
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <PenLine className="w-3.5 h-3.5" />}
              {generatingPdf ? "Формируется..." : "Сформировать PDF"}
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

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Шаблон листа</p>
            <ConsultationTemplatePicker
              basePath={`/consultations/${meetingId}`}
              currentTemplateId={consultation.template_snapshot?.id ?? null}
              currentTemplateName={consultation.template_snapshot?.name}
              selected={!!consultation.template_snapshot?.selected}
              disabled={isCompleted}
              confirmMessage={hasContent ? TEMPLATE_SWITCH_CONFIRM : null}
              onChanged={handleTemplateChanged}
            />
            <div className="mt-2 space-y-1.5">
              <ConsultationFormPresetPicker
                templateId={consultation.template_snapshot?.id ?? null}
                sections={templateSections}
                hasContent={hasContent}
                getCurrentValues={() => sectionValues}
                onApply={(values) => setSectionValues(prev => ({ ...prev, ...values }))}
                disabled={isCompleted}
              />
              <LoadLastVisitButton
                patientId={consultation.patient}
                excludeMeetingId={meetingId}
                sections={templateSections}
                hasContent={hasContent}
                onApply={(values) => setSectionValues(prev => ({ ...prev, ...values }))}
                disabled={isCompleted}
              />
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
            {templateSections.map(section => isReferralSection(section) ? (
            <div key={section.key} className="bg-white overflow-hidden">
              <div className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-gray-100 bg-cyan-50">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-semibold text-gray-800">{section.label}</span>
                  {referrals.length > 0 && (
                    <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
                      {referrals.length} направл.
                    </span>
                  )}
                </div>
                {clinicIdForServices && (
                  <button
                    onClick={() => setShowServicePanel(p => !p)}
                    className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 font-semibold transition-colors"
                  >
                    {showServicePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    Услуга из каталога
                  </button>
                )}
              </div>

              <textarea
                value={sectionValues[section.key] || ""}
                onChange={e => handleUpdate(section.key, e.target.value)}
                placeholder={section.placeholder || "Обследования, анализы, результаты..."}
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border border-transparent focus:outline-none focus:ring-2 focus:border-cyan-400 focus:ring-cyan-100 transition-all"
              />

              {/* Expandable clinic services catalog */}
              {showServicePanel && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск услуги..."
                      value={serviceSearch}
                      onChange={e => setServiceSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all"
                    />
                  </div>

                  {uniqueCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          activeCategory === "all" ? "bg-cyan-500 text-white" : "bg-white border border-gray-200 text-gray-500"
                        }`}
                      >
                        Все
                      </button>
                      {uniqueCategories.map(([catId, catLabel]) => (
                        <button
                          key={catId}
                          onClick={() => setActiveCategory(catId)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            activeCategory === catId ? "bg-cyan-500 text-white" : "bg-white border border-gray-200 text-gray-500"
                          }`}
                        >
                          {catLabel}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {servicesLoading && (
                      <p className="text-xs text-center py-4 text-gray-400">Загрузка услуг...</p>
                    )}
                    {!servicesLoading && filteredServices.length === 0 && (
                      <p className="text-xs text-center py-4 text-gray-400">Ничего не найдено</p>
                    )}
                    {filteredServices.map(service => {
                      const isAdded = referrals.some(r => r.serviceId === service.id);
                      const isBookingOpen = bookingServiceId === service.id;
                      return (
                        <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{service.name}</p>
                              <p className="text-xs text-gray-400">
                                {service.category_label}
                                {service.price ? ` · ${Number(service.price).toLocaleString("ru-KZ")} ₸` : ""}
                                {service.duration_minutes ? ` · ${service.duration_minutes} мин` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleAddReferral(service)}
                                disabled={isAdded || addingServiceId === service.id}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                                  isAdded ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {isAdded
                                  ? <CheckCircle className="w-3.5 h-3.5" />
                                  : addingServiceId === service.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Plus className="w-3.5 h-3.5" />}
                                {isAdded ? "Добавлено" : "Добавить"}
                              </button>
                              {canBookDiagnostics && (
                                <button
                                  onClick={() => openBooking(service)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isBookingOpen ? "bg-cyan-500 text-white" : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                                  }`}
                                >
                                  Записать
                                </button>
                              )}
                            </div>
                          </div>

                          {isBookingOpen && (
                            <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                              {/* flex-wrap, not overflow-x-auto — see the same fix in the
                                  appointments/[id]/offline page: a horizontally-scrolling
                                  strip left most of the 14 days reachable only via a
                                  scrollbar with no visible affordance (or by zooming the
                                  browser out), wrapping keeps every date always visible. */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {nextDays.map(d => (
                                  <button
                                    key={d.iso}
                                    onClick={() => fetchSlots(service.id, d.iso)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                                      bookingDate === d.iso ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                ))}
                              </div>

                              {bookingSlotsLoading && <p className="text-xs text-gray-400">Загрузка слотов...</p>}
                              {!bookingSlotsLoading && bookingDate && bookingSlots.length === 0 && (
                                <p className="text-xs text-gray-400">Нет свободных слотов на эту дату</p>
                              )}
                              {bookingSlots.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {bookingSlots.map(slot => (
                                    <button
                                      key={slot.start}
                                      onClick={() => setSelectedSlot(slot.start)}
                                      className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                                        selectedSlot === slot.start ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500"
                                      }`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {slot.label}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {selectedSlot && (
                                <button
                                  onClick={() => handleBook(service)}
                                  disabled={bookingSubmitting}
                                  className="w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-emerald-500 text-white transition-colors disabled:opacity-60"
                                >
                                  <CalendarCheck className="w-3.5 h-3.5" />
                                  {bookingSubmitting ? "Записываем..." : "Подтвердить запись"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {referrals.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-gray-50 pt-2">
                  {referrals.map((ref, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-xl px-3 py-1.5">
                      {ref.appointmentId && <CalendarCheck className="w-3 h-3 text-emerald-600" />}
                      {ref.categoryLabel && (
                        <span className="text-cyan-400 text-[10px] uppercase tracking-wide font-semibold">
                          {ref.categoryLabel}
                        </span>
                      )}
                      <span className="font-medium">{ref.name}</span>
                      {ref.price != null && (
                        <span className="text-cyan-500">{Number(ref.price).toLocaleString("ru-KZ")} ₸</span>
                      )}
                      <button
                        onClick={() => handleRemoveReferral(i)}
                        className="ml-0.5 text-cyan-400 hover:text-cyan-700 transition-colors"
                        title={ref.appointmentId ? "Убрать из списка (запись останется активной)" : "Удалить"}
                      >
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
                  disabled={!manualReferral.trim() || addingManualReferral}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 rounded-xl transition-colors"
                >
                  {addingManualReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Добавить
                </button>
              </div>
            </div>

            ) : (
              (() => {
                const { icon: Icon, color, bg, border } = getSectionStyle(section.key);
                return (
                  <div key={section.key} className="bg-white overflow-hidden">
                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-semibold text-gray-800">{section.label}</span>
                    </div>
                    <textarea
                      value={sectionValues[section.key] || ""}
                      onChange={e => handleUpdate(section.key, e.target.value)}
                      placeholder={section.placeholder || `${section.label}...`}
                      rows={3}
                      className={`w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border border-transparent focus:outline-none focus:ring-2 transition-all ${border}`}
                    />
                  </div>
                );
              })()
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 border-t border-gray-200">
            Данные сохраняются вручную — нажмите «Сохранить» в шапке
          </p>
        </main>
      </div>

      {showAI && (
        <AIConsultationReview
          sourceType="consultation"
          sourceId={consultation?.id ?? 0}
          templateSections={templateSections}
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

      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureSaved}
      />
    </div>
  );
}
