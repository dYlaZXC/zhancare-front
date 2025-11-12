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
    <div className="backdrop-blur-sm rounded-xl border overflow-hidden" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ backgroundColor: '#283353', borderColor: '#2956bf' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
              <FontAwesomeIcon icon={faDiagnoses} className="text-lg" style={{ color: '#ebf1ff' }} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: '#ebf1ff' }}>Консультационный лист</h3>
              <p className="text-xs" style={{ color: '#bcc0ca' }}>Заполните данные о консультации</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg transition-all flex items-center justify-center"
              style={{ backgroundColor: '#202942', color: '#bcc0ca' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#242e4b';
                e.currentTarget.style.color = '#ebf1ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#202942';
                e.currentTarget.style.color = '#bcc0ca';
              }}
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
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                <FontAwesomeIcon
                  icon={field.icon}
                  className="text-xs"
                  style={{ color: '#ebf1ff' }}
                />
              </div>
              <label className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>
                {field.label}
              </label>
            </div>
            <textarea
              value={formData[field.key]}
              onChange={(e) => onUpdate(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full border rounded-lg px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#1e263e',
                borderColor: '#283353',
                color: '#ebf1ff',
                caretColor: '#3772ff'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3772ff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#283353';
                e.currentTarget.style.boxShadow = 'none';
              }}
              rows={field.rows}
            />
          </div>
        ))}
      </div>

      {/* Footer with info */}
      <div className="px-4 py-3 border-t" style={{ backgroundColor: '#181732', borderColor: '#283353' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#bcc0ca' }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Данные автоматически сохраняются при нажатии кнопки &ldquo;Сохранить&rdquo;</span>
        </div>
      </div>
    </div>
  );
};

export default ConsultationForm;
export type { ConsultationFormData };
