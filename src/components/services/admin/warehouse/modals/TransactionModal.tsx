"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { ArrowDownCircle, ArrowUpCircle, ClipboardCheck, X, Loader2, CheckCircle } from "lucide-react";
import { REASON_LABELS, TransactionReason, UNIT_LABELS, WarehouseItem, WarehouseSupplier } from "../types";

type Action = "in" | "out" | "adjustment";

// Tailwind only picks up literal class strings at build time — interpolated
// `bg-${color}-50` would silently produce no CSS, so every variant is
// spelled out in full here instead of built from a `color` token.
const CONFIG: Record<Action, {
  title: string; icon: typeof ArrowDownCircle; defaultReason: TransactionReason; reasons: TransactionReason[];
  iconBg: string; iconText: string; submitBtn: string;
}> = {
  in: {
    title: "Оприходовать", icon: ArrowDownCircle, defaultReason: "purchase", reasons: ["purchase", "return"],
    iconBg: "bg-emerald-50", iconText: "text-emerald-600", submitBtn: "bg-emerald-600 hover:bg-emerald-700",
  },
  out: {
    title: "Списать", icon: ArrowUpCircle, defaultReason: "write_off", reasons: ["write_off", "correction"],
    iconBg: "bg-red-50", iconText: "text-red-600", submitBtn: "bg-red-600 hover:bg-red-700",
  },
  adjustment: {
    title: "Пересчитать остаток", icon: ClipboardCheck, defaultReason: "correction", reasons: ["correction"],
    iconBg: "bg-blue-50", iconText: "text-blue-600", submitBtn: "bg-blue-600 hover:bg-blue-700",
  },
};

export default function TransactionModal({
  item,
  action,
  onClose,
  onSaved,
}: {
  item: WarehouseItem;
  action: Action;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cfg = CONFIG[action];
  const Icon = cfg.icon;

  const [quantity, setQuantity] = useState("");
  const [countedQuantity, setCountedQuantity] = useState(item.current_quantity);
  const [unitCost, setUnitCost] = useState(item.last_unit_cost || "");
  const [reason, setReason] = useState<TransactionReason>(cfg.defaultReason);
  const [supplierId, setSupplierId] = useState<string>("");
  const [suppliers, setSuppliers] = useState<WarehouseSupplier[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action !== "in") return;
    api.get("/warehouse/suppliers/?is_active=true").then((res) => {
      const data = res.data;
      setSuppliers(Array.isArray(data) ? data : data.results || []);
    }).catch(() => {});
  }, [action]);

  const delta = action === "adjustment"
    ? (parseFloat(countedQuantity || "0") - parseFloat(item.current_quantity)).toFixed(3)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action !== "adjustment" && (!quantity || parseFloat(quantity) <= 0)) {
      toast.error("Укажите количество больше нуля");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        item: item.id,
        type: action,
        notes: notes.trim(),
      };
      if (action === "adjustment") {
        payload.counted_quantity = countedQuantity;
        payload.reason = "correction";
      } else {
        payload.quantity = quantity;
        payload.reason = reason;
        if (action === "in") {
          if (unitCost) payload.unit_cost = unitCost;
          if (supplierId) payload.supplier = Number(supplierId);
        }
      }
      await api.post("/warehouse/transactions/", payload);
      toast.success("Движение зафиксировано");
      onSaved();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data ? Object.values(data).flat().join(" ") : "Ошибка при сохранении";
      toast.error(msg || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${cfg.iconText}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{cfg.title}</h2>
              <p className="text-sm text-gray-500">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
            Текущий остаток: <span className="font-semibold text-gray-900">{item.current_quantity} {UNIT_LABELS[item.unit]}</span>
          </div>

          {action === "adjustment" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фактический остаток</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={countedQuantity}
                onChange={(e) => setCountedQuantity(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              {delta !== null && parseFloat(delta) !== 0 && (
                <p className={`mt-1.5 text-sm font-medium ${parseFloat(delta) > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  Разница: {parseFloat(delta) > 0 ? "+" : ""}{delta} {UNIT_LABELS[item.unit]}
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Причина</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as TransactionReason)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {cfg.reasons.map((r) => (
                    <option key={r} value={r}>{REASON_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              {action === "in" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена за единицу</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  {suppliers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      >
                        <option value="">—</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-2.5 ${cfg.submitBtn} text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? "Сохранение..." : "Подтвердить"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
