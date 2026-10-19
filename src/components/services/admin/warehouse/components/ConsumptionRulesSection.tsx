"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { Plus, Trash2 } from "lucide-react";
import { UNIT_LABELS, WarehouseConsumptionRule, WarehouseItem } from "../types";

/**
 * Per-service "recipe" editor — embedded in ServiceFormModal.tsx. Each row
 * persists immediately (its own POST/DELETE against
 * /warehouse/consumption-rules/) rather than going through the service
 * form's own Save button, since rules are a separate resource the backend
 * already exposes full CRUD for.
 */
export default function ConsumptionRulesSection({
  diagnosticsServiceId,
  disabled,
}: {
  diagnosticsServiceId: number;
  disabled: boolean;
}) {
  const [rules, setRules] = useState<WarehouseConsumptionRule[]>([]);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemId, setNewItemId] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, itemsRes] = await Promise.all([
        api.get(`/warehouse/consumption-rules/?diagnostics_service_id=${diagnosticsServiceId}`),
        api.get("/warehouse/items/?is_active=true"),
      ]);
      const toList = (d: any) => (Array.isArray(d) ? d : d.results || []);
      setRules(toList(rulesRes.data));
      setItems(toList(itemsRes.data));
    } catch {
      // Non-critical section of the service form — fail quietly.
    } finally {
      setLoading(false);
    }
  }, [diagnosticsServiceId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const estimatedCost = rules.reduce((sum, rule) => {
    const item = items.find((i) => i.id === rule.item);
    const unitCost = item?.last_unit_cost ? parseFloat(item.last_unit_cost) : 0;
    return sum + unitCost * parseFloat(rule.quantity_per_use);
  }, 0);

  const handleAdd = async () => {
    if (!newItemId || !newQty || parseFloat(newQty) <= 0) {
      toast.error("Выберите позицию и укажите количество");
      return;
    }
    setAdding(true);
    try {
      const res = await api.post("/warehouse/consumption-rules/", {
        item: Number(newItemId), quantity_per_use: newQty, diagnostics_service: diagnosticsServiceId,
      });
      setRules((prev) => [...prev, res.data]);
      setNewItemId("");
      setNewQty("1");
    } catch {
      toast.error("Не удалось добавить расходник");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ruleId: number) => {
    try {
      await api.delete(`/warehouse/consumption-rules/${ruleId}/`);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      toast.error("Не удалось удалить");
    }
  };

  const availableItems = items.filter((i) => !rules.some((r) => r.item === i.id));

  if (loading) return <p className="text-sm text-gray-400">Загрузка расходников...</p>;

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      {rules.length > 0 && (
        <div className="space-y-2 mb-3">
          {rules.map((rule) => {
            const item = items.find((i) => i.id === rule.item);
            return (
              <div key={rule.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-sm text-gray-700">
                  {rule.item_name} × {rule.quantity_per_use} {item ? UNIT_LABELS[item.unit] : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(rule.id)}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {availableItems.length > 0 ? (
        <div className="flex items-center gap-2">
          <select
            value={newItemId}
            onChange={(e) => setNewItemId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="">Выберите позицию склада</option>
            {availableItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <input
            type="number" step="0.001" min="0.001" value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
          <button
            type="button" onClick={handleAdd} disabled={adding}
            className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">На складе пока нет ни одной позиции.</p>
      ) : null}

      {rules.length > 0 && estimatedCost > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Примерная себестоимость: {estimatedCost.toFixed(2)} ₸ (по текущим ценам, не историческая)
        </p>
      )}
    </div>
  );
}
