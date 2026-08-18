"use client";

import React from "react";

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
