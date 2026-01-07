"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiagnoses } from "@fortawesome/free-solid-svg-icons";

interface DiagnosisFormProps {
  value: string;
  onChange: (value: string) => void;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
          <FontAwesomeIcon icon={faDiagnoses} className="text-lg" style={{ color: '#ebf1ff' }} />
        </div>
        <div>
          <h3 className="font-semibold text-base" style={{ color: '#ebf1ff' }}>Диагноз</h3>
          <p className="text-xs" style={{ color: '#bcc0ca' }}>Окончательный или предварительный диагноз</p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Окончательный или предварительный диагноз по МКБ-10..."
        className="flex-1 w-full border rounded-xl px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:ring-2"
        style={{
          backgroundColor: '#1e263e',
          borderColor: '#283353',
          color: '#ebf1ff',
          caretColor: '#3772ff',
          minHeight: '200px'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3772ff';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#283353';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#1e263e' }}>
        <p className="text-xs" style={{ color: '#bcc0ca' }}>
          💡 Совет: Укажите код по МКБ-10, степень тяжести, осложнения при наличии
        </p>
      </div>
    </div>
  );
};

export default DiagnosisForm;
