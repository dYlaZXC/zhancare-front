"use client";

import React, { useState } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
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
  faUserMd,
  faFlask
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
    <footer className="relative bg-gradient-to-r from-emerald-900/60 to-teal-900/60 backdrop-blur-md border-t border-emerald-400/20 px-6 py-4">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/5 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Main Control Bar */}
        <div className="flex items-center justify-between mb-4">

          {/* Left Section - Documentation Tools */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
                showNotes
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-emerald-600/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-600/30'
              }`}
            >
              <FontAwesomeIcon icon={faNotesMedical} />
              Заметки
            </button>

            <button
              onClick={() => setShowPrescription(!showPrescription)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
                showPrescription
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/20 text-blue-300 border-blue-400/30 hover:bg-blue-600/30'
              }`}
            >
              <FontAwesomeIcon icon={faPrescriptionBottle} />
              Рецепт
            </button>

            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
                showRecommendations
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-purple-600/20 text-purple-300 border-purple-400/30 hover:bg-purple-600/30'
              }`}
            >
              <FontAwesomeIcon icon={faClipboardList} />
              Рекомендации
            </button>
          </div>

          {/* Center Section - Recording */}
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 border-2 ${
                isRecording
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-gray-600 text-white border-gray-500 hover:bg-gray-700'
              }`}
            >
              <FontAwesomeIcon icon={isRecording ? faStop : faRecordVinyl} />
              {isRecording ? 'Остановить запись' : 'Начать запись'}
            </button>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={saveConsultationData}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-300 border-2 border-green-400"
            >
              <FontAwesomeIcon icon={faSave} />
              Сохранить
            </button>

            <button
              onClick={generateReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 border-2 border-indigo-400"
            >
              <FontAwesomeIcon icon={faDownload} />
              Отчет
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all duration-300 border-2 border-red-400 shadow-lg"
            >
              <FontAwesomeIcon icon={faStethoscope} />
              Завершить консультацию
            </button>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4">

          {/* Session Notes */}
          {showNotes && (
            <div className="bg-emerald-900/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faNotesMedical} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Заметки консультации</h3>
                  <p className="text-emerald-300 text-sm">Записи о ходе консультации</p>
                </div>
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Записывайте важные моменты консультации, симптомы пациента, предварительный диагноз..."
                className="w-full bg-black/30 border border-emerald-400/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all duration-300 resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Prescription */}
          {showPrescription && (
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faPrescriptionBottle} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Рецепт</h3>
                  <p className="text-blue-300 text-sm">Назначенные препараты и дозировки</p>
                </div>
              </div>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Например: Парацетамол 500мг - по 1 таблетке 3 раза в день после еды, курс 5 дней..."
                className="w-full bg-black/30 border border-blue-400/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && (
            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faClipboardList} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Рекомендации</h3>
                  <p className="text-purple-300 text-sm">Общие рекомендации и назначения</p>
                </div>
              </div>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Рекомендации по режиму, диете, дополнительным обследованиям, контрольным визитам..."
                className="w-full bg-black/30 border border-purple-400/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Patient Info Bar */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-white/70">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUserMd} className="text-emerald-300" />
              <span>Пациент: {consultation.patient_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="text-emerald-300" />
              <span>{new Date().toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHeartbeat} className="text-emerald-300" />
              <span>ID: {consultation.meeting_id}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-lg transition-all duration-300"
              title="Распечатать"
            >
              <FontAwesomeIcon icon={faPrint} className="text-xs" />
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-lg transition-all duration-300"
              title="Поделиться"
            >
              <FontAwesomeIcon icon={faShare} className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DoctorCallFooter;