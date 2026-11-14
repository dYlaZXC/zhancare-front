"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Plus, CalendarRange, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { CreateClassSessionModal } from "./CreateClassSessionModal";
import { ClassSessionGenerateModal } from "./ClassSessionGenerateModal";
import { ClassSessionDetailModal } from "./ClassSessionDetailModal";
import { AddParticipantModal } from "./AddParticipantModal";

const STATUS_COLOR: Record<string, string> = {
  scheduled: "text-blue-600 bg-blue-50", in_progress: "text-amber-600 bg-amber-50",
  completed: "text-emerald-600 bg-emerald-50", cancelled: "text-red-500 bg-red-50",
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ClassSessionsView() {
  const [date, setDate] = useState(toISODate(new Date()));
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [addingParticipant, setAddingParticipant] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/subscriptions/class-sessions/", { params: { date } });
      setSessions(data.results || data);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(toISODate(d));
  };

  const reloadDetail = async () => {
    if (!detail) return;
    const { data } = await api.get(`/subscriptions/class-sessions/${detail.id}/`);
    setDetail(data);
    load();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Групповые занятия</h1>
          <p className="text-gray-600">Расписание и учёт посещений</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <CalendarRange className="w-4 h-4" /> Сгенерировать
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            <Plus className="w-4 h-4" /> Создать занятие
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-sm" />
        <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Загрузка...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            На этот день занятий не запланировано
          </div>
        ) : (
          sessions.map(s => (
            <button
              key={s.id} onClick={() => setDetail(s)}
              className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-center w-14">
                  <p className="text-sm font-bold text-gray-900">{new Date(s.starts_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.service_name}</p>
                  <p className="text-xs text-gray-400">{s.instructors.map((i: any) => i.instructor_name).join(", ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                  <Users className="w-3.5 h-3.5" /> {s.booked_count}/{s.capacity}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status]}`}>{s.status}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {showCreate && (
        <CreateClassSessionModal defaultDate={date} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
      {showGenerate && (
        <ClassSessionGenerateModal onClose={() => setShowGenerate(false)} onGenerated={load} />
      )}
      {detail && (
        <>
          <ClassSessionDetailModal
            session={detail}
            onClose={() => setDetail(null)}
            onUpdated={() => { reloadDetail(); }}
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
