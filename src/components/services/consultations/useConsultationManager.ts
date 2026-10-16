import { useEffect, useRef, useState, useCallback } from "react";
import { api, getWebSocketURL } from "@/utils/api";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/context/AuthContext";

const CONSULTATION_EVENTS = new Set([
  "consultation_created",
  "consultation_updated",
  "consultation_status_changed",
]);

// DiagnosticsAppointment.status uses its own vocabulary (scheduled/confirmed/
// in_progress/completed/cancelled) — different from the generic Consultation
// status the rest of the table/stats/filters understand (pending/ongoing/
// completed/cancelled/missed/planned/scheduled). Normalize at the source so
// every downstream consumer (status badge, "Активные"/"Запланировано" stats,
// tab filters) keeps working without knowing diagnostics rows exist.
const DIAGNOSTICS_STATUS_DISPLAY_MAP: Record<string, Consultation["status"]> = {
  scheduled: "scheduled",
  confirmed: "scheduled",
  in_progress: "ongoing",
  completed: "completed",
  cancelled: "cancelled",
};

const mapDiagnosticsStatus = (rawStatus: string): Consultation["status"] =>
  DIAGNOSTICS_STATUS_DISPLAY_MAP[rawStatus] ?? (rawStatus as Consultation["status"]);

export const useConsultationManager = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [newConsultation, setNewConsultation] = useState<Consultation | null>(null);
  const { user, isDoctor, isPatient } = useAuth();

  const seenIds = useRef<Set<number>>(new Set());
  const dismissedIds = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchConsultations = useCallback(async (status?: string) => {
    try {
      const results: Consultation[] = [];

      // Doctors use their own endpoint; everyone else uses the patient endpoint.
      // /my-consultations/ filters by patient=request.user — no patient_profile needed.
      const baseUrl = isDoctor
        ? "/consultations/doctor-consultations/"
        : "/consultations/my-consultations/";
      const url = status ? `${baseUrl}?status=${status}` : baseUrl;
      const { data } = await api.get<any>(url);
      let videoList: any[] = [];
      if (Array.isArray(data)) videoList = data;
      else if (Array.isArray(data?.results)) videoList = data.results;
      else if (Array.isArray(data?.consultations)) videoList = data.consultations;
      videoList.forEach(c => {
        const slotType = c.appointment_slot?.consultation_type;
        const resolvedType = slotType === 'offline' ? 'offline' : 'video';
        results.push({ ...c, type: resolvedType as Consultation['type'] });
      });

      // Offline clinic appointments (doctors)
      if (isDoctor) {
        try {
          const { data: clinicData } = await api.get<any>("/clinic-appointments/");
          const rawClinicList: any[] = Array.isArray(clinicData) ? clinicData : (clinicData?.results || []);
          rawClinicList.forEach(a =>
            results.push({
              id: a.id + 100000,
              clinic_appointment_id: a.id,
              type: "offline" as const,
              status: a.status,
              scheduled_at: a.appointment_time,
              appointment_time: a.appointment_time,
              created_at: a.created_at,
              patient_name: a.patient_name,
              clinic_name: a.clinic_name,
              clinic_address: a.clinic_address,
              clinic_timezone: a.clinic_timezone,
            } as Consultation)
          );
        } catch { /* endpoint may not exist */ }

        // Diagnostics appointments where this doctor is the PERFORMING
        // doctor — who actually carries out the test, independent from
        // the referring doctor (who ordered it, possibly someone else
        // entirely, and drives commission — see DiagnosticsAppointment.doctor
        // vs performing_doctor). Previously invisible here no matter who
        // booked them: a patient self-booking, or an admin via AddEventModal.
        try {
          const { data: diagData } = await api.get<any>("/diagnostics/appointments/performing-appointments/");
          const rawDiagList: any[] = Array.isArray(diagData) ? diagData : (diagData?.results || []);
          rawDiagList.forEach(a =>
            results.push({
              id: a.id + 300000,
              diagnostics_appointment_id: a.id,
              type: "diagnostics" as const,
              status: mapDiagnosticsStatus(a.status),
              scheduled_at: a.appointment_time,
              appointment_time: a.appointment_time,
              created_at: a.created_at,
              patient_name: a.patient_name,
              clinic_name: a.clinic_name,
              clinic_address: a.clinic_address,
              clinic_timezone: a.clinic_timezone,
              service_name: a.service_display?.name || a.service_name,
              referring_doctor_name: a.doctor_name,
            } as Consultation)
          );
        } catch { /* endpoint may not exist */ }
      }

      // Offline clinic appointments (patients only)
      if (isPatient) {
        try {
          const { data: clinicData } = await api.get<any>("/clinic-appointments/my-appointments/");
          const rawClinicList: any[] = Array.isArray(clinicData) ? clinicData : (clinicData?.results || []);
          const seenClinic = new Map<string, any>();
          rawClinicList.forEach(a => {
            const key = `${a.doctor}_${a.appointment_time}`;
            if (!seenClinic.has(key) || a.id > seenClinic.get(key).id) seenClinic.set(key, a);
          });
          Array.from(seenClinic.values()).forEach(a =>
            results.push({
              id: a.id + 100000,
              type: "offline" as const,
              status: a.status === "confirmed" ? "confirmed" : a.status,
              scheduled_at: a.appointment_time,
              appointment_time: a.appointment_time,
              created_at: a.created_at,
              doctor_first_name: a.doctor_name?.split(" ")[0] || "",
              doctor_last_name: a.doctor_name?.split(" ").slice(1).join(" ") || "",
              doctor_type: a.doctor_type,
              clinic_name: a.clinic_name,
              clinic_address: a.clinic_address,
              clinic_timezone: a.clinic_timezone,
            } as Consultation)
          );
        } catch { /* endpoint may not exist */ }

        // Home appointments
        try {
          const { data: homeData } = await api.get<any>("/appointments/my-appointments/");
          const homeList: any[] = Array.isArray(homeData) ? homeData : (homeData?.results || []);
          homeList.forEach(a =>
            results.push({
              id: a.id + 200000,
              home_appointment_id: a.id,           // real DB id for tracking
              type: "home" as const,
              status: a.status,
              scheduled_at: a.appointment_time,
              appointment_time: a.appointment_time,
              created_at: a.created_at,
              doctor_first_name: a.nurse_name ? a.nurse_name.split(" ")[0] : (a.doctor_first_name || ""),
              doctor_last_name: a.nurse_name ? a.nurse_name.split(" ").slice(1).join(" ") : (a.doctor_last_name || ""),
              doctor_type: "Медицинская сестра",
              address: a.address,
              latitude: a.latitude,
              longitude: a.longitude,
              nurse_name: a.nurse_name || null,
              nurse_phone: a.nurse_phone || null,
              nurse_photo: a.nurse_photo || null,
              symptoms: a.symptoms,
              clinic_timezone: a.clinic_timezone,
            } as Consultation)
          );
        } catch { /* endpoint may not exist */ }
      }

      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setConsultations(results);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
      setConsultations([]);
    }
  }, [user?.role, isPatient, isDoctor]);

  // ── WebSocket — replace polling ──────────────────────────────────────────────
  useEffect(() => {
    // Initial load
    fetchConsultations();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 2000;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      try {
        const base = getWebSocketURL().replace(/\/$/, "");
        ws = new WebSocket(`${base}/consultations/`);

        ws.onopen = () => {
          reconnectDelay = 2000;
          // Authenticate
          ws!.send(JSON.stringify({ type: "authenticate", token }));
          // Keepalive ping every 30 s
          pingTimer = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
          }, 30_000);
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (CONSULTATION_EVENTS.has(msg.type)) {
              // Re-fetch the list so the table is always in sync with the DB
              fetchConsultations();
            }
          } catch { /* ignore parse errors */ }
        };

        ws.onclose = () => {
          if (pingTimer) clearInterval(pingTimer);
          if (!destroyed) {
            reconnectTimer = setTimeout(() => {
              reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
              connect();
            }, reconnectDelay);
          }
        };

        ws.onerror = () => ws?.close();
      } catch { /* WebSocket not available (SSR) */ }
    };

    connect();

    return () => {
      destroyed = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close(1000, "unmount");
    };
  }, [fetchConsultations]);

  // ── Audio helpers ────────────────────────────────────────────────────────────
  const playSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(() => {});
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return {
    consultations,
    newConsultation,
    setNewConsultation,
    dismissedIds,
    fetchConsultations,
    stopSound,
  };
};
