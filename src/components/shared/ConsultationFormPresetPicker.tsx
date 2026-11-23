"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { Check, ChevronDown, ListChecks, Loader2, Plus, Save, Search, Trash2, X } from "lucide-react";
import { api } from "@/utils/api";
import type { ConsultationFormSection } from "@/types/consultation";

interface PresetOption {
  id: number;
  template: number;
  clinic: number | null;
  doctor: number | null;
  name: string;
  values: Record<string, string>;
}

const MENU_MIN_WIDTH = 320;
const MENU_MAX_HEIGHT = 420;

// Same theme tokens as ConsultationTemplatePicker, kept in sync deliberately
// so the two pickers (template + preset) look like one family of controls
// wherever they sit side by side.
const THEMES = {
  light: {
    button: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    menu: "bg-white border border-gray-200 shadow-xl",
    item: "text-gray-700 hover:bg-gray-50",
    muted: "text-gray-400",
    heading: "text-gray-400",
    search: "bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400",
    input: "bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400",
    danger: "text-rose-400 hover:text-rose-600",
  },
  dark: {
    button: "border text-[#ebf1ff] hover:brightness-125",
    menu: "border shadow-2xl",
    item: "text-[#ebf1ff] hover:brightness-125",
    muted: "text-[#8f95a6]",
    heading: "text-[#8f95a6]",
    search: "border text-[#ebf1ff] placeholder-[#8f95a6] focus:border-[#3772ff]",
    input: "border text-[#ebf1ff] placeholder-[#8f95a6] focus:border-[#3772ff]",
    danger: "text-rose-300 hover:text-rose-400",
  },
} as const;

const DARK_SURFACE = { backgroundColor: "#202942", borderColor: "#2956bf" };
const DARK_SEARCH = { backgroundColor: "#1a2036", borderColor: "#283353" };

interface MenuPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

/**
 * "Готовые шаблоны" — reusable, pre-filled content for a consultation form's
 * TEXT sections (never diagnostics_referral — those are real bookable
 * services with their own price/time, not presettable canned text; the
 * backend rejects that section type outright, see ConsultationFormPreset's
 * own docstring). A doctor picks one mid-visit to instantly fill the
 * matching cells with typical wording for a recurring symptom/complaint,
 * and can save whatever is currently filled in as a new preset for later.
 *
 * Deliberately modeled after ConsultationTemplatePicker's own portal-dropdown
 * (same positioning math, same visual language) so the two controls read as
 * one family wherever they're placed side by side.
 */
export function ConsultationFormPresetPicker({
  templateId,
  sections,
  hasContent,
  getCurrentValues,
  onApply,
  disabled = false,
  theme = "light",
  align = "left",
}: {
  templateId: number | null;
  /** The ACTIVE template's own sections — used only to strip diagnostics_referral keys before saving a new preset. */
  sections: ConsultationFormSection[];
  /** Whether the form already has doctor-typed content, to gate a confirm before overwriting it. */
  hasContent: boolean;
  /** Lazily read the current section values, only needed when the doctor actually saves a new preset. */
  getCurrentValues: () => Record<string, string>;
  /** Receives {section_key: text} to merge into the form — caller decides how to merge. */
  onApply: (values: Record<string, string>) => void;
  disabled?: boolean;
  theme?: "light" | "dark";
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PresetOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const [savingOpen, setSavingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const t = THEMES[theme];
  const dark = theme === "dark";

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(r.width, MENU_MIN_WIDTH), vw - 16);
    const left = Math.max(8, Math.min(align === "right" ? r.right - width : r.left, vw - width - 8));
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    if (below < 260 && above > below) {
      setPos({ left, width, bottom: vh - r.top + 6, maxHeight: Math.min(MENU_MAX_HEIGHT, above) });
    } else {
      setPos({ left, width, top: r.bottom + 6, maxHeight: Math.min(MENU_MAX_HEIGHT, Math.max(200, below)) });
    }
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = async () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    if (!templateId) {
      toast.info("Сначала должен быть выбран шаблон листа");
      return;
    }
    setQuery("");
    setSavingOpen(false);
    setOpen(true);
    setLoading(true);
    try {
      const { data } = await api.get(`/consultation-form-presets/?template_id=${templateId}`);
      setOptions(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      toast.error("Не удалось загрузить готовые шаблоны");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const apply = (preset: PresetOption) => {
    const filled = Object.entries(preset.values).filter(([, v]) => typeof v === "string" && v.trim());
    if (filled.length === 0) {
      toast.error("В этом готовом шаблоне нет заполненных полей");
      return;
    }
    if (hasContent && !window.confirm(
      `Заполнить приём готовым шаблоном «${preset.name}»? Поля, для которых в шаблоне есть текст, будут перезаписаны.`
    )) return;
    onApply(Object.fromEntries(filled));
    toast.success(`Применён готовый шаблон: ${preset.name}`);
    setOpen(false);
  };

  const remove = async (preset: PresetOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Удалить готовый шаблон «${preset.name}»?`)) return;
    try {
      await api.delete(`/consultation-form-presets/${preset.id}/`);
      setOptions(prev => (prev ?? []).filter(p => p.id !== preset.id));
      toast.success("Готовый шаблон удалён");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось удалить шаблон");
    }
  };

  const submitSave = async () => {
    const name = newName.trim();
    if (!name || !templateId) return;
    setSaving(true);
    try {
      const diagKeys = new Set(
        sections.filter(s => (s.type || "text") === "diagnostics_referral").map(s => s.key)
      );
      const current = getCurrentValues();
      const values: Record<string, string> = {};
      for (const [key, value] of Object.entries(current)) {
        if (diagKeys.has(key)) continue;
        if (typeof value === "string" && value.trim()) values[key] = value;
      }
      if (Object.keys(values).length === 0) {
        toast.error("Нет заполненных текстовых полей, чтобы сохранить как шаблон");
        return;
      }
      const { data } = await api.post("/consultation-form-presets/", { template: templateId, name, values });
      setOptions(prev => [...(prev ?? []), data].sort((a, b) => a.name.localeCompare(b.name, "ru")));
      toast.success(`Готовый шаблон «${name}» сохранён`);
      setNewName("");
      setSavingOpen(false);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.name?.[0] || data?.values?.[0] || data?.template?.[0] || data?.error || "Не удалось сохранить шаблон";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (savingOpen) nameRef.current?.focus();
  }, [savingOpen]);

  const q = query.trim().toLowerCase();
  const filtered = (options ?? []).filter(o => !q || o.name.toLowerCase().includes(q));

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        title="Готовые шаблоны — быстро заполнить приём типовым текстом"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${t.button}`}
        style={dark ? DARK_SURFACE : undefined}
      >
        <ListChecks className="w-3.5 h-3.5" />
        Готовые шаблоны
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          className={`fixed z-[10000] flex flex-col rounded-2xl overflow-hidden ${t.menu}`}
          style={{
            left: pos.left, width: pos.width, maxHeight: pos.maxHeight,
            ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
            ...(dark ? DARK_SURFACE : {}),
          }}
        >
          <div className="p-2 flex-shrink-0 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.muted}`} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск шаблона..."
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl focus:outline-none transition-colors ${t.search}`}
                style={dark ? DARK_SEARCH : undefined}
              />
            </div>
            <button
              type="button"
              onClick={() => setSavingOpen(v => !v)}
              title="Сохранить текущий приём как готовый шаблон"
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${savingOpen ? "bg-blue-500 text-white" : t.item}`}
            >
              {savingOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {savingOpen && (
            <div className="px-2 pb-2 flex-shrink-0 flex items-center gap-1.5">
              <input
                ref={nameRef}
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submitSave(); }}
                placeholder="Название готового шаблона..."
                className={`flex-1 min-w-0 pl-3 pr-3 py-2 text-sm rounded-xl focus:outline-none transition-colors ${t.input}`}
                style={dark ? DARK_SEARCH : undefined}
              />
              <button
                type="button"
                onClick={submitSave}
                disabled={!newName.trim() || saving}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          )}

          <div className="overflow-y-auto min-h-0 pb-1.5">
            {loading || options === null ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className={`w-5 h-5 animate-spin ${t.muted}`} />
              </div>
            ) : filtered.length === 0 ? (
              <p className={`px-3.5 py-5 text-sm text-center ${t.muted}`}>
                {q ? "Ничего не найдено" : "Готовых шаблонов пока нет — сохраните текущий приём как шаблон"}
              </p>
            ) : (
              filtered.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => apply(preset)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${t.item}`}
                >
                  <Check className="w-3.5 h-3.5 flex-shrink-0 opacity-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium leading-snug break-words">{preset.name}</span>
                    <span className={`block text-xs ${t.muted}`}>
                      {Object.keys(preset.values).length} поле(й)
                      {preset.doctor ? " · моё" : preset.clinic ? " · клиника" : " · общее"}
                    </span>
                  </span>
                  {preset.doctor && (
                    <span
                      onClick={e => remove(preset, e)}
                      className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${t.danger}`}
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ConsultationFormPresetPicker;
