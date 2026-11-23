"use client";

import { Star } from "lucide-react";
import SearchMultiSelect from "../schedule/components/SearchMultiSelect";

export interface StaffOption {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  specialization?: string | null;
}

export const staffName = (m: StaffOption) => `${m.first_name} ${m.last_name}`.trim();

/**
 * Instructors for a group class: searchable multi-select + "основной"
 * choice among the picked ones. Keeps primaryId consistent — it always
 * points at a selected instructor (first one by default), or null when
 * none are selected.
 */
export function InstructorPicker({
  staff, instructorIds, primaryId, onChange,
}: {
  staff: StaffOption[];
  instructorIds: number[];
  primaryId: number | null;
  onChange: (instructorIds: number[], primaryId: number | null) => void;
}) {
  const setIds = (raw: Array<number | string>) => {
    const ids = raw.map(Number);
    const primary = primaryId !== null && ids.includes(primaryId) ? primaryId : ids[0] ?? null;
    onChange(ids, primary);
  };

  const selected = instructorIds
    .map(id => staff.find(m => m.id === id))
    .filter(Boolean) as StaffOption[];

  return (
    <div>
      <SearchMultiSelect
        options={staff.map(m => ({ id: m.id, label: staffName(m), subtitle: m.specialization || undefined }))}
        value={instructorIds}
        onChange={setIds}
        placeholder="Выберите инструкторов"
        emptyText={staff.length === 0 ? "Нет врачей" : "Ничего не найдено"}
      />

      {selected.length > 1 && (
        <div className="mt-2">
          <p className="text-[11px] text-gray-500 mb-1.5">Основной инструктор</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map(m => {
              const active = m.id === primaryId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChange(instructorIds, m.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Star className={`w-3 h-3 ${active ? "fill-amber-400 text-amber-500" : ""}`} />
                  {staffName(m)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
