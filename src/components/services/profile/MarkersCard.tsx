"use client";

import { Eye, Search, X } from "lucide-react";
import { InfoCard } from "./InfoCard";

export const MarkersCard = () => {
  return (
    <InfoCard title="Маркеры">
      <div className="flex items-center justify-center gap-6 py-4">
        <div className="relative flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
          <Eye className="w-6 h-6 text-blue-600" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            <X className="w-2 h-2" />
          </div>
        </div>
        <div className="relative flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full">
          <Search className="w-6 h-6 text-teal-600" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
            ✓
          </div>
        </div>
      </div>
    </InfoCard>
  );
};