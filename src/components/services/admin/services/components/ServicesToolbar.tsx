"use client";

import { useRef, useState } from "react";
import { Search, ChevronDown, ClipboardList, Settings } from "lucide-react";
import type { ServiceCategory } from "../types/serviceTypes";
import { getCategoryIcon } from "../types/serviceTypes";

export function ServicesToolbar({
  categories,
  catFilter,
  onCatFilterChange,
  serviceSearch,
  onServiceSearchChange,
  onOpenCategories,
}: {
  categories: ServiceCategory[];
  catFilter: string;
  onCatFilterChange: (slug: string) => void;
  serviceSearch: string;
  onServiceSearchChange: (v: string) => void;
  onOpenCategories: () => void;
}) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const selectedCat = catFilter === "all" ? null : categories.find(c => c.slug === catFilter);
  const SelIcon = selectedCat ? getCategoryIcon(selectedCat.icon) : ClipboardList;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по названию услуги..."
          value={serviceSearch}
          onChange={(e) => onServiceSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Category filter dropdown */}
      <div className="relative flex-shrink-0" ref={filterDropdownRef}>
        <button
          type="button"
          onClick={() => setFilterDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all bg-white border-2 border-gray-200 text-gray-700 hover:border-sky-300 min-w-[180px]"
          style={selectedCat ? { borderColor: selectedCat.color, background: selectedCat.color + '15', color: selectedCat.color } : {}}
        >
          <SelIcon className="w-5 h-5" />
          <span className="flex-1 text-left">{selectedCat ? selectedCat.name : 'Все категории'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {filterDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[200px]"
            onMouseLeave={() => setFilterDropdownOpen(false)}>
            <button
              onClick={() => { onCatFilterChange("all"); setFilterDropdownOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${catFilter === "all" ? "bg-sky-50 text-sky-600" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <ClipboardList className="w-4 h-4" />
              Все категории
            </button>
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.icon);
              const active = catFilter === cat.slug;
              return (
                <button key={cat.id}
                  onClick={() => { onCatFilterChange(cat.slug); setFilterDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${active ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  style={active ? { background: cat.color } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category management */}
      <button onClick={onOpenCategories}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all bg-white border-2 border-gray-200 text-gray-700 hover:border-sky-300 flex-shrink-0"
        title="Управление категориями">
        <Settings className="w-5 h-5" />
        Категории
      </button>
    </div>
  );
}
