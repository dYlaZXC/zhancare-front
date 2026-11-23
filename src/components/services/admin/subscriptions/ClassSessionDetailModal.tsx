"use client";

import { useState } from "react";
import { X, Check, XCircle, UserPlus, QrCode } from "lucide-react";
import { api } from "@/utils/api";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Запланировано", in_progress: "Проводится", completed: "Завершено", cancelled: "Отменено",
};

export function ClassSessionDetailModal({
  session, onClose, onUpdated, onAddParticipant,
}: {
  session: any;
  onClose: () => void;
  onUpdated: () => void;
  onAddParticipant?: () => void;
}) {
  const [attendance, setAttendance] = useState<Record<number, "attended" | "no_show">>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMark = (id: number, mark: "attended" | "no_show") =>
    setAttendance(a => ({ ...a, [id]: mark }));

  const complete = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/subscriptions/class-sessions/${session.id}/complete/`, { attendance });
      onUpdated();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось завершить занятие");
    } finally {
      setBusy(false);
    }
  };

  const cancelSession = async () => {
    setBusy(true);
    try {
      await api.post(`/subscriptions/class-sessions/${session.id}/cancel/`);
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const active = session.participants.filter((p: any) => p.status !== "cancelled");
  const isDone = session.status === "completed" || session.status === "cancelled";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>{session.service_name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(session.starts_at).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })} · {STATUS_LABEL[session.status]}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            Инструкторы: {session.instructors.map((i: any) => i.instructor_name).join(", ")}
          </p>
          <p className="text-xs font-semibold text-gray-700">{session.booked_count}/{session.capacity} мест</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Участники</p>
          {!isDone && onAddParticipant && (
            <button onClick={onAddParticipant} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
              <UserPlus className="w-3.5 h-3.5" /> Добавить
            </button>
          )}
        </div>

        <div className="space-y-1.5 mb-4">
          {active.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-800 flex items-center gap-1.5">
                {p.patient_name}
                {p.checked_in && (
                  <QrCode className="w-3.5 h-3.5 text-emerald-500" aria-label="Отметился по QR" />
                )}
              </span>
              {!isDone ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMark(p.id, "attended")}
                    className={`p-1.5 rounded-lg ${attendance[p.id] === "attended" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  ><Check className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => setMark(p.id, "no_show")}
                    className={`p-1.5 rounded-lg ${attendance[p.id] === "no_show" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  ><XCircle className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <span className="text-xs text-gray-400">{p.status === "completed" ? "Пришёл" : "Отменено"}</span>
              )}
            </div>
          ))}
          {active.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Нет записанных участников</p>}
        </div>

        {!isDone && (
          <div className="flex gap-2">
            <button onClick={cancelSession} disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-red-200 text-sm font-medium text-red-500 hover:bg-red-50">
              Отменить занятие
            </button>
            <button
              onClick={complete} disabled={busy || active.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
            >
              Завершить занятие
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
