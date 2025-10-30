"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { Consultation } from "@/types/consultation";

// Patient-specific components
import PatientVideoHeader from "./components/PatientVideoHeader";
import PatientVideoFrame from "./components/PatientVideoFrame";
import PatientCallFooter from "./components/PatientCallFooter";

const PatientVideoCallPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if not a patient
  useEffect(() => {
    if (user && user.role !== "patient") {
      router.push(`/video-call/doctor?${window.location.search}`);
      return;
    }
  }, [user, router]);

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [consultationError, setConsultationError] = useState<string | null>(null);
  const [patientNotes, setPatientNotes] = useState("");
  const [symptomsDescription, setSymptomsDescription] = useState("");

  const safeUserName = user?.first_name || user?.email?.split("@")[0] || "patient";
  const userEmail = user?.email || `${safeUserName.toLowerCase().replace(/\\s+/g, "")}@example.com`;

  // Get doctor name for patient interface
  const doctorName = consultation
    ? `${consultation.doctor_first_name} ${consultation.doctor_last_name}`.trim() || "Доктор"
    : "Доктор";

  // Fetch consultation data from API using meetingId
  useEffect(() => {
    const fetchConsultationData = async () => {
      try {
        setConsultationLoading(true);
        setConsultationError(null);

        // Get meetingId from URL
        const params = new URLSearchParams(window.location.search);
        const meetingIdParam = params.get("meetingId");

        if (!meetingIdParam) {
          setConsultationError("Meeting ID не найден в URL");
          return;
        }

        setMeetingId(meetingIdParam);

        // Fetch consultation data from API
        const response = await api.get(`/consultations/?meeting_id=${meetingIdParam}`);

        if (response.data && response.data.length > 0) {
          setConsultation(response.data[0]);
        } else {
          setConsultationError("Консультация не найдена");
        }
      } catch (err: any) {
        console.error('Error fetching consultation data:', err);
        setConsultationError("Ошибка загрузки данных консультации");
      } finally {
        setConsultationLoading(false);
      }
    };

    fetchConsultationData();
  }, []);

  const handleEndCall = () => {
    router.push("/video");
  };

  // Loading or error states
  if (consultationLoading) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-600/30 border-2 border-blue-400/50 backdrop-blur-sm shadow-xl shadow-blue-500/20">
            <Loader2 className="animate-spin w-12 h-12 text-blue-300" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Загрузка консультации</h2>
          <p className="text-lg text-slate-200 mb-6">Получаем информацию о вашей встрече...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-75 shadow-lg shadow-indigo-500/50"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-150 shadow-lg shadow-purple-500/50"></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  if (consultationError) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-orange-900/20 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-600/20 border-2 border-red-400/30 backdrop-blur-sm">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
          <p className="text-red-200/90 mb-6">{consultationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 border-2 border-blue-400/50 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить страницу
          </button>
          <p className="text-xs text-white/60 mt-6">
            Если проблема повторяется, обратитесь в службу поддержки
          </p>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  if (!meetingId || !consultation) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-indigo-900/20 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border-2 border-blue-400/30 backdrop-blur-sm">
            <Loader2 className="animate-spin w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Подготовка встречи</h2>
          <p className="text-blue-200/90 mb-6">Загружаем данные встречи...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col">
      <div className="sticky top-0 z-20">
        <PatientVideoHeader
          meetingId={meetingId}
          doctorName={doctorName}
          consultation={consultation}
        />
      </div>

      <div className="w-full p-4" style={{ height: 'calc(100vh - 180px)' }}>
        <PatientVideoFrame
          meetingId={meetingId}
          safeUserName={safeUserName}
          userEmail={userEmail}
          onDisconnect={handleEndCall}
          doctorName={doctorName}
        />
      </div>

      <PatientCallFooter
        handleEndCall={handleEndCall}
        patientNotes={patientNotes}
        setPatientNotes={setPatientNotes}
        symptomsDescription={symptomsDescription}
        setSymptomsDescription={setSymptomsDescription}
        consultation={consultation}
      />
    </div>
  );
};

const PatientVideoCall: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-screen text-blue-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        Подключение к консультации...
      </div>
    }
  >
    <PatientVideoCallPage />
  </Suspense>
);

export default PatientVideoCall;