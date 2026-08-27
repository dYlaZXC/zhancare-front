"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  Mic, MicOff, Play, Square, Save, Clock, MapPin,
  User, FileText, Activity, Stethoscope, Pill, ClipboardList,
  Sparkles, ChevronLeft, AlertTriangle, FlaskConical,
  Search, Plus, X, CheckCircle, PenLine, Loader2,
} from "lucide-react";
import { useDeepgram } from "@/hooks/useDeepgram";
import AIConsultationReview from "@/app/video-call/doctor/components/AIConsultationReview";
import { SignatureModal } from "@/components/shared/SignatureModal";
import { generateMedicalPdf } from "@/lib/generateMedicalPdf";

interface ClinicAppointment {
  id: number;
  clinic?: number;
  patient?: number;
  doctor?: number;
  patient_name: string;
  doctor_name: string;
  clinic_name: string;
  clinic_address?: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  consultation_started_at: string | null;
  consultation_ended_at: string | null;
  duration_seconds: number | null;
}

interface DiagnosticReferral {
  id?: number;
  name: string;
  category?: string;
  category_label?: string;
  price?: number | null;
  currency?: string | null;
  booked_at?: string;
  appointment_id?: number;
}

interface DiagnosticServiceItem {
  id: number;
  name: string;
  category: string;
  category_label: string;
  description?: string;
  price?: number | null;
  currency?: string | null;
  duration_minutes?: number;
}

interface ConsultationFormData {
  complaints: string;
  anamnesis: string;
  diagnostics: string;
  treatment: string;
  diagnosis: string;
  referrals: DiagnosticReferral[];
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

function parseNotes(raw: string | null): ConsultationFormData {
  if (!raw) return EMPTY_FORM;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "complaints" in parsed) {
      return {
        ...EMPTY_FORM,
        ...parsed,
        referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [],
      };
    }
  } catch {
    return { ...EMPTY_FORM, complaints: raw };
  }
  return EMPTY_FORM;
}

type ConsultationTextField = "complaints" | "anamnesis" | "diagnostics" | "treatment" | "diagnosis";

type FieldDef = {
  key: ConsultationTextField;
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  rows: number;
};

const FIELDS_BEFORE: FieldDef[] = [
  {
    key: "complaints",
    label: "Жалобы пациента",
    placeholder: "Боли, симптомы, длительность...",
    icon: ClipboardList,
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "focus:border-rose-400 focus:ring-rose-100",
    rows: 3,
  },
  {
    key: "anamnesis",
    label: "Анамнез",
    placeholder: "История заболевания, перенесённые болезни, аллергии...",
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "focus:border-amber-400 focus:ring-amber-100",
    rows: 3,
  },
];

const FIELDS_AFTER: FieldDef[] = [
  {
    key: "treatment",
    label: "Лечение и рекомендации",
    placeholder: "Препараты, дозировки, режим приёма, рекомендации...",
    icon: Pill,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "focus:border-blue-400 focus:ring-blue-100",
    rows: 4,
  },
  {
    key: "diagnosis",
    label: "Диагноз",
    placeholder: "Окончательный или предварительный диагноз по МКБ-10...",
    icon: Stethoscope,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "focus:border-emerald-400 focus:ring-emerald-100",
    rows: 2,
  },
];

export default function OfflineConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [appointment, setAppointment] = useState<ClinicAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [formData, setFormData] = useState<ConsultationFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showNavGuard, setShowNavGuard] = useState(false);
  const pendingNavUrl = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Signed PDF report — same flow as the video-call consultation page.
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Diagnostics referrals state
  const [clinicServices, setClinicServices] = useState<DiagnosticServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServicePanel, setShowServicePanel] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [manualReferral, setManualReferral] = useState("");

  // Inline booking state
  const [bookingServiceId, setBookingServiceId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlots, setBookingSlots] = useState<{ start: string; end: string; label: string; available: number }[]>([]);
  const [bookingSlotsLoading, setBookingSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const {
    transcript,
    isConnected: isMicActive,
    error: micError,
    startTranscription,
    stopTranscription,
    clearTranscript,
  } = useDeepgram();

  const fetchAppointment = useCallback(async () => {
    try {
      const { data } = await api.get<ClinicAppointment>(`/clinic-appointments/${id}/`);
      setAppointment(data);
      setFormData(parseNotes(data.notes));
      if (data.consultation_started_at && !data.consultation_ended_at) {
        startTimeRef.current = new Date(data.consultation_started_at).getTime();
      }
      if (data.duration_seconds) setElapsed(data.duration_seconds);
    } catch {
      toast.error("Не удалось загрузить приём");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

  useEffect(() => {
    if (appointment?.status !== "in_progress" || !startTimeRef.current) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [appointment?.status]);

  // Block browser close / refresh when consultation is active
  useEffect(() => {
    if (appointment?.status !== "in_progress") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [appointment?.status]);

  // Intercept all in-app <a> link clicks when consultation is active
  useEffect(() => {
    if (appointment?.status !== "in_progress") return;
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
  }, [appointment?.status]);

  const handleNavConfirm = () => {
    setShowNavGuard(false);
    if (pendingNavUrl.current) {
      router.push(pendingNavUrl.current);
    } else {
      router.back();
    }
  };

  // Fetch diagnostic services for this clinic
  useEffect(() => {
    if (!appointment?.clinic) return;
    setServicesLoading(true);
    api.get<DiagnosticServiceItem[] | { results: DiagnosticServiceItem[] }>(
      `/diagnostics/services/?clinic=${appointment.clinic}`
    )
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : ((data as any)?.results ?? []);
        setClinicServices(list);
      })
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, [appointment?.clinic]);

  const filteredServices = clinicServices.filter(s => {
    const matchCat = activeCategory === "all" || s.category === activeCategory;
    const matchSearch = !serviceSearch ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(serviceSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddReferral = (service: DiagnosticServiceItem) => {
    if (formData.referrals.some(r => r.id === service.id)) return;
    setFormData(prev => ({
      ...prev,
      referrals: [...prev.referrals, {
        id: service.id,
        name: service.name,
        category: service.category,
        category_label: service.category_label,
        price: service.price != null ? Number(service.price) : undefined,
        currency: service.currency ?? undefined,
      }],
    }));
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

  const uniqueCategories = Array.from(
    new Map(clinicServices.map(s => [s.category, s.category_label])).entries()
  );

  // Generate next 14 days for the date picker
  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("ru-KZ", { weekday: "short", day: "numeric", month: "short" }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });

  const openBooking = (service: DiagnosticServiceItem) => {
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
      const patientParam = appointment?.patient ? `&patient_id=${appointment.patient}` : "";
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

  const handleBook = async (service: DiagnosticServiceItem) => {
    if (!selectedSlot || !appointment?.patient) return;
    setBookingSubmitting(true);
    try {
      const { data } = await api.post<{ appointment: { id: number } }>("/diagnostics/appointments/", {
        service_id: service.id,
        patient_id: appointment.patient,
        // Referring doctor = the doctor this clinic appointment is assigned
        // to (drives commission on the backend) — not the appointment's own PK.
        doctor_id: appointment.doctor,
        scheduled_time: selectedSlot,
      });
      const appointmentId = data?.appointment?.id;
      const slotObj = bookingSlots.find(s => s.start === selectedSlot);
      setFormData(prev => ({
        ...prev,
        referrals: [
          ...prev.referrals.filter(r => r.id !== service.id),
          {
            id: service.id,
            name: service.name,
            category: service.category,
            category_label: service.category_label,
            price: service.price != null ? Number(service.price) : undefined,
            currency: service.currency ?? undefined,
            booked_at: selectedSlot,
            appointment_id: appointmentId,
          },
        ],
      }));
      toast.success(`Записано: ${service.name} — ${slotObj?.label ?? ""} ${bookingDate}`);
      setBookingServiceId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при записи");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleUpdate = (field: keyof ConsultationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAIApply = (fields: Record<string, string>) => {
    Object.entries(fields).forEach(([k, v]) => {
      if (v && k in formData) handleUpdate(k as keyof ConsultationFormData, v);
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.patch(`/clinic-appointments/${id}/`, { notes: JSON.stringify(formData) });
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }, [id, formData]);

  const generateAndUploadPdf = async (signature: string) => {
    if (!appointment) return;
    setGeneratingPdf(true);
    try {
      const { blob, filename } = await generateMedicalPdf({
        documentTitle: "Консультационный лист",
        patientName: appointment.patient_name,
        doctorName: appointment.doctor_name,
        sections: [
          { label: "Жалобы пациента", content: formData.complaints },
          { label: "Анамнез заболевания", content: formData.anamnesis },
          { label: "Обследование и диагностика", content: formData.diagnostics },
          { label: "Диагноз", content: formData.diagnosis },
          { label: "Назначенное лечение", content: formData.treatment },
        ],
        signature,
        filenamePrefix: "consultation",
      });

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename; a.click();
      URL.revokeObjectURL(blobUrl);

      const uploadData = new FormData();
      uploadData.append("file", new File([blob], filename, { type: "application/pdf" }));
      uploadData.append("clinic_appointment_id", String(id));
      uploadData.append("description", `Консультационный лист — ${appointment.patient_name}`);
      await api.post("/medical-documents/doctor-upload/", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const { data } = await api.post<ClinicAppointment>(`/clinic-appointments/${id}/start-consultation/`);
      setAppointment(data);
      startTimeRef.current = new Date(data.consultation_started_at!).getTime();
      toast.success("Консультация начата");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Ошибка при старте");
    }
  };

  const handleEnd = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopTranscription();
      await handleSave();
      const { data } = await api.post<ClinicAppointment>(`/clinic-appointments/${id}/end-consultation/`);
      setAppointment(data);
      if (data.duration_seconds) setElapsed(data.duration_seconds);
      toast.success("Консультация завершена");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Ошибка при завершении");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <p className="text-gray-500">Приём не найден</p>
        <Link href="/doctor/appointments" className="text-blue-600 hover:underline text-sm">
          ← Назад к приёмам
        </Link>
      </div>
    );
  }

  const isOngoing = appointment.status === "in_progress";
  const isCompleted = appointment.status === "completed";
  const isPending = !isOngoing && !isCompleted;

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

          {/* Patient info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {appointment.patient_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{appointment.patient_name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {appointment.clinic_name}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Timer */}
          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${isOngoing ? "text-emerald-500" : "text-gray-400"}`} />
            <span className={`text-base font-mono font-bold tabular-nums ${
              isOngoing ? "text-emerald-600" : "text-gray-400"
            }`}>
              {formatDuration(elapsed)}
            </span>
          </div>

          {/* Status badge */}
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            isOngoing
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isCompleted
              ? "bg-gray-100 text-gray-500 border-gray-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isOngoing ? "В процессе" : isCompleted ? "Завершена" : "Ожидание"}
          </span>

          {/* Actions */}
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
              disabled={generatingPdf || !Object.entries(formData).some(([k, v]) => k !== "referrals" && typeof v === "string" && v.trim())}
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

        {/* ── Left sidebar: info + voice ── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-white p-5 space-y-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">

          {/* Appointment info */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Информация о приёме</p>
            <div className="space-y-2.5">
              {[
                { label: "Пациент", value: appointment.patient_name, icon: User },
                { label: "Клиника", value: appointment.clinic_name, icon: MapPin },
                {
                  label: "Время", icon: Clock,
                  value: new Date(appointment.appointment_time).toLocaleString("ru-KZ", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  }),
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

          {/* Duration if completed */}
          {isCompleted && appointment.duration_seconds && (
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400">Длительность приёма</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">
                {Math.floor(appointment.duration_seconds / 60)} мин {appointment.duration_seconds % 60} сек
              </p>
            </div>
          )}

          <div className="w-full h-px bg-gray-100" />

          {/* Voice transcription */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Запись голоса</p>

            {isPending && (
              <p className="text-xs text-gray-400 text-center py-3">
                Доступно после начала приёма
              </p>
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

                {micError && (
                  <p className="text-xs text-red-500 px-1">{micError}</p>
                )}

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
                  <p className="text-xs text-gray-400 text-center py-2">
                    Речь врача появится здесь
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* AI analysis */}
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
            {/* Жалобы + Анамнез */}
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

            {/* ── Диагностика + Направления (combined) ── */}
            <div className="bg-white overflow-hidden">
              {/* Header */}
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
                <button
                  onClick={() => setShowServicePanel(p => !p)}
                  className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Направление
                </button>
              </div>

              {/* Free-text diagnostics textarea */}
              <textarea
                value={formData.diagnostics}
                onChange={e => handleUpdate("diagnostics", e.target.value)}
                placeholder="Обследования, анализы, результаты..."
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border border-transparent focus:outline-none focus:ring-2 focus:border-cyan-400 focus:ring-cyan-100 transition-all"
              />

              {/* Selected referral chips */}
              {formData.referrals.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-gray-50 pt-2">
                  {formData.referrals.map((ref, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-xl px-3 py-1.5"
                    >
                      {ref.category_label && (
                        <span className="text-cyan-400 text-[10px] uppercase tracking-wide font-semibold">
                          {ref.category_label}
                        </span>
                      )}
                      <span className="font-medium">{ref.name}</span>
                      {ref.price != null && (
                        <span className="text-cyan-500">
                          {Number(ref.price).toLocaleString("ru-KZ")} {ref.currency ?? "KZT"}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveReferral(i)}
                        className="ml-0.5 text-cyan-400 hover:text-cyan-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Expandable catalog panel */}
              {showServicePanel && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                  {/* Search */}
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

                  {/* Category tabs */}
                  {uniqueCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setActiveCategory("all")}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          activeCategory === "all"
                            ? "bg-cyan-500 text-white border-cyan-500"
                            : "bg-white border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600"
                        }`}
                      >
                        Все
                      </button>
                      {uniqueCategories.map(([catId, catLabel]) => (
                        <button
                          key={catId}
                          onClick={() => setActiveCategory(catId)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                            activeCategory === catId
                              ? "bg-cyan-500 text-white border-cyan-500"
                              : "bg-white border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600"
                          }`}
                        >
                          {catLabel}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Services list */}
                  {servicesLoading ? (
                    <div className="text-center py-4 text-sm text-gray-400">
                      <div className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Загрузка услуг...
                    </div>
                  ) : filteredServices.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white overflow-hidden">
                      {filteredServices.map(service => {
                        const referral = formData.referrals.find(r => r.id === service.id);
                        const added = !!referral;
                        const isOpen = bookingServiceId === service.id;
                        return (
                          <div key={service.id}>
                            {/* Service row */}
                            <button
                              onClick={() => openBooking(service)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                                added ? "bg-cyan-50" : isOpen ? "bg-gray-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className={`font-medium truncate ${added ? "text-cyan-700" : "text-gray-800"}`}>
                                  {service.name}
                                </div>
                                {referral?.booked_at ? (
                                  <div className="text-xs text-cyan-500 font-medium">
                                    Записан: {new Date(referral.booked_at).toLocaleString("ru-KZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                ) : service.description ? (
                                  <div className="text-xs text-gray-400 truncate max-w-sm">{service.description}</div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                {service.price != null && (
                                  <span className="text-xs text-gray-400">
                                    {Number(service.price).toLocaleString("ru-KZ")} {service.currency ?? "KZT"}
                                  </span>
                                )}
                                {service.duration_minutes && (
                                  <span className="text-xs text-gray-300">{service.duration_minutes} мин</span>
                                )}
                                {added
                                  ? <CheckCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                  : <Plus className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-45 text-gray-500" : "text-gray-300"}`} />
                                }
                              </div>
                            </button>

                            {/* Inline booking panel */}
                            {isOpen && (
                              <div className="bg-blue-50 border-t border-blue-100 px-4 py-3 space-y-3">
                                {/* Date picker */}
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Выберите дату</p>
                                <div className="flex gap-1.5 overflow-x-auto pb-1">
                                  {nextDays.map(day => (
                                    <button
                                      key={day.iso}
                                      onClick={() => fetchSlots(service.id, day.iso)}
                                      disabled={day.isWeekend}
                                      className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                        bookingDate === day.iso
                                          ? "bg-cyan-500 text-white border-cyan-500"
                                          : day.isWeekend
                                          ? "border-gray-200 text-gray-300 cursor-not-allowed bg-white"
                                          : "bg-white border-gray-200 text-gray-700 hover:border-cyan-300 hover:text-cyan-700"
                                      }`}
                                    >
                                      {day.label}
                                    </button>
                                  ))}
                                </div>

                                {/* Slots */}
                                {bookingDate && (
                                  bookingSlotsLoading ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                      <div className="w-3.5 h-3.5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                                      Загрузка слотов...
                                    </div>
                                  ) : bookingSlots.length > 0 ? (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Доступное время</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {bookingSlots.map(slot => (
                                          <button
                                            key={slot.start}
                                            onClick={() => setSelectedSlot(slot.start)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                                              selectedSlot === slot.start
                                                ? "bg-cyan-500 text-white border-cyan-500"
                                                : "bg-white border-gray-200 text-gray-700 hover:border-cyan-400 hover:text-cyan-700"
                                            }`}
                                          >
                                            {slot.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">Нет свободных слотов на эту дату</p>
                                  )
                                )}

                                {/* Confirm */}
                                {selectedSlot && (
                                  <button
                                    onClick={() => handleBook(service)}
                                    disabled={bookingSubmitting}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-xl transition-colors"
                                  >
                                    {bookingSubmitting ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Записать пациента
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-3 text-xs text-gray-400">
                      {clinicServices.length === 0
                        ? "У клиники нет диагностических услуг в справочнике"
                        : "Ничего не найдено по запросу"}
                    </p>
                  )}

                  {/* Manual add */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                    <input
                      type="text"
                      placeholder="Добавить вручную..."
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
              )}
            </div>

            {/* Лечение + Диагноз */}
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

      {/* AI Review Modal */}
      {showAI && (
        <AIConsultationReview
          patientName={appointment.patient_name}
          initialDescription={transcript ?? ""}
          onApply={handleAIApply}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Navigation guard */}
      {showNavGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Идёт консультация</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  У вас ещё активен приём с пациентом{" "}
                  <span className="font-medium text-gray-700">{appointment.patient_name}</span>.
                  Не забудьте нажать «Завершить» перед выходом, иначе консультация останется незакрытой.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNavGuard(false); pendingNavUrl.current = null; }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Остаться
              </button>
              <button
                onClick={handleNavConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Всё равно уйти
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
