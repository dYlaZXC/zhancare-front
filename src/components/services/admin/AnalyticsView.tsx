"use client";

import { useState } from "react";
import { BarChart3, History, Route } from "lucide-react";
import ReportsView from "./ReportsView";
import ActivityView from "./ActivityView";
import PatientJourneyView from "./PatientJourneyView";

type Tab = "reports" | "activity" | "journey";

export default function AnalyticsView({ user, initialTab = "reports" }: { user: any; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-3 md:mb-6">
        <div className="flex items-center justify-between gap-2 mb-3 md:mb-5">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight truncate" style={{ color: '#1e263e' }}>
              Аналитика
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-gray-500 mt-0.5 truncate">
              Отчёты, активность и путь пациента — реальные данные
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide w-fit max-w-full">
          {([
            { id: "reports", label: "Отчёты", icon: BarChart3 },
            { id: "activity", label: "Активность", icon: History },
            { id: "journey", label: "Путь пациента", icon: Route },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-2.5 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1 md:gap-1.5 whitespace-nowrap flex-shrink-0 ${
                tab === t.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <t.icon className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === "reports" && <ReportsView user={user} />}
        {tab === "activity" && <ActivityView user={user} />}
        {tab === "journey" && <PatientJourneyView user={user} />}
      </div>
    </div>
  );
}
