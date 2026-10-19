"use client";

import { useState } from "react";
import { History, Truck, Warehouse } from "lucide-react";
import ItemsTab from "./warehouse/components/ItemsTab";
import TransactionsTab from "./warehouse/components/TransactionsTab";
import SuppliersTab from "./warehouse/components/SuppliersTab";

type Tab = "items" | "transactions" | "suppliers";

const TABS: { id: Tab; label: string; icon: typeof Warehouse }[] = [
  { id: "items", label: "Остатки", icon: Warehouse },
  { id: "transactions", label: "Приход/Расход", icon: History },
  { id: "suppliers", label: "Поставщики", icon: Truck },
];

export function WarehouseView() {
  const [tab, setTab] = useState<Tab>("items");

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>
          Склад
        </h1>
        <p className="text-gray-600">
          Учёт медицинских расходных материалов и оборудования клиники
        </p>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                active ? "border-gray-700 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "items" && <ItemsTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "suppliers" && <SuppliersTab />}
    </div>
  );
}
