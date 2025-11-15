"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faMapMarkerAlt, faClock, faUser, faPhone, faCheck, faSpinner,
  faFileLines, faXmark, faCommentMedical, faHistory, faFlask, faPrescription,
  faDiagnoses, faNotesMedical, faClipboardList
} from "@fortawesome/free-solid-svg-icons";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

interface HomeVisit {
  id: number;
  patient: number;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  address: string;
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

  const renderVisitCard = (visit: HomeVisit, showAcceptButton: boolean = false) => {
    const { date, time } = formatDateTime(visit.appointment_time);
    const patientName = `${visit.patient_first_name} ${visit.patient_last_name}`;

    return (
      <div
        key={visit.id}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side - Visit Info */}
          <div className="flex-1 space-y-3">
            {/* Patient Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
                   style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                <FontAwesomeIcon icon={faUser} className="text-sm" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{patientName}</h3>
                <p className="text-sm text-gray-500">Пациент</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 pl-13">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 mt-1" />
              <div>
                <p className="text-gray-700 font-medium">{visit.address}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 pl-13">
              <FontAwesomeIcon icon={faClock} className="text-blue-600" />
              <p className="text-gray-700">
                <span className="font-semibold">{time}</span> • {date}
              </p>
            </div>

            {/* Phone */}
            {visit.patient_phone && (
              <div className="flex items-center gap-3 pl-13">
                <FontAwesomeIcon icon={faPhone} className="text-blue-600" />
                <a href={`tel:${visit.patient_phone}`} className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  {visit.patient_phone}
                </a>
              </div>
            )}

            {/* Symptoms */}
            {visit.symptoms && (
              <div className="pl-13 mt-2">
                <p className="text-sm text-gray-600"><strong>Симптомы:</strong> {visit.symptoms}</p>
              </div>
            )}

            {/* View Patient History Button */}
            <div className="pl-13 mt-3">
              <button
                onClick={() => fetchPatientConsultationHistory(visit.patient)}
                className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  color: 'white'
                }}
              >
                <FontAwesomeIcon icon={faFileLines} className="mr-2" />
                История консультаций
              </button>
            </div>
          </div>

          {/* Right side - Status & Actions */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-xl border font-semibold text-sm ${getStatusColor(visit.status)}`}>
              {getStatusText(visit.status)}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {showAcceptButton && (
                <button
                  onClick={() => handleAcceptAppointment(visit.id)}
                  disabled={acceptingId === visit.id}
                  className="px-4 py-2 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  {acceptingId === visit.id ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Принятие...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Принять
                    </>
                  )}
                </button>
              )}
              {!showAcceptButton && visit.status === 'assigned' && (
                <button
                  onClick={() => handleCompleteAppointment(visit.id)}
                  className="px-4 py-2 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}
                >
                  Завершить
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
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
