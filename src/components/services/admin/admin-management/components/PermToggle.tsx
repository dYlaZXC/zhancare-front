"use client";

import { CheckCircle, XCircle } from "lucide-react";

const PermToggle = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
      value
        ? "bg-blue-50 border-blue-300 text-blue-700"
        : "bg-gray-50 border-gray-200 text-gray-500"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}`}
  >
    {value ? (
      <CheckCircle className="w-4 h-4 text-blue-500" />
    ) : (
      <XCircle className="w-4 h-4 text-gray-400" />
    )}
    {label}
  </button>
);

export default PermToggle;
