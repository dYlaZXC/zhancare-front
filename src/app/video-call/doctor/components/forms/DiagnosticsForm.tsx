"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask } from "@fortawesome/free-solid-svg-icons";

interface DiagnosticsFormProps {
  value: string;
  onChange: (value: string) => void;
}

const DiagnosticsForm: React.FC<DiagnosticsFormProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#06b6d4' }}>
          <FontAwesomeIcon icon={faFlask} className="text-lg" style={{ color: '#ebf1ff' }} />
        </div>
        <div>
          <h3 className="font-semibold text-base" style={{ color: '#ebf1ff' }}>Диагностика</h3>
          <p className="text-xs" style={{ color: '#bcc0ca' }}>Проведённые обследования и анализы</p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Проведённые обследования, анализы, результаты..."
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
          💡 Совет: Укажите результаты анализов, инструментальных исследований, заключения специалистов
        </p>
      </div>
    </div>
  );
};

export default DiagnosticsForm;
