"use client";

import React from "react";
import { CalendarCheck } from "lucide-react";

const TipsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 space-y-2">
      <h3 className="text-md font-semibold text-[#001E80] flex items-center gap-2">
        <CalendarCheck className="w-5 h-5" />
        Советы перед вызовом врача
      </h3>
      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
        <li>Укажите правильный адрес</li>
        <li>Доктор приедет в выбранное время</li>
        <li>Будьте на связи для подтверждения</li>
      </ul>
    </div>
  );
};

export default TipsCard;
