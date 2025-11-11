"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentMedical,
  faHistory,
  faFlask,
  faPrescription,
  faDiagnoses,
  faXmark
} from "@fortawesome/free-solid-svg-icons";

interface ConsultationFormData {
  complaints: string;
  anamnesis: string;
  diagnostics: string;
  treatment: string;
  diagnosis: string;
}

interface ConsultationFormProps {
  formData: ConsultationFormData;
  onUpdate: (field: keyof ConsultationFormData, value: string) => void;
  onClose?: () => void;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({
  formData,
  onUpdate,
  onClose
}) => {
  const formFields = [
    {
      key: 'complaints' as keyof ConsultationFormData,
      label: 'Жалобы пациента',
      placeholder: 'Опишите жалобы пациента: боли, симптомы, длительность...',
      icon: faCommentMedical,
      color: 'rose',
      rows: 3
    },
    {
      key: 'anamnesis' as keyof ConsultationFormData,
      label: 'Анамнез',
      placeholder: 'История заболевания: начало, развитие, перенесённые заболевания, аллергии...',
      icon: faHistory,
      color: 'amber',
      rows: 3
    },
    {
      key: 'diagnostics' as keyof ConsultationFormData,
      label: 'Диагностика',
      placeholder: 'Проведённые обследования, анализы, результаты...',
      icon: faFlask,
      color: 'cyan',
      rows: 3
    },
    {
      key: 'treatment' as keyof ConsultationFormData,
      label: 'Лечение и рекомендации',
      placeholder: 'Назначения: препараты, дозировки, режим приёма, рекомендации по образу жизни...',
      icon: faPrescription,
      color: 'blue',
      rows: 4
    },
    {
      key: 'diagnosis' as keyof ConsultationFormData,
      label: 'Диагноз',
      placeholder: 'Окончательный или предварительный диагноз по МКБ-10...',
      icon: faDiagnoses,
      color: 'emerald',
      rows: 2
    }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faDiagnoses} className="text-emerald-300 text-lg" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Консультационный лист</h3>
              <p className="text-white/60 text-xs">Заполните данные о консультации</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all flex items-center justify-center"
              title="Свернуть"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-4 space-y-4">
        {formFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg bg-${field.color}-600/20 flex items-center justify-center`}>
                <FontAwesomeIcon
                  icon={field.icon}
                  className={`text-${field.color}-400 text-xs`}
                />
              </div>
              <label className="text-white font-semibold text-sm">
                {field.label}
              </label>
            </div>
            <textarea
              value={formData[field.key]}
              onChange={(e) => onUpdate(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
              rows={field.rows}
            />
          </div>
        ))}
      </div>

      {/* Footer with info */}
      <div className="px-4 py-3 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Данные автоматически сохраняются при нажатии кнопки "Сохранить"</span>
        </div>
      </div>
    </div>
  );
};

export default ConsultationForm;
export type { ConsultationFormData };
