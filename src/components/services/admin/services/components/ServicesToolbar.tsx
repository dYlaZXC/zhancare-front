"use client";

import { useRef, useState } from "react";
import { Plus, Search, ChevronDown, ClipboardList, Settings } from "lucide-react";
import type { ServiceCategory } from "../types/serviceTypes";
import { getCategoryIcon } from "../types/serviceTypes";

export function ServicesToolbar({
  categories,
  catFilter,
  onCatFilterChange,
  serviceSearch,
  onServiceSearchChange,
  onOpenCategories,
  onOpenCreate,
}: {
  categories: ServiceCategory[];
  catFilter: string;
  onCatFilterChange: (slug: string) => void;
  serviceSearch: string;
  onServiceSearchChange: (v: string) => void;
  onOpenCategories: () => void;
  onOpenCreate: () => void;
}) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const selectedCat = catFilter === "all" ? null : categories.find(c => c.slug === catFilter);
  const SelIcon = selectedCat ? getCategoryIcon(selectedCat.icon) : ClipboardList;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Category filter dropdown */}
        <div className="relative flex-shrink-0" ref={filterDropdownRef}>
          <button
            type="button"
            onClick={() => setFilterDropdownOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all min-w-[140px]"
            style={selectedCat ? { borderColor: selectedCat.color + '60', background: selectedCat.color + '10', color: selectedCat.color } : {}}
          >
            <SelIcon size={12} />
            <span className="flex-1 text-left">{selectedCat ? selectedCat.name : 'Все категории'}</span>
            <ChevronDown size={12} className={`transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[180px]"
              onMouseLeave={() => setFilterDropdownOpen(false)}>
              <button
                onClick={() => { onCatFilterChange("all"); setFilterDropdownOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${catFilter === "all" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <ClipboardList size={12} />
                Все категории
              </button>
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.icon);
                const active = catFilter === cat.slug;
                return (
                  <button key={cat.id}
                    onClick={() => { onCatFilterChange(cat.slug); setFilterDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${active ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    style={active ? { background: cat.color } : {}}
                  >
                    <Icon size={12} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={onOpenCategories}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            title="Управление категориями">
            <Settings size={13} />
            Категории
          </button>
          <button onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
            <Plus size={15} /> Добавить услугу
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={serviceSearch} onChange={e => onServiceSearchChange(e.target.value)}
          placeholder="Поиск по названию услуги..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
          style={{ borderColor: "#e8e8e8", color: "#1b1b1b" }}
          onFocus={e => { e.currentTarget.style.borderColor = "#3772ff"; e.currentTarget.style.boxShadow = "0 0 0 4px #ebf1ff"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "none"; }} />
      </div>
    </>
  );
}
