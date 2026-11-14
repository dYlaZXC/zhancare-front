"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Users, CalendarClock } from "lucide-react";
import { ClassSessionDetailModal } from "@/components/services/admin/subscriptions/ClassSessionDetailModal";
import { AddParticipantModal } from "@/components/services/admin/subscriptions/AddParticipantModal";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Запланировано", in_progress: "Проводится", completed: "Завершено", cancelled: "Отменено",
};
const STATUS_COLOR: Record<string, string> = {
  scheduled: "text-blue-600 bg-blue-50", in_progress: "text-amber-600 bg-amber-50",
  completed: "text-emerald-600 bg-emerald-50", cancelled: "text-red-500 bg-red-50",
};

export default function MyClassSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any | null>(null);
  const [addingParticipant, setAddingParticipant] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/subscriptions/my-sessions/");
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reloadDetail = async () => {
    if (!detail) return;
    const { data } = await api.get(`/subscriptions/class-sessions/${detail.id}/`);
    setDetail(data);
    load();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Мои занятия</h1>
        <p className="text-gray-600">Групповые занятия, где вы назначены инструктором</p>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Загрузка...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            Нет назначенных занятий
          </div>
        ) : (
          sessions.map(s => (
            <button
              key={s.id} onClick={() => setDetail(s)}
              className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-4">
                <CalendarClock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.service_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.starts_at).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                  <Users className="w-3.5 h-3.5" /> {s.booked_count}/{s.capacity}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {detail && (
        <>
          <ClassSessionDetailModal
            session={detail}
            onClose={() => setDetail(null)}
            onUpdated={reloadDetail}
            onAddParticipant={() => setAddingParticipant(true)}
          />
          {addingParticipant && (
            <AddParticipantModal
              classSessionId={detail.id}
              onClose={() => setAddingParticipant(false)}
              onAdded={() => { setAddingParticipant(false); reloadDetail(); }}
            />
          )}
        </>
      )}
    </div>
  );
}
