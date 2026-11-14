"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "@/utils/api";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface ServiceOption { id: number; name: string; duration_minutes: number; capacity_per_slot: number | null; }
interface StaffOption { id: number; first_name: string; last_name: string; role: string; }

export function ClassSessionGenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [time, setTime] = useState("10:00");
  const [instructorIds, setInstructorIds] = useState<number[]>([]);
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number[]; failed: any[] } | null>(null);

  useEffect(() => {
    api.get("/diagnostics/services/").then(res => setServices(res.data.results || res.data));
    api.get("/staff/").then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setStaff(list.filter((m: StaffOption) => m.role === "doctor"));
    });
  }, []);

  const toggleWeekday = (d: number) => setWeekdays(ws => ws.includes(d) ? ws.filter(x => x !== d) : [...ws, d]);
  const toggleInstructor = (id: number) => {
    setInstructorIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
    if (primaryId === null) setPrimaryId(id);
  };

  const service = services.find(s => s.id === serviceId) || null;

  const submit = async () => {
    if (!service || weekdays.length === 0 || instructorIds.length === 0 || !dateFrom || !dateTo) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.post("/subscriptions/class-sessions/generate/", {
        service_id: service.id, weekdays, start_time: time, duration_minutes: service.duration_minutes,
        instructor_ids: instructorIds, primary_instructor_id: primaryId, capacity: service.capacity_per_slot,
        date_from: dateFrom, date_to: dateTo,
      });
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось сгенерировать расписание");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>Сгенерировать расписание</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">Создано занятий: <span className="font-semibold">{result.created.length}</span></p>
            {result.failed.length > 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Пропущено (конфликт времени): {result.failed.length}
              </div>
            )}
            <button onClick={() => { onGenerated(); onClose(); }} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}>
              Готово
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Услуга</label>
                <select value={serviceId ?? ""} onChange={e => setServiceId(Number(e.target.value) || null)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm">
                  <option value="">Выберите услугу</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Дни недели</label>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((label, i) => (
                    <button key={i} onClick={() => toggleWeekday(i)} className={`w-9 h-9 rounded-lg text-xs font-semibold ${weekdays.includes(i) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Время начала</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">С даты</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">По дату</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Инструкторы</label>
                <div className="border-2 border-gray-200 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
                  {staff.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm px-1 py-0.5">
                      <input type="checkbox" checked={instructorIds.includes(m.id)} onChange={() => toggleInstructor(m.id)} />
                      {m.first_name} {m.last_name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600">Отмена</button>
              <button
                onClick={submit} disabled={saving || !service || weekdays.length === 0 || instructorIds.length === 0 || !dateFrom || !dateTo}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
              >
                {saving ? "Генерация..." : "Сгенерировать"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
