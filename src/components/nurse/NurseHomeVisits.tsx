"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faMapMarkerAlt, faClock, faUser, faPhone, faCheck, faSpinner,
  faFileLines, faXmark, faCommentMedical, faHistory, faFlask, faPrescription,
  faDiagnoses, faNotesMedical, faClipboardList, faRoute, faCar
} from "@fortawesome/free-solid-svg-icons";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";

const NurseRouteMap = dynamic(() => import("@/components/maps/NurseRouteMap"), { ssr: false });

interface HomeVisit {
  id: number;
  patient: number;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  appointment_time: string;
  status: string;
  symptoms?: string;
  notes?: string;
  nurse: number | null;
}

interface ConsultationData {
  id: number;
  complaints: string | null;
  anamnesis: string | null;
  diagnostics: string | null;
  treatment: string | null;
  diagnosis: string | null;
  session_notes: string | null;
  prescription: string | null;
  recommendations: string | null;
  transcription: string | null;
  scheduled_at: string | null;
  ended_at: string | null;
  created_at: string;
  doctor_first_name: string;
  doctor_last_name: string;
  patient_first_name: string;
  patient_last_name: string;
}

export default function NurseHomeVisits() {
  const [availableVisits, setAvailableVisits] = useState<HomeVisit[]>([]);
  const [myVisits, setMyVisits] = useState<HomeVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "my">("available");

  // Consultation history modal state
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);
  const [loadingConsultation, setLoadingConsultation] = useState(false);
  const [consultationTabActive, setConsultationTabActive] = useState<"form" | "notes" | "prescription" | "recommendations" | "transcription">("form");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [availableRes, myRes] = await Promise.all([
        api.get("/appointments/nurse-available/"),
        api.get("/appointments/my-nurse-appointments/")
      ]);
      setAvailableVisits(availableRes.data || []);
      setMyVisits(myRes.data || []);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error("Ошибка при загрузке вызовов");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAppointment = async (appointmentId: number) => {
    setAcceptingId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/accept-by-nurse/`);
      toast.success("✅ Вызов успешно принят!");
      await fetchAppointments(); // Refresh the lists
    } catch (error: any) {
      console.error("Error accepting appointment:", error);
      const errorMsg = error?.response?.data?.detail || "Ошибка при принятии вызова";
      toast.error(errorMsg);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId: number) => {
    try {
      await api.post(`/appointments/${appointmentId}/complete-by-nurse/`);
      toast.success("✅ Вызов завершен!");
      await fetchAppointments();
    } catch (error: any) {
      console.error("Error completing appointment:", error);
      toast.error("Ошибка при завершении вызова");
    }
  };

  const [routeVisit, setRouteVisit] = useState<HomeVisit | null>(null);
  const [routeEta, setRouteEta] = useState<{ distance: string; duration: string; nurseLat: number; nurseLng: number } | null>(null);

  const [startingId, setStartingId] = useState<number | null>(null);
  const [updatingRouteId, setUpdatingRouteId] = useState<number | null>(null);

  const handleStartAppointment = async (appointmentId: number, eta?: { distance: string; duration: string; nurseLat: number; nurseLng: number }) => {
    const info = eta ?? routeEta;
    setStartingId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/start-by-nurse/`, {
        eta_duration: info?.duration ?? null,
        eta_distance: info?.distance ?? null,
        nurse_lat: info?.nurseLat ?? null,
        nurse_lng: info?.nurseLng ?? null,
      });
      toast.success("🚗 Статус обновлён — вы в пути!");
      setRouteVisit(null);
      setRouteEta(null);
      await fetchAppointments();
    } catch (error: any) {
      toast.error("Ошибка при обновлении статуса");
    } finally {
      setStartingId(null);
    }
  };

  const handleUpdateRoute = async (appointmentId: number) => {
    if (!routeEta) return;
    setUpdatingRouteId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/update-route/`, {
        eta_duration: routeEta.duration,
        eta_distance: routeEta.distance,
        nurse_lat: routeEta.nurseLat,
        nurse_lng: routeEta.nurseLng,
      });
      toast.success("📍 Маршрут обновлён!");
      setRouteVisit(null);
      setRouteEta(null);
    } catch {
      toast.error("Ошибка при обновлении маршрута");
    } finally {
      setUpdatingRouteId(null);
    }
  };

  const fetchPatientConsultationHistory = async (patientId: number) => {
    setLoadingConsultation(true);
    setShowConsultationModal(true);
    setConsultationData(null);

    try {
      const response = await api.get(`/consultations/patient-latest/?patient_id=${patientId}`);
      setConsultationData(response.data);
    } catch (error: any) {
      console.error("Error fetching consultation history:", error);
      if (error?.response?.status === 404) {
        toast.info("У пациента пока нет истории консультаций");
      } else {
        toast.error("Ошибка при загрузке истории консультаций");
      }
      setShowConsultationModal(false);
    } finally {
      setLoadingConsultation(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const dateStr = date.toLocaleDateString("ru-RU");
    const timeStr = date.toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' });
    return { date: dateStr, time: timeStr };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "assigned":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Запланирован";
      case "assigned":
        return "Назначено";
      case "in_progress":
        return "В процессе";
      case "completed":
        return "Завершен";
      case "cancelled":
        return "Отменен";
      default:
        return "Неизвестно";
    }
  };

  const renderConsultationModal = () => {
    if (!showConsultationModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
               style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faFileLines} className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  История консультаций: {consultationData ? `${consultationData.patient_first_name} ${consultationData.patient_last_name}` : '...'}
                </h2>
                <p className="text-sm text-white/80">Агрегированные данные из всех консультаций</p>
              </div>
            </div>
            <button
              onClick={() => setShowConsultationModal(false)}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="text-white text-xl" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto">
            {loadingConsultation ? (
              <div className="flex flex-col items-center justify-center p-12">
                <FontAwesomeIcon icon={faSpinner} className="text-6xl text-blue-600 mb-4 animate-spin" />
                <p className="text-gray-500 text-lg">Загрузка истории консультаций...</p>
              </div>
            ) : consultationData ? (
              <div>
                {/* Consultation Info */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Пациент</p>
                      <p className="font-semibold text-gray-900">
                        {consultationData.patient_first_name} {consultationData.patient_last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Врач</p>
                      <p className="font-semibold text-gray-900">
                        {consultationData.doctor_first_name} {consultationData.doctor_last_name}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-600">Дата консультации</p>
                      <p className="font-semibold text-gray-900">
                        {(() => {
                          const dateToShow = consultationData.ended_at || consultationData.scheduled_at || consultationData.created_at;
                          return dateToShow
                            ? new Date(dateToShow).toLocaleDateString("ru-RU", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Не указано";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setConsultationTabActive("form")}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                      consultationTabActive === "form"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="mr-2" />
                    Консультационный лист
                  </button>
                  <button
                    onClick={() => setConsultationTabActive("notes")}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                      consultationTabActive === "notes"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FontAwesomeIcon icon={faNotesMedical} className="mr-2" />
                    Заметки
                  </button>
                  <button
                    onClick={() => setConsultationTabActive("prescription")}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                      consultationTabActive === "prescription"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FontAwesomeIcon icon={faPrescription} className="mr-2" />
                    Рецепт
                  </button>
                  <button
                    onClick={() => setConsultationTabActive("recommendations")}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                      consultationTabActive === "recommendations"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FontAwesomeIcon icon={faFileLines} className="mr-2" />
                    Рекомендации
                  </button>
                  {consultationData.transcription && (
                    <button
                      onClick={() => setConsultationTabActive("transcription")}
                      className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                        consultationTabActive === "transcription"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <FontAwesomeIcon icon={faFileLines} className="mr-2" />
                      Транскрипция
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {consultationTabActive === "form" && (
                    <div className="space-y-6">
                      {/* Complaints */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faCommentMedical} className="text-rose-600" />
                          <h3 className="font-semibold text-gray-900">Жалобы пациента</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {consultationData.complaints && consultationData.complaints !== '<null>' ? consultationData.complaints : "Не указано"}
                          </p>
                        </div>
                      </div>

                      {/* Anamnesis */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faHistory} className="text-amber-600" />
                          <h3 className="font-semibold text-gray-900">Анамнез</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {consultationData.anamnesis && consultationData.anamnesis !== '<null>' ? consultationData.anamnesis : "Не указано"}
                          </p>
                        </div>
                      </div>

                      {/* Diagnostics */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faFlask} className="text-cyan-600" />
                          <h3 className="font-semibold text-gray-900">Диагностика</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {consultationData.diagnostics && consultationData.diagnostics !== '<null>' ? consultationData.diagnostics : "Не указано"}
                          </p>
                        </div>
                      </div>

                      {/* Treatment */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faPrescription} className="text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Лечение и рекомендации</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {consultationData.treatment && consultationData.treatment !== '<null>' ? consultationData.treatment : "Не указано"}
                          </p>
                        </div>
                      </div>

                      {/* Diagnosis */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faDiagnoses} className="text-emerald-600" />
                          <h3 className="font-semibold text-gray-900">Диагноз</h3>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {consultationData.diagnosis && consultationData.diagnosis !== '<null>' ? consultationData.diagnosis : "Не указано"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {consultationTabActive === "notes" && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {consultationData.session_notes && consultationData.session_notes !== '<null>' ? consultationData.session_notes : "Заметки отсутствуют"}
                      </p>
                    </div>
                  )}

                  {consultationTabActive === "prescription" && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {consultationData.prescription && consultationData.prescription !== '<null>' ? consultationData.prescription : "Рецепт не выписан"}
                      </p>
                    </div>
                  )}

                  {consultationTabActive === "recommendations" && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {consultationData.recommendations && consultationData.recommendations !== '<null>' ? consultationData.recommendations : "Рекомендации отсутствуют"}
                      </p>
                    </div>
                  )}

                  {consultationTabActive === "transcription" && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {consultationData.transcription && consultationData.transcription !== '<null>' ? consultationData.transcription : "Транскрипция отсутствует"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12">
                <FontAwesomeIcon icon={faFileLines} className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Нет доступных данных</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                <FontAwesomeIcon icon={faFileLines} className="mr-1" />
                Только для просмотра
              </span>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const splitAddress = (full: string) => {
    const detailRe = /,?\s*(кв\.\s*\S+|подъезд\s*\S+|домофон\s*\S+|комментарий:.+)/gi;
    const details: string[] = [];
    const base = full.replace(detailRe, (m) => { details.push(m.replace(/^,?\s*/, "")); return ""; }).trim().replace(/,\s*$/, "");
    return { base, details };
  };

  const renderVisitCard = (visit: HomeVisit, showAcceptButton: boolean = false) => {
    const { date, time } = formatDateTime(visit.appointment_time);
    const patientName = `${visit.patient_first_name} ${visit.patient_last_name}`;
    const initial = (visit.patient_first_name || "П").charAt(0).toUpperCase();
    const { base: addressBase, details: addressDetails } = splitAddress(visit.address || "");

    const accentColor: Record<string, string> = {
      scheduled: "#3b82f6",
      assigned: "#8b5cf6",
      in_progress: "#f59e0b",
      completed: "#10b981",
      cancelled: "#ef4444",
    };
    const accent = accentColor[visit.status] || "#94a3b8";

    return (
      <div
        key={visit.id}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        {/* ── Header row ── */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-extrabold flex-shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${accent}cc 0%, ${accent} 100%)` }}
            >
              {initial}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">{patientName}</p>
              <p className="text-xs text-gray-400 mt-0.5">Пациент</p>
            </div>
          </div>
          {/* Status pill */}
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ background: `${accent}18`, color: accent }}
          >
            {getStatusText(visit.status)}
          </span>
        </div>

        {/* ── Info grid ── */}
        <div className="px-5 pb-3 space-y-2">
          {/* Address */}
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-0.5 flex-shrink-0 text-sm" style={{ color: accent }} />
            <div className="space-y-1.5">
              <p className="text-sm text-gray-700 leading-snug">{addressBase}</p>
              {addressDetails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {addressDetails.map((d, i) => (
                    <span key={i} className="text-xs font-medium px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time + Phone row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-xs flex-shrink-0" style={{ color: accent }} />
              <span className="text-sm font-semibold text-gray-800">{time}</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-500">{date}</span>
            </div>
            {visit.patient_phone && (
              <a href={`tel:${visit.patient_phone}`} className="flex items-center gap-2 group">
                <FontAwesomeIcon icon={faPhone} className="text-xs flex-shrink-0" style={{ color: accent }} />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{visit.patient_phone}</span>
              </a>
            )}
          </div>

          {/* Symptoms */}
          {visit.symptoms && (
            <div className="mt-1 px-3 py-2 rounded-xl text-sm text-gray-600 leading-relaxed"
              style={{ background: `${accent}0d` }}>
              <span className="font-semibold text-gray-700">Симптомы: </span>{visit.symptoms}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="mx-5 border-t border-gray-100" />

        {/* ── Actions row ── */}
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          {/* History button */}
          <button
            onClick={() => fetchPatientConsultationHistory(visit.patient)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <FontAwesomeIcon icon={faFileLines} />
            История
          </button>

          {/* Right-side action buttons */}
          <div className="flex items-center gap-2">
            {showAcceptButton && (
              <button
                onClick={() => handleAcceptAppointment(visit.id)}
                disabled={acceptingId === visit.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {acceptingId === visit.id
                  ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Принятие...</>
                  : <><FontAwesomeIcon icon={faCheck} /> Принять</>}
              </button>
            )}

            {!showAcceptButton && visit.status === 'assigned' && (
              <>
                <button
                  onClick={() => { setRouteVisit(visit); setRouteEta(null); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <FontAwesomeIcon icon={faRoute} />
                  Маршрут
                </button>
                <button
                  onClick={() => handleStartAppointment(visit.id)}
                  disabled={startingId === visit.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  {startingId === visit.id
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Обновление...</>
                    : <><FontAwesomeIcon icon={faCar} /> В пути</>}
                </button>
              </>
            )}

            {!showAcceptButton && visit.status === 'in_progress' && (
              <>
                <button
                  onClick={() => { setRouteVisit(visit); setRouteEta(null); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <FontAwesomeIcon icon={faRoute} />
                  Карта
                </button>
                <button
                  onClick={() => handleCompleteAppointment(visit.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Завершить
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Route Modal */}
      {routeVisit && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl sm:h-[85vh] h-full flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
              {/* Top row: icon + title + close */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faRoute} className="text-amber-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 flex-1">Маршрут к пациенту</p>
                <button
                  onClick={() => setRouteVisit(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              {/* Address — full, no truncation */}
              <p className="text-xs text-gray-500 mt-2 leading-relaxed pl-12">{routeVisit.address}</p>
              {/* В пути button — full width below address */}
              {routeVisit.status === 'assigned' && (
                <button
                  onClick={() => handleStartAppointment(routeVisit.id, routeEta ?? undefined)}
                  disabled={startingId === routeVisit.id || !routeEta}
                  title={!routeEta ? "Сначала постройте маршрут" : undefined}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                >
                  {startingId === routeVisit.id
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Обновление...</>
                    : <><FontAwesomeIcon icon={faCar} /> В пути</>
                  }
                </button>
              )}
              {routeVisit.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateRoute(routeVisit.id)}
                  disabled={updatingRouteId === routeVisit.id || !routeEta}
                  title={!routeEta ? "Сначала постройте маршрут" : undefined}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  {updatingRouteId === routeVisit.id
                    ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Обновление...</>
                    : <><FontAwesomeIcon icon={faRoute} /> Обновить маршрут</>
                  }
                </button>
              )}
            </div>
            {/* Map */}
            <div className="flex-1 overflow-hidden">
              <NurseRouteMap
                patientAddress={routeVisit.address}
                patientLat={routeVisit.latitude}
                patientLng={routeVisit.longitude}
                onRouteReady={(info) => setRouteEta(info)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Consultation History Modal */}
      {renderConsultationModal()}

      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
              <FontAwesomeIcon icon={faHome} className="text-lg" />
            </div>
            Мои вызовы на дом
          </h1>
          <p className="text-gray-600">Список вызовов на дом</p>
        </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-3 font-semibold transition-all duration-300 border-b-2 ${
            activeTab === "available"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Доступные вызовы ({availableVisits.length})
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`px-4 py-3 font-semibold transition-all duration-300 border-b-2 ${
            activeTab === "my"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Мои вызовы ({myVisits.length})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-6xl text-blue-600 mb-4 animate-spin" />
          <p className="text-gray-500 text-lg">Загрузка вызовов...</p>
        </div>
      ) : (
        <>
          {/* Visits List */}
          <div className="space-y-4">
            {activeTab === "available" ? (
              availableVisits.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                  <FontAwesomeIcon icon={faHome} className="text-6xl text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Нет доступных вызовов</p>
                </div>
              ) : (
                availableVisits.map((visit) => renderVisitCard(visit, true))
              )
            ) : (
              myVisits.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                  <FontAwesomeIcon icon={faHome} className="text-6xl text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">У вас пока нет принятых вызовов</p>
                </div>
              ) : (
                myVisits.map((visit) => renderVisitCard(visit, false))
              )
            )}
          </div>
        </>
      )}
      </div>
    </>
  );
}
