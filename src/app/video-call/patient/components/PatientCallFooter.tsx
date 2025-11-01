"use client";

import React, { useState } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNotesMedical,
  faQuestionCircle,
  faSave,
  faShare,
  faPhone,
  faCalendar,
  faUser,
  faHeartbeat,
  faPrint,
  faThermometerHalf,
  faBookMedical
} from "@fortawesome/free-solid-svg-icons";

// Using shared Consultation type from @/types/consultation

interface PatientCallFooterProps {
  handleEndCall: () => void;
  patientNotes: string;
  setPatientNotes: (notes: string) => void;
  symptomsDescription: string;
  setSymptomsDescription: (symptoms: string) => void;
  consultation: Consultation;
}

const PatientCallFooter: React.FC<PatientCallFooterProps> = ({
  handleEndCall,
  patientNotes,
  setPatientNotes,
  symptomsDescription,
  setSymptomsDescription,
  consultation
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [questions, setQuestions] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);

  const savePatientData = () => {
    // Implement API call to save patient notes, symptoms, questions
    // console.log("Saving patient data:", {
    //   consultationId: consultation.id,
    //   patientNotes,
    //   symptomsDescription,
    //   questions
    // });
  };

  const requestSummary = () => {
    // Request consultation summary from doctor
    // console.log("Requesting consultation summary");
  };

  return (
    <footer className="relative bg-slate-900/90 backdrop-blur-lg border-t border-white/10 px-4 sm:px-6 py-4">
      {/* Simple subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

      <div className="relative">
        {/* Main Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          {/* Left Side - Tool Buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <button
              onClick={() => setShowSymptoms(!showSymptoms)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showSymptoms
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FontAwesomeIcon icon={faThermometerHalf} className="text-sm" />
              <span className="hidden xs:inline">Симптомы</span>
            </button>

            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showQuestions
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FontAwesomeIcon icon={faQuestionCircle} className="text-sm" />
              <span className="hidden xs:inline">Вопросы</span>
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showNotes
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FontAwesomeIcon icon={faNotesMedical} className="text-sm" />
              <span className="hidden xs:inline">Заметки</span>
            </button>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
            <button
              onClick={savePatientData}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md"
            >
              <FontAwesomeIcon icon={faSave} className="text-sm" />
              <span className="hidden xs:inline">Сохранить</span>
            </button>

            <button
              onClick={requestSummary}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md"
            >
              <FontAwesomeIcon icon={faBookMedical} className="text-sm" />
              <span className="hidden xs:inline">Резюме</span>
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg"
            >
              <FontAwesomeIcon icon={faPhone} className="text-sm" />
              <span>Завершить</span>
            </button>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">

          {/* Symptoms Description */}
          {showSymptoms && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faThermometerHalf} className="text-orange-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Описание симптомов</h3>
                  <p className="text-white/60 text-xs">Расскажите врачу о ваших симптомах</p>
                </div>
              </div>
              <textarea
                value={symptomsDescription}
                onChange={(e) => setSymptomsDescription(e.target.value)}
                placeholder="Опишите когда начались симптомы, как они проявляются..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Questions for Doctor */}
          {showQuestions && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faQuestionCircle} className="text-purple-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Вопросы врачу</h3>
                  <p className="text-white/60 text-xs">Что вы хотите спросить у врача?</p>
                </div>
              </div>
              <textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="Например: Сколько времени займет лечение?..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Patient Notes */}
          {showNotes && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faNotesMedical} className="text-blue-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Личные заметки</h3>
                  <p className="text-white/60 text-xs">Ваши записи о консультации</p>
                </div>
              </div>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Записывайте важные моменты консультации..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Patient Info Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-blue-400" />
              <span>Пациент: {consultation.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendar} className="text-emerald-400" />
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

        {/* Patient Support Message */}
        {/* <div className="mt-4 p-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl border border-blue-400/20">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faHandHoldingMedical} className="text-blue-300 text-lg" />
            <div>
              <p className="text-white font-medium text-sm">Мы заботимся о вашем здоровье</p>
              <p className="text-blue-300 text-xs mt-1">
                Если у вас есть срочные вопросы после консультации, обратитесь к службе поддержки
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </footer>
  );
};

export default PatientCallFooter;