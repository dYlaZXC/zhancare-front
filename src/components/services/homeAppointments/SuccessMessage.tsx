"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

const SuccessMessage: React.FC = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-green-700 mb-2">
        Вызов успешно оформлен!
      </h2>
      <p className="text-green-700">
        Ожидайте прибытия специалиста в выбранное время.
      </p>
    </div>
  );
};

export default SuccessMessage;
