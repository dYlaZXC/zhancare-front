"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, ClipboardCheck, Edit, Loader2, Package, Plus,
} from "lucide-react";
import { CATEGORY_LABELS, UNIT_LABELS, WarehouseItem } from "../types";
import ItemFormModal from "../modals/ItemFormModal";
import TransactionModal from "../modals/TransactionModal";
import FailedAttemptsSection from "./FailedAttemptsSection";

export default function ItemsTab() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<WarehouseItem | null>(null);
  const [txnTarget, setTxnTarget] = useState<{ item: WarehouseItem; action: "in" | "out" | "adjustment" } | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/warehouse/items/");
      const data = res.data;
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error("Не удалось загрузить склад");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSaved = (item: WarehouseItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
  };

  const lowStockCount = items.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Остатки на складе</h2>
          {lowStockCount > 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
              {lowStockCount} {lowStockCount === 1 ? "позиция требует" : "позиций требуют"} пополнения
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ background: "linear-gradient(135deg, #78716c 0%, #57534e 100%)" }}
        >
          <Plus className="w-4 h-4" />
          Добавить позицию
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <Package className="w-10 h-10 text-gray-300" />
          <p className="text-gray-600 font-medium">Склад пока пуст</p>
          <p className="text-sm text-gray-400">Добавьте первую позицию расходников</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Название</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Категория</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Остаток</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Цена</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className={item.is_low_stock ? "bg-red-50/60" : ""}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {item.is_low_stock && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{CATEGORY_LABELS[item.category]}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-semibold ${item.is_low_stock ? "text-red-600" : "text-gray-900"}`}>
                        {item.current_quantity} {UNIT_LABELS[item.unit]}
                      </span>
                      <span className="text-xs text-gray-400 ml-1.5">(мин. {item.min_quantity})</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {item.last_unit_cost ? `${item.last_unit_cost} ₸` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setTxnTarget({ item, action: "in" })}
                          title="Оприходовать"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <ArrowDownCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTxnTarget({ item, action: "out" })}
                          title="Списать"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTxnTarget({ item, action: "adjustment" })}
                          title="Пересчитать"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditTarget(item)}
                          title="Редактировать"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FailedAttemptsSection />

      <AnimatePresence>
        {(showCreate || editTarget) && (
          <ItemFormModal
            key="item-form"
            mode={showCreate ? "create" : "edit"}
            initial={editTarget}
            onClose={() => { setShowCreate(false); setEditTarget(null); }}
            onSaved={handleSaved}
          />
        )}
        {txnTarget && (
          <TransactionModal
            key="txn"
            item={txnTarget.item}
            action={txnTarget.action}
            onClose={() => setTxnTarget(null)}
            onSaved={() => { setTxnTarget(null); fetchItems(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
