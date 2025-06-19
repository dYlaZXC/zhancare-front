"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorAlertProps {
  error: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  if (!error) return null;

  const lines = error.split(/[.]\s*/).filter(Boolean); // split by period & trim

  return (
    <div className="bg-red-100 text-red-700 rounded-lg p-3 mt-3 text-sm shadow-sm">
      {lines.map((line, index) => (
        <p key={index} className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 mt-[2px]" />
          {line.trim()}
        </p>
      ))}
    </div>
  );
};

export default ErrorAlert;
