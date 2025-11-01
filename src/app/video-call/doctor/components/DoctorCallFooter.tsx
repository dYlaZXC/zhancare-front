"use client";

import React, { useState } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNotesMedical,
  faPrescriptionBottle,
  faDownload,
  faSave,
  faShare,
  faStethoscope,
  faRecordVinyl,
  faStop,
  faCalendar,
  faHeartbeat,
  faClipboardList,
  faPrint,
  faUserMd
} from "@fortawesome/free-solid-svg-icons";

// Using shared Consultation type from @/types/consultation

interface DoctorCallFooterProps {
  handleEndCall: () => void;
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;
  consultation: Consultation;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const DoctorCallFooter: React.FC<DoctorCallFooterProps> = ({
  handleEndCall,
  sessionNotes,
  setSessionNotes,
  consultation,
  isRecording,
  onStartRecording,
  onStopRecording
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [prescription, setPrescription] = useState("");
  const [showPrescription, setShowPrescription] = useState(false);
  const [recommendations, setRecommendations] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);

  const saveConsultationData = () => {
    // Implement API call to save consultation notes, prescriptions, etc.
    // console.log("Saving consultation data:", {
    //   consultationId: consultation.id,
    //   sessionNotes,
    //   prescription,
    //   recommendations
    // });
  };

  const generateReport = () => {
    // Generate and download consultation report
    const reportData = {
      patient: consultation.patient_name,
      doctor: `${consultation.doctor_first_name} ${consultation.doctor_last_name}`,
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU'),
      meetingId: consultation.meeting_id,
      notes: sessionNotes,
      prescription,
      recommendations
    };

    // console.log("Generating report:", reportData);
  };

  return (
    <footer className="relative bg-slate-900/90 backdrop-blur-lg border-t border-white/10 px-4 sm:px-6 py-4">
      {/* Simple subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

      <div className="relative">
        {/* Main Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          {/* Left Side - Documentation Tools */}
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showNotes
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FontAwesomeIcon icon={faNotesMedical} className="text-sm" />
              <span className="hidden xs:inline">Заметки</span>
            </button>

            <button
              onClick={() => setShowPrescription(!showPrescription)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showPrescription
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FontAwesomeIcon icon={faPrescriptionBottle} className="text-sm" />
              <span className="hidden xs:inline">Рецепт</span>
            </button>

            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showRecommendations
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FontAwesomeIcon icon={faClipboardList} className="text-sm" />
              <span className="hidden xs:inline">Рекомендации</span>
            </button>

            {/* Recording Button */}
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                isRecording
                  ? 'bg-red-600 text-white shadow-lg animate-pulse'
                  : 'bg-gray-700 text-white hover:bg-gray-600 shadow-md'
              }`}
            >
              <FontAwesomeIcon icon={isRecording ? faStop : faRecordVinyl} className="text-sm" />
              <span className="hidden xs:inline">{isRecording ? 'Стоп' : 'Запись'}</span>
            </button>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
            <button
              onClick={saveConsultationData}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md"
            >
              <FontAwesomeIcon icon={faSave} className="text-sm" />
              <span className="hidden xs:inline">Сохранить</span>
            </button>

            <button
              onClick={generateReport}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md"
            >
              <FontAwesomeIcon icon={faDownload} className="text-sm" />
              <span className="hidden xs:inline">Отчет</span>
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg"
            >
              <FontAwesomeIcon icon={faStethoscope} className="text-sm" />
              <span>Завершить</span>
            </button>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">

          {/* Session Notes */}
          {showNotes && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faNotesMedical} className="text-emerald-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Заметки консультации</h3>
                  <p className="text-white/60 text-xs">Записи о ходе консультации</p>
                </div>
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Записывайте важные моменты консультации, симптомы пациента..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Prescription */}
          {showPrescription && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faPrescriptionBottle} className="text-blue-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Рецепт</h3>
                  <p className="text-white/60 text-xs">Назначенные препараты и дозировки</p>
                </div>
              </div>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Например: Парацетамол 500мг - по 1 таблетке 3 раза в день..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faClipboardList} className="text-purple-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Рекомендации</h3>
                  <p className="text-white/60 text-xs">Общие рекомендации и назначения</p>
                </div>
              </div>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Рекомендации по режиму, диете, дополнительным обследованиям..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Patient Info Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUserMd} className="text-emerald-400" />
              <span>Пациент: {consultation.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendar} className="text-blue-400" />
              <span>{new Date().toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faHeartbeat} className="text-rose-400" />
              <span>ID: {consultation.meeting_id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all text-xs"
              title="Распечатать"
            >
              <FontAwesomeIcon icon={faPrint} className="text-xs" />
              <span className="hidden sm:inline">Печать</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all text-xs"
              title="Поделиться"
            >
              <FontAwesomeIcon icon={faShare} className="text-xs" />
              <span className="hidden sm:inline">Поделиться</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DoctorCallFooter;