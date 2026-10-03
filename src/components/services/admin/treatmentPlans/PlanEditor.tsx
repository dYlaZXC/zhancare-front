"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { X, Loader2, Wallet } from "lucide-react";
import type { TreatmentPlan, TreatmentPlanItem, PlanItemStatus } from "./types";
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS, formatMoney } from "./types";

const STATUS_ORDER: PlanItemStatus[] = ["planned", "completed", "no_show", "cancelled"];

/**
 * The patient's living treatment plan. It is built automatically from the
 * patient's bookings at this clinic, so nothing here is created by hand:
 * items and their statuses come from the bookings, and only the plan's
 * title/notes and each item's payments are editable.
 */
export function PlanEditor({
  initialPlan,
  onClose,
  onSaved,
}: {
  initialPlan: TreatmentPlan;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [plan, setPlan] = useState<TreatmentPlan>(initialPlan);
  const [title, setTitle] = useState(initialPlan.title ?? "");
  const [notes, setNotes] = useState(initialPlan.notes ?? "");
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  const saveMeta = async () => {
    try {
      const { data } = await api.patch(`/treatment-plans/${plan.id}/`, { title: title.trim(), notes });
      setPlan(prev => ({ ...prev, ...data }));
    } catch {
      toast.error("Не удалось сохранить изменения");
    }
  };

  const refreshPlan = async () => {
    const { data } = await api.get(`/treatment-plans/${plan.id}/`);
    setPlan(data);
  };

  const recordPayment = async (item: TreatmentPlanItem) => {
    const amount = parseFloat(paymentDrafts[item.id] || "");
    if (!amount || amount <= 0) { toast.error("Укажите сумму больше нуля"); return; }
    setBusyItemId(item.id);
    try {
      await api.post(`/treatment-plan-items/${item.id}/record-payment/`, { amount });
      setPaymentDrafts(prev => ({ ...prev, [item.id]: "" }));
      await refreshPlan();
      toast.success("Оплата зафиксирована");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message || "Не удалось зафиксировать оплату");
    } finally {
      setBusyItemId(null);
    }
  };

  const groups = STATUS_ORDER.map(status => ({
    status,
    items: plan.items.filter(item => item.status === status),
  })).filter(group => group.items.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold" style={{ color: "#1e263e" }}>План лечения</h3>
            <p className="text-sm text-gray-500 truncate">{plan.patient_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#1e263e" }}>Название / диагноз</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={saveMeta}
              placeholder="Например: Лечение гастрита"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#1e263e" }}>Заметки</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveMeta} rows={2}
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <p className="text-sm font-semibold" style={{ color: "#1e263e" }}>
            Услуги плана {plan.items.length > 0 && <span className="text-gray-400 font-normal">({plan.items.length})</span>}
          </p>

          {plan.items.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-400">
              Пока нет записей — услуги появятся здесь автоматически, как только пациент запишется
            </p>
          )}

          {groups.map(group => (
            <div key={group.status} className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${STATUS_COLORS[group.status].text}`}>
                {STATUS_LABELS[group.status]} · {group.items.length}
              </p>
              {group.items.map(item => {
                const colors = STATUS_COLORS[item.status];
                const busy = busyItemId === item.id;
                return (
                  <div key={item.id} className={`rounded-xl border ${colors.border} ${colors.bg} px-3.5 py-3`}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{SOURCE_LABELS[item.source]}</span>
                        {item.doctor_name && <span>· {item.doctor_name}</span>}
                        {item.scheduled_at && (
                          <span>· {new Date(item.scheduled_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {formatMoney(item.price, item.currency)} · оплачено {formatMoney(item.paid_amount, item.currency)}
                        {parseFloat(item.owed_amount) > 0 && (
                          <span className="text-red-500 font-semibold"> · к доплате {formatMoney(item.owed_amount, item.currency)}</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <input
                          type="number" placeholder="Оплата"
                          value={paymentDrafts[item.id] ?? ""}
                          onChange={e => setPaymentDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-20 px-2 py-1 text-[11px] rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
                        />
                        <button onClick={() => recordPayment(item)} disabled={busy}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50">
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />} Внести
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex justify-end gap-2">
          <button onClick={() => { onSaved(); onClose(); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border-2 border-gray-200 transition-colors">
            Готово
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default PlanEditor;
