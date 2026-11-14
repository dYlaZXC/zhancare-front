"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "@/utils/api";

interface ServiceOption { id: number; name: string; duration_minutes: number; capacity_per_slot: number | null; }
interface StaffOption { id: number; first_name: string; last_name: string; role: string; }

export function CreateClassSessionModal({
  defaultDate, onClose, onCreated,
}: {
  defaultDate: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState<number | "">("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [instructorIds, setInstructorIds] = useState<number[]>([]);
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/diagnostics/services/").then(res => setServices((res.data.results || res.data)));
    api.get("/staff/").then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setStaff(list.filter((m: StaffOption) => m.role === "doctor"));
    });
  }, []);

  const service = services.find(s => s.id === serviceId) || null;

  const toggleInstructor = (id: number) => {
    setInstructorIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
    if (!instructorIds.includes(id) && primaryId === null) setPrimaryId(id);
  };

  const submit = async () => {
    if (!service || instructorIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/subscriptions/class-sessions/", {
        service_id: service.id,
        starts_at: `${date}T${time}:00`,
        duration_minutes: duration || service.duration_minutes,
        capacity: capacity || service.capacity_per_slot || undefined,
        instructor_ids: instructorIds,
        primary_instructor_id: primaryId || instructorIds[0],
      });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось создать занятие");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>Новое занятие</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Услуга</label>
            <select value={serviceId ?? ""} onChange={e => setServiceId(Number(e.target.value) || null)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm">
              <option value="">Выберите услугу</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Время</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Длительность, мин</label>
              <input
                type="number" value={duration} placeholder={service ? String(service.duration_minutes) : ""}
                onChange={e => setDuration(Number(e.target.value) || "")} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Вместимость</label>
              <input
                type="number" value={capacity} placeholder={service?.capacity_per_slot ? String(service.capacity_per_slot) : "1"}
                onChange={e => setCapacity(Number(e.target.value) || "")} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Инструкторы</label>
            <div className="border-2 border-gray-200 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
              {staff.map(m => (
                <div key={m.id} className="flex items-center justify-between px-1 py-0.5">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={instructorIds.includes(m.id)} onChange={() => toggleInstructor(m.id)} />
                    {m.first_name} {m.last_name}
                  </label>
                  {instructorIds.includes(m.id) && (
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input type="radio" name="primary" checked={primaryId === m.id} onChange={() => setPrimaryId(m.id)} />
                      Основной
                    </label>
                  )}
                </div>
              ))}
              {staff.length === 0 && <p className="text-xs text-gray-400 px-1">Нет врачей</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600">Отмена</button>
          <button
            onClick={submit} disabled={saving || !service || instructorIds.length === 0}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            {saving ? "Создание..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
