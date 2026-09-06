"use client";

import React from "react";

// Preserves the helpful per-field tips the legacy fixed 8-section form had,
// keyed by section key so a clinic's default (legacy-compatible) template
// still shows them — a custom key just gets no tip, which is fine.
const LEGACY_TIPS: Record<string, string> = {
  complaints: "Укажите локализацию, характер боли, время появления симптомов",
  anamnesis: "Укажите перенесённые заболевания, аллергии, хронические состояния, наследственность",
  treatment: "Укажите название препарата, дозировку, кратность приёма, длительность курса, рекомендации по диете и режиму",
  diagnosis: "Укажите код по МКБ-10, степень тяжести, осложнения при наличии",
};

interface GenericSectionFormProps {
  sectionKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const GenericSectionForm: React.FC<GenericSectionFormProps> = ({ sectionKey, value, onChange, placeholder }) => {
  const tip = LEGACY_TIPS[sectionKey];
  return (
    <div className="h-full flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Заполните этот раздел..."}
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

      {tip && (
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#1e263e' }}>
          <p className="text-xs" style={{ color: '#bcc0ca' }}>
            💡 Совет: {tip}
          </p>
        </div>
      )}
    </div>
  );
};

export default GenericSectionForm;
