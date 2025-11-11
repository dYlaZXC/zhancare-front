"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileWaveform,
  faXmark,
  faSave,
  faDownload,
  faChevronLeft,
  faChevronRight,
  faNotesMedical,
  faPrescriptionBottle,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";
import ConsultationForm, { ConsultationFormData } from "./ConsultationForm";
import { Consultation } from "@/types/consultation";

interface FloatingConsultationButtonProps {
  consultation: Consultation;
  onSave?: (data: ConsultationFormData & {
    sessionNotes: string;
    prescription: string;
    recommendations: string;
  }) => void;
  onGenerateReport?: (data: ConsultationFormData & {
    sessionNotes: string;
    prescription: string;
    recommendations: string;
  }) => void;
}

const FloatingConsultationButton: React.FC<FloatingConsultationButtonProps> = ({
  consultation,
  onSave,
  onGenerateReport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultation' | 'notes' | 'prescription' | 'recommendations'>('consultation');

  const [consultationFormData, setConsultationFormData] = useState<ConsultationFormData>({
    complaints: '',
    anamnesis: '',
    diagnostics: '',
    treatment: '',
    diagnosis: ''
  });

  // Additional notes sections
  const [sessionNotes, setSessionNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const handleFormUpdate = (field: keyof ConsultationFormData, value: string) => {
    setConsultationFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const allData = {
      ...consultationFormData,
      sessionNotes,
      prescription,
      recommendations
    };
    if (onSave) {
      onSave(allData);
    }
    console.log("Saving consultation data:", allData);
  };

  const handleGenerateReport = () => {
    const allData = {
      ...consultationFormData,
      sessionNotes,
      prescription,
      recommendations
    };
    if (onGenerateReport) {
      onGenerateReport(allData);
    }
    console.log("Generating report with data:", allData);
  };

  // Check if any field has content
  const hasContent = Object.values(consultationFormData).some(value => value.trim() !== '') ||
                     sessionNotes.trim() !== '' ||
                     prescription.trim() !== '' ||
                     recommendations.trim() !== '';

  // Check content for each tab
  const hasConsultationContent = Object.values(consultationFormData).some(value => value.trim() !== '');
  const hasNotesContent = sessionNotes.trim() !== '';
  const hasPrescriptionContent = prescription.trim() !== '';
  const hasRecommendationsContent = recommendations.trim() !== '';

  const tabs = [
    {
      id: 'consultation' as const,
      label: 'Консультационный лист',
      icon: faFileWaveform,
      hasFilled: hasConsultationContent
    },
    {
      id: 'notes' as const,
      label: 'Заметки',
      icon: faNotesMedical,
      hasFilled: hasNotesContent
    },
    {
      id: 'prescription' as const,
      label: 'Рецепт',
      icon: faPrescriptionBottle,
      hasFilled: hasPrescriptionContent
    },
    {
      id: 'recommendations' as const,
      label: 'Рекомендации',
      icon: faClipboardList,
      hasFilled: hasRecommendationsContent
    }
  ];

  return (
    <>
      {/* Floating Button - только когда форма закрыта */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-24 z-50 group"
          title="Открыть консультационный лист"
        >
          <div className="relative">
            {/* Animated ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></div>

            {/* Button */}
            <div className="relative flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105">
              <FontAwesomeIcon icon={faFileWaveform} className="text-white text-xl" />
              <span className="text-white font-bold text-sm">Консультационный лист</span>
            </div>

            {/* Badge if has content */}
            {hasContent && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </button>
      )}

      {/* Sidebar Panel */}
      {isOpen && (
        <>
          {/* Sidebar - No backdrop so doctor can see patient video */}
          <div className={`fixed right-0 top-0 h-full bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 transition-all duration-300 ${
            isMinimized ? 'w-16' : 'w-full sm:w-[500px]'
          }`}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-600/20 to-blue-600/20">
              {!isMinimized && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileWaveform} className="text-emerald-300 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Консультационный лист</h2>
                    <p className="text-white/60 text-xs">{consultation.patient_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Minimize/Maximize button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                  title={isMinimized ? "Развернуть" : "Свернуть"}
                >
                  <FontAwesomeIcon icon={isMinimized ? faChevronLeft : faChevronRight} className="text-sm" />
                </button>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all flex items-center justify-center"
                  title="Закрыть"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-sm" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="flex flex-col h-[calc(100%-140px)] overflow-hidden">
                {/* Tabs Navigation */}
                <div className="px-4 pt-4 pb-2 border-b border-white/10">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <FontAwesomeIcon icon={tab.icon} className="text-sm" />
                        <span>{tab.label}</span>
                        {tab.hasFilled && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {/* Consultation Form Tab */}
                  {activeTab === 'consultation' && (
                    <div className="h-full">
                      <ConsultationForm
                        formData={consultationFormData}
                        onUpdate={handleFormUpdate}
                      />
                    </div>
                  )}

                  {/* Session Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                          <FontAwesomeIcon icon={faNotesMedical} className="text-emerald-400 text-sm" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm">Заметки консультации</h3>
                          <p className="text-white/60 text-xs">Дополнительные записи о ходе консультации</p>
                        </div>
                      </div>
                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Записывайте важные моменты консультации, симптомы пациента..."
                        className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
                      />
                    </div>
                  )}

                  {/* Prescription Tab */}
                  {activeTab === 'prescription' && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 h-full flex flex-col">
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
                        className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                      />
                    </div>
                  )}

                  {/* Recommendations Tab */}
                  {activeTab === 'recommendations' && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 h-full flex flex-col">
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
                        className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/30 transition-all resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-4 border-t border-white/10 bg-slate-900/50 space-y-3">
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 hover:scale-105"
                    >
                      <FontAwesomeIcon icon={faSave} className="text-sm" />
                      <span>Сохранить</span>
                    </button>

                    <button
                      onClick={handleGenerateReport}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                    >
                      <FontAwesomeIcon icon={faDownload} className="text-sm" />
                      <span>Отчет</span>
                    </button>
                  </div>

                  {/* Info text */}
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Данные сохраняются в базу данных</span>
                  </div>
                </div>
              </div>
            )}

            {/* Minimized state - show vertical text */}
            {isMinimized && (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="transform -rotate-90 whitespace-nowrap">
                  <span className="text-white font-semibold text-sm">Консультационный лист</span>
                </div>
                {hasContent && (
                  <div className="mt-8 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
              </div>
            )}

            {/* Custom Scrollbar */}
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(16, 185, 129, 0.3);
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(16, 185, 129, 0.5);
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingConsultationButton;
