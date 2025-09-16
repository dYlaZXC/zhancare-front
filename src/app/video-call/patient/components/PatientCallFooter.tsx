"use client";

import React, { useState } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faNotesMedical,
  faQuestionCircle,
  faDownload,
  faSave,
  faShare,
  faPhone,
  faCalendar,
  faUser,
  faHeartbeat,
  faPrint,
  faHandHoldingMedical,
  faThermometerHalf,
  faClipboardList,
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
    console.log("Saving patient data:", {
      consultationId: consultation.id,
      patientNotes,
      symptomsDescription,
      questions
    });
  };

  const requestSummary = () => {
    // Request consultation summary from doctor
    console.log("Requesting consultation summary");
  };

  return (
    <footer className="relative bg-gradient-to-r from-blue-900/60 to-indigo-900/60 backdrop-blur-md border-t border-blue-400/20 px-6 py-4">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/5 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Main Control Bar */}
        <div className="flex items-center justify-between mb-4">

          {/* Left Section - Patient Tools */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSymptoms(!showSymptoms)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
                showSymptoms
                  ? 'bg-orange-600 text-white border-orange-400'
                  : 'bg-orange-600/20 text-orange-300 border-orange-400/30 hover:bg-orange-600/30'
              }`}
            >
              <FontAwesomeIcon icon={faThermometerHalf} />
              Симптомы
            </button>

            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
                showQuestions
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-purple-600/20 text-purple-300 border-purple-400/30 hover:bg-purple-600/30'
              }`}
            >
              <FontAwesomeIcon icon={faQuestionCircle} />
              Вопросы
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
                showNotes
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/20 text-blue-300 border-blue-400/30 hover:bg-blue-600/30'
              }`}
            >
              <FontAwesomeIcon icon={faNotesMedical} />
              Заметки
            </button>
          </div>

          {/* Center Section - Patient Support */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-xl border border-blue-400/30">
              <FontAwesomeIcon icon={faHeart} className="text-blue-300 animate-pulse" />
              <span className="text-white text-sm font-medium">Ваше здоровье важно</span>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={savePatientData}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-300 border-2 border-green-400"
            >
              <FontAwesomeIcon icon={faSave} />
              Сохранить
            </button>

            <button
              onClick={requestSummary}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 border-2 border-indigo-400"
            >
              <FontAwesomeIcon icon={faBookMedical} />
              Получить резюме
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all duration-300 border-2 border-red-400 shadow-lg"
            >
              <FontAwesomeIcon icon={faPhone} />
              Завершить
            </button>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4">

          {/* Symptoms Description */}
          {showSymptoms && (
            <div className="bg-orange-900/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faThermometerHalf} className="text-orange-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Описание симптомов</h3>
                  <p className="text-orange-300 text-sm">Расскажите врачу о ваших симптомах</p>
                </div>
              </div>
              <textarea
                value={symptomsDescription}
                onChange={(e) => setSymptomsDescription(e.target.value)}
                placeholder="Опишите когда начались симптомы, как они проявляются, что их усиливает или облегчает..."
                className="w-full bg-black/30 border border-orange-400/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all duration-300 resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Questions for Doctor */}
          {showQuestions && (
            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faQuestionCircle} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Вопросы врачу</h3>
                  <p className="text-purple-300 text-sm">Что вы хотите спросить у врача?</p>
                </div>
              </div>
              <textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="Например: Сколько времени займет лечение? Есть ли побочные эффекты? Когда нужен повторный визит?..."
                className="w-full bg-black/30 border border-purple-400/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Patient Notes */}
          {showNotes && (
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faNotesMedical} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Личные заметки</h3>
                  <p className="text-blue-300 text-sm">Ваши записи о консультации</p>
                </div>
              </div>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Записывайте важные моменты консультации, рекомендации врача, названия препаратов..."
                className="w-full bg-black/30 border border-blue-400/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Patient Info Bar */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-white/70">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-blue-300" />
              <span>Пациент: {consultation.patient_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="text-blue-300" />
              <span>{new Date().toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHeartbeat} className="text-blue-300" />
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

        {/* Patient Support Message */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl border border-blue-400/20">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faHandHoldingMedical} className="text-blue-300 text-lg" />
            <div>
              <p className="text-white font-medium text-sm">Мы заботимся о вашем здоровье</p>
              <p className="text-blue-300 text-xs mt-1">
                Если у вас есть срочные вопросы после консультации, обратитесь к службе поддержки
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PatientCallFooter;