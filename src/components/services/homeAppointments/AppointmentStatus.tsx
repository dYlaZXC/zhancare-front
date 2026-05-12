"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Clock, CheckCircle, User, RefreshCw, Navigation, X } from "lucide-react";
import dynamic from "next/dynamic";
import { api } from "@/utils/api";

const YandexMap = dynamic(() => import("@/components/maps/YandexMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100" />,
});

const NurseRouteMap = dynamic(() => import("@/components/maps/NurseRouteMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100" />,
});

interface AppointmentData {
  id: number;
  status: string;
  normalized_status?: string;
  address: string;
  appointment_time: string;
  nurse?: number | null;
  nurse_name?: string | null;
  nurse_phone?: string | null;
  nurse_photo?: string | null;
  latitude?: number;
  longitude?: number;
  eta_duration?: string | null;
  eta_distance?: string | null;
  nurse_start_lat?: number | null;
  nurse_start_lng?: number | null;
}

type StatusKey = "pending" | "viewed" | "accepted" | "in_progress" | "completed" | "cancelled";

const STATUS_CONFIG: Record<StatusKey, {
  label: string;
  sub: string;
  color: "amber" | "blue" | "emerald" | "red";
  pulse: boolean;
}> = {
  pending:     { label: "Ожидает медсестру",            sub: "Заявка отправлена, ждём принятия",   color: "amber",   pulse: true  },
  viewed:      { label: "Медсёстры рассматривают",      sub: "Кто-то уже смотрит вашу заявку",     color: "blue",    pulse: true  },
  accepted:    { label: "Заявка принята!",              sub: "Медсестра направляется к вам",        color: "emerald", pulse: false },
  in_progress: { label: "Медсестра в пути",             sub: "Скоро прибудет по вашему адресу",    color: "blue",    pulse: true  },
  completed:   { label: "Визит завершён",               sub: "Спасибо, что воспользовались сервисом", color: "emerald", pulse: false },
  cancelled:   { label: "Заявка отменена",              sub: "Вы можете создать новую заявку",     color: "red",     pulse: false },
};

const COLORS = {
  amber:   { bg: "bg-amber-500",   ring: "ring-amber-200",   text: "text-amber-600",   dot: "bg-amber-400",   ping: "bg-amber-300",   card: "bg-amber-50 border-amber-200 text-amber-900"   },
  blue:    { bg: "bg-blue-500",    ring: "ring-blue-200",    text: "text-blue-600",    dot: "bg-blue-500",    ping: "bg-blue-300",    card: "bg-blue-50 border-blue-200 text-blue-900"       },
  emerald: { bg: "bg-emerald-500", ring: "ring-emerald-200", text: "text-emerald-600", dot: "bg-emerald-500", ping: "bg-emerald-300", card: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  red:     { bg: "bg-red-500",     ring: "ring-red-200",     text: "text-red-600",     dot: "bg-red-400",     ping: "bg-red-300",     card: "bg-red-50 border-red-200 text-red-900"          },
};

const STEPS: { key: StatusKey; short: string }[] = [
  { key: "pending",     short: "Создана"     },
  { key: "viewed",      short: "Просмотр"    },
  { key: "accepted",    short: "Принята"     },
  { key: "in_progress", short: "В пути"      },
  { key: "completed",   short: "Готово"      },
];
const STEP_KEYS = STEPS.map(s => s.key);

function StatusIcon({ status, className }: { status: StatusKey; className?: string }) {
  const cls = className || "w-4 h-4";
  if (status === "pending")     return <Clock className={cls} />;
  if (status === "viewed")      return <RefreshCw className={`${cls} animate-spin`} />;
  if (status === "in_progress") return <Navigation className={cls} />;
  return <CheckCircle className={cls} />;
}

interface AppointmentStatusProps {
  appointmentId: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  onNewAppointment: () => void;
}

const AppointmentStatus: React.FC<AppointmentStatusProps> = ({
  appointmentId,
  address,
  latitude,
  longitude,
  onNewAppointment,
}) => {
  const [data, setData] = useState<AppointmentData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}/`);
      setData(res.data);
    } catch { /* keep last known state */ }
  }, [appointmentId]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStatus]);

  useEffect(() => {
    if (data?.status === "completed" || data?.status === "cancelled") {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [data?.status]);

  const status = (data?.normalized_status || data?.status || "pending") as StatusKey;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const colors = COLORS[cfg.color];
  const currentIdx = STEP_KEYS.indexOf(status);

  const mapCenter: [number, number] =
    latitude && longitude ? [latitude, longitude] : [43.238293, 76.889709];

  const hasNurse = !!data?.nurse_name &&
    (status === "accepted" || status === "in_progress" || status === "completed");

  return (
    <div className="absolute inset-0">
      {/* Map — background layer */}
      <div className="absolute inset-0">
        {status === "in_progress" && data?.nurse_start_lat && data?.nurse_start_lng ? (
          <NurseRouteMap
            patientAddress={address}
            patientLat={latitude}
            patientLng={longitude}
            nurseStartLat={data.nurse_start_lat}
            nurseStartLng={data.nurse_start_lng}
          />
        ) : (
          <YandexMap
            onAddressSelect={() => {}}
            initialAddress={address}
            center={mapCenter}
            zoom={15}
            controls={["zoomControl"]}
          />
        )}
      </div>

      {/* ── STATUS BANNER — top overlay ── */}
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-3 left-3 right-3 z-10"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg px-3.5 py-3 flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${colors.bg}`}>
            <StatusIcon status={status} className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">{cfg.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{cfg.sub}</p>
          </div>
          {cfg.pulse && (
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`} />
            </span>
          )}
        </div>
      </motion.div>

      {/* ── BOTTOM SHEET — nurse + progress + footer ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10">

        {/* ETA card — shown when nurse is on the way */}
        <AnimatePresence>
          {status === "in_progress" && (data?.eta_duration || data?.eta_distance) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mx-3 mb-2"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-500" />
                  Медсестра едет к вам
                </p>
                <div className="flex items-center gap-3">
                  {data.eta_distance && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl flex-1 justify-center">
                      <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-sm font-bold text-blue-800">{data.eta_distance}</span>
                    </div>
                  )}
                  {data.eta_duration && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex-1 justify-center">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-800">{data.eta_duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nurse card */}
        <AnimatePresence>
          {hasNurse && data?.nurse_name && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mx-3 mb-2"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                {data.nurse_photo ? (
                  <img src={data.nurse_photo} alt={data.nurse_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center border-2 border-emerald-200 flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{data.nurse_name}</p>
                  <p className="text-xs text-emerald-600 font-medium">Медицинская сестра</p>
                  {data.nurse_phone && (
                    <a href={`tel:${data.nurse_phone}`}
                      className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[#3772ff] hover:underline">
                      <Phone className="w-3 h-3" /> {data.nurse_phone}
                    </a>
                  )}
                </div>
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress + footer */}
        <div className="bg-white/95 backdrop-blur-md rounded-t-3xl shadow-2xl px-4 pt-4 pb-5">
          {/* Progress steps */}
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done = currentIdx > i;
              const active = currentIdx === i;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                      done   ? "bg-emerald-500 text-white" :
                      active ? `${colors.bg} text-white ring-4 ${colors.ring}` :
                               "bg-gray-200 text-gray-400"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[9px] font-semibold whitespace-nowrap ${
                      done ? "text-emerald-600" : active ? "text-gray-800" : "text-gray-400"
                    }`}>
                      {s.short}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full transition-all duration-500 ${
                      done ? "bg-emerald-400" : "bg-gray-200"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-mono">
              #{String(appointmentId).padStart(6, "0")}
            </span>
            {(status === "completed" || status === "cancelled") ? (
              <button onClick={onNewAppointment}
                className="text-xs font-semibold text-[#3772ff] hover:underline">
                Создать новый →
              </button>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Обновляется каждые 5 сек
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentStatus;
