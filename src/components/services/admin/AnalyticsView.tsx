"use client";

import ReportsView from "./ReportsView";
import ActivityView from "./ActivityView";

export type AnalyticsModule = "reports" | "activity";

export default function AnalyticsView({ user, module }: { user: any; module: AnalyticsModule }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-3 md:mb-6">
        <div className="flex items-center justify-between gap-2 mb-3 md:mb-5">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight truncate" style={{ color: '#1e263e' }}>
              Аналитика
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-gray-500 mt-0.5 truncate">
              Отчёты и активность — реальные данные
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {module === "reports" && <ReportsView user={user} />}
        {module === "activity" && <ActivityView user={user} />}
      </div>
    </div>
  );
}
