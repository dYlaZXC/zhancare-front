"use client";

import { Check, Loader2 } from "lucide-react";

// Reusable "copy this onto other days of the week" picker — used both for a
// day's working hours (DateScheduleTab's top-level copy button) and for one
// room band (Кабинеты sub-section) so both features share the exact same
// interaction: chip-per-day toggle, "Выбрать все / Снять всё", Применить/Отмена.

export interface DayCopyOption {
  date: string;
  label: string;
  /** e.g. "· вых." or "· уже занято" — shown in muted text next to the date */
  sublabel?: string;
}

export function DayCopyPanel({
  heading,
  options,
  selection,
  onToggle,
  onToggleAll,
  onApply,
  onCancel,
  applying = false,
}: {
  heading: string;
  options: DayCopyOption[];
  selection: Record<string, boolean>;
  onToggle: (date: string) => void;
  onToggleAll: () => void;
  onApply: () => void | Promise<void>;
  onCancel: () => void;
  applying?: boolean;
}) {
  const hasSelection = options.some((o) => selection[o.date]);

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
      <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide mb-2">{heading}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {options.map((o) => {
          const checked = !!selection[o.date];
          return (
            <button
              key={o.date}
              type="button"
              onClick={() => onToggle(o.date)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 text-xs font-semibold transition-colors ${
                checked
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
              }`}
            >
              {checked && <Check className="w-3 h-3" />}
              {o.label}
              {o.sublabel && <span className="text-gray-300">{o.sublabel}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={!hasSelection || applying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white transition-colors"
        >
          {applying && <Loader2 className="w-3 h-3 animate-spin" />}
          Применить
        </button>
        <button
          type="button"
          onClick={onToggleAll}
          disabled={applying}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Выбрать все / Снять всё
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={applying}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:bg-gray-100 transition-colors ml-auto disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
