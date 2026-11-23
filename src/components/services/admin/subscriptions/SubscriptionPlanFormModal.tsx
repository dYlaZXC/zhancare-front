"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "@/utils/api";

export interface SubscriptionPlan {
  id: number;
  name: string;
  plan_type: "session" | "duration" | "hybrid";
  duration_mode: "calendar" | "day_package" | null;
  sessions_count: number | null;
  duration_days: number | null;
  day_package_count: number | null;
  price: number;
  currency: string;
  services: number[];
  allow_freeze: boolean;
  max_freeze_days: number | null;
  activation_mode: "first_visit" | "purchase_date";
  is_active: boolean;
}

interface ServiceOption { id: number; name: string; }

const EMPTY: Omit<SubscriptionPlan, "id"> = {
  name: "", plan_type: "hybrid", duration_mode: "calendar",
  sessions_count: 12, duration_days: 30, day_package_count: null,
  price: 0, currency: "KZT", services: [], allow_freeze: false,
  max_freeze_days: null, activation_mode: "first_visit", is_active: true,
};

export function SubscriptionPlanFormModal({
  initial, services, onClose, onSaved,
}: {
  initial: SubscriptionPlan | null;
  services: ServiceOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<SubscriptionPlan, "id">>(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(initial || EMPTY); }, [initial]);

  const update = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }));

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await api.patch(`/subscriptions/plans/${initial.id}/`, form);
      } else {
        await api.post("/subscriptions/plans/", form);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось сохранить тариф");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>
            {initial ? "Редактировать тариф" : "Новый тариф"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Название</label>
            <input
              value={form.name} onChange={e => update({ name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Тип абонемента</label>
            <select
              value={form.plan_type}
              onChange={e => update({ plan_type: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
            >
              <option value="session">По количеству занятий</option>
              <option value="duration">По количеству дней</option>
              <option value="hybrid">Комбинированный</option>
            </select>
          </div>

          {(form.plan_type === "session" || form.plan_type === "hybrid") && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Количество занятий</label>
              <input
                type="number" value={form.sessions_count ?? ""} onChange={e => update({ sessions_count: Number(e.target.value) || null })}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
              />
            </div>
          )}

          {(form.plan_type === "duration" || form.plan_type === "hybrid") && (
            <>
              {form.plan_type === "duration" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Режим дней</label>
                  <select
                    value={form.duration_mode ?? "calendar"}
                    onChange={e => update({ duration_mode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
                  >
                    <option value="calendar">Календарный период</option>
                    <option value="day_package">Пакет дней посещения</option>
                  </select>
                </div>
              )}
              {form.duration_mode === "day_package" && form.plan_type === "duration" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Количество дней посещения</label>
                  <input
                    type="number" value={form.day_package_count ?? ""} onChange={e => update({ day_package_count: Number(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Срок действия (дней)</label>
                  <input
                    type="number" value={form.duration_days ?? ""} onChange={e => update({ duration_days: Number(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
                  />
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Стоимость</label>
              <input
                type="number" value={form.price} onChange={e => update({ price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Начало действия</label>
              <select
                value={form.activation_mode}
                onChange={e => update({ activation_mode: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
              >
                <option value="first_visit">С первого посещения</option>
                <option value="purchase_date">С даты покупки</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Разрешённые услуги</label>
            <div className="border-2 border-gray-200 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
              {services.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm px-1 py-0.5">
                  <input
                    type="checkbox"
                    checked={form.services.includes(s.id)}
                    onChange={e => update({
                      services: e.target.checked ? [...form.services, s.id] : form.services.filter(id => id !== s.id),
                    })}
                  />
                  {s.name}
                </label>
              ))}
              {services.length === 0 && <p className="text-xs text-gray-400 px-1">Нет услуг</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.allow_freeze} onChange={e => update({ allow_freeze: e.target.checked })} />
              Разрешена заморозка
            </label>
            {form.allow_freeze && (
              <input
                type="number" placeholder="Макс. дней" value={form.max_freeze_days ?? ""}
                onChange={e => update({ max_freeze_days: Number(e.target.value) || null })}
                className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 text-sm"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Отмена
          </button>
          <button
            onClick={submit} disabled={saving || !form.name}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
