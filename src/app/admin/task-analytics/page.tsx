"use client";

import { useAuth } from "@/context/AuthContext";
import AdminTaskStatsView from "@/components/services/admin/tasks/AdminTaskStatsView";

export default function AdminTaskAnalyticsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-3 md:mb-6">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight truncate" style={{ color: "#1e263e" }}>
          Задачи админов
        </h1>
        <p className="hidden sm:block text-xs md:text-sm text-gray-500 mt-0.5 truncate">
          Нагрузка, выполнение и просрочки по каждому администратору
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AdminTaskStatsView user={user} />
      </div>
    </div>
  );
}
