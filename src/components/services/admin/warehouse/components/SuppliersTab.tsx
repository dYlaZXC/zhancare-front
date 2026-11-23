"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { Edit, Loader2, Plus, Truck } from "lucide-react";
import { WarehouseSupplier } from "../types";
import SupplierFormModal from "../modals/SupplierFormModal";

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<WarehouseSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<WarehouseSupplier | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/warehouse/suppliers/");
      const data = res.data;
      setSuppliers(Array.isArray(data) ? data : data.results || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleSaved = (supplier: WarehouseSupplier) => {
    setSuppliers((prev) => {
      const exists = prev.find((s) => s.id === supplier.id);
      return exists ? prev.map((s) => (s.id === supplier.id ? supplier : s)) : [supplier, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Поставщики</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить поставщика
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <Truck className="w-10 h-10 text-gray-300" />
          <p className="text-gray-600 font-medium">Поставщики пока не добавлены</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {suppliers.map((s) => (
              <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[s.contact_person, s.phone, s.email].filter(Boolean).join(" · ") || "Нет контактных данных"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!s.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Неактивен</span>
                  )}
                  <button
                    onClick={() => setEditTarget(s)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {(showCreate || editTarget) && (
          <SupplierFormModal
            key="supplier-form"
            mode={showCreate ? "create" : "edit"}
            initial={editTarget}
            onClose={() => { setShowCreate(false); setEditTarget(null); }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
