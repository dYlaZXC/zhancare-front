"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { ArrowDownCircle, ArrowUpCircle, ClipboardCheck, History, Loader2 } from "lucide-react";
import { REASON_LABELS, TransactionType, UNIT_LABELS, WarehouseTransaction } from "../types";

const TYPE_META: Record<TransactionType, { label: string; icon: typeof ArrowDownCircle; className: string }> = {
  in: { label: "Приход", icon: ArrowDownCircle, className: "text-emerald-600 bg-emerald-50" },
  out: { label: "Расход", icon: ArrowUpCircle, className: "text-red-600 bg-red-50" },
  adjustment: { label: "Коррекция", icon: ClipboardCheck, className: "text-blue-600 bg-blue-50" },
};

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      const res = await api.get(`/warehouse/transactions/${params.toString() ? `?${params}` : ""}`);
      const data = res.data;
      setTransactions(Array.isArray(data) ? data : data.results || []);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Журнал движений</h2>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Все типы</option>
          <option value="in">Приход</option>
          <option value="out">Расход</option>
          <option value="adjustment">Коррекция</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <History className="w-10 h-10 text-gray-300" />
          <p className="text-gray-600 font-medium">Движений пока нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Дата</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Тип</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Позиция</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Причина</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Количество</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Кто</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((txn) => {
                  const meta = TYPE_META[txn.type];
                  const Icon = meta.icon;
                  return (
                    <tr key={txn.id}>
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleString("ru-RU")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${meta.className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{txn.item_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{REASON_LABELS[txn.reason]}</td>
                      <td className="px-5 py-3 text-sm text-gray-900">
                        {txn.type === "adjustment"
                          ? `${txn.expected_quantity} → ${txn.counted_quantity}`
                          : `${txn.quantity} ${UNIT_LABELS[txn.unit]}`}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{txn.created_by_name || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
