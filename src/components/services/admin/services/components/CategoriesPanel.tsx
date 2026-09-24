"use client";

import { useMemo, useState } from "react";
import { Search, Layers } from "lucide-react";
import type { ServiceCategory, StatusFilter } from "../types/serviceTypes";
import { ServicesStatsCards } from "./ServicesHeader";
import { CategoryCard } from "./CategoryCard";
import { CategoryScheduleModal } from "../modals/CategoryScheduleModal";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "inactive", label: "Неактивные" },
];

// The "Категории" tab — deliberately the same layout as the "Услуги" tab
// (stat cards, search + status pills, a list of cards) so the two read as one
// catalog. The whole list is already in memory (a clinic has a few dozen
// categories at most), so search/status filtering is client-side — no
// pagination or extra requests like the services list needs.
export function CategoriesPanel({
  categories,
  onEdit,
  onToggle,
  onDelete,
  onScheduleSaved,
}: {
  categories: ServiceCategory[];
  onEdit: (cat: ServiceCategory) => void;
  onToggle: (cat: ServiceCategory) => void;
  onDelete: (cat: ServiceCategory) => void;
  onScheduleSaved: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [scheduleCategory, setScheduleCategory] = useState<ServiceCategory | null>(null);

  const activeCount = categories.filter(c => c.is_active).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter(c => {
      if (status === "active" && !c.is_active) return false;
      if (status === "inactive" && c.is_active) return false;
      return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    });
  }, [categories, search, status]);

  const hasFilters = status !== "all" || search.trim() !== "";

  return (
    <div>
      <ServicesStatsCards
        total={categories.length}
        active={activeCount}
        inactive={categories.length - activeCount}
        totalLabel="Всего категорий"
      />

      <div className="flex flex-col md:flex-row md:flex-wrap gap-4 mb-8">
        <div className="flex-1 relative min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию категории..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-500 focus:outline-none transition-colors"
          />
        </div>
        <div role="group" aria-label="Статус категорий"
          className="flex items-center p-1 rounded-2xl bg-white border-2 border-gray-200 flex-shrink-0">
          {STATUS_OPTIONS.map(opt => {
            const selected = status === opt.value;
            return (
              <button key={opt.value} type="button" aria-pressed={selected}
                onClick={() => setStatus(opt.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  selected ? "bg-sky-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{hasFilters ? "Ничего не найдено" : "Категорий пока нет"}</p>
          <p className="text-sm mt-1">
            {hasFilters ? "Попробуйте изменить фильтры или поисковый запрос" : "Нажмите «Добавить категорию» чтобы создать первую"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={onEdit}
              onToggle={onToggle}
              onSchedule={setScheduleCategory}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <CategoryScheduleModal
        category={scheduleCategory}
        onClose={() => setScheduleCategory(null)}
        onSaved={onScheduleSaved}
      />
    </div>
  );
}

export default CategoriesPanel;
