"use client";
import React from "react";

interface Props {
  label: string;
  value: string;
  editable: boolean;
  onChange: (val: string) => void;
  error?: string;
}

const InfoField: React.FC<Props> = ({ label, value, editable, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">{label}</label>
    {editable ? (
      <input
        className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 text-sm px-1 py-1 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
    )}
  </div>
);

export default InfoField;
