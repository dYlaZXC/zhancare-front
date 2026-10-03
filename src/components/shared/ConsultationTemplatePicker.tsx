"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { Award, Check, ChevronDown, LayoutTemplate, Loader2, Search, Sparkles, Star } from "lucide-react";
import { api } from "@/utils/api";

interface TemplateOption {
  id: number;
  name: string;
  scope: "doctor" | "clinic" | "shared" | "system";
  is_default: boolean;
  sections_count: number;
  // Only set for scope="shared" — who published it, for attribution.
  clinic_name?: string | null;
  doctor_name?: string | null;
}

// GET .../available-templates/'s "recommended" array — same shape as
// TemplateOption plus the ranking's own machine-readable output, so the
// picker can explain WHY something is suggested instead of silently
// ordering it first.
interface RecommendedOption extends TemplateOption {
  specialty_name?: string | null;
  is_verified: boolean;
  score: number;
  reasons: string[];
}

const REASON_LABELS: Record<string, string> = {
  specialty_match: "Специальность совпадает",
  visit_type_match: "Тип визита совпадает",
  clinic_template: "Шаблон клиники",
  verified: "Проверено ZhanCare",
  popular: "Популярный",
};

const SCOPE_LABELS: Record<TemplateOption["scope"], string> = {
  doctor: "Мои шаблоны",
  clinic: "Шаблоны клиники",
  shared: "Библиотека шаблонов",
  system: "Системные",
};

const AUTO_LABEL = "Автоматически";
const MENU_MIN_WIDTH = 360;
const MENU_MAX_HEIGHT = 460;

export const TEMPLATE_SWITCH_CONFIRM =
  "Введённое сохранится в записи, но секции, которых нет в новом шаблоне, не будут показаны — они вернутся, если переключить шаблон обратно. Сменить шаблон?";

// The dark theme is for the video-call side sheet, which is styled with inline
// colors rather than Tailwind classes.
const THEMES = {
  light: {
    button: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    menu: "bg-white border border-gray-200 shadow-xl",
    item: "text-gray-700 hover:bg-gray-50",
    itemActive: "bg-blue-50 text-blue-700",
    muted: "text-gray-400",
    heading: "text-gray-400",
    badge: "bg-emerald-50 text-emerald-600",
    search: "bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400",
  },
  dark: {
    button: "border text-[#ebf1ff] hover:brightness-125",
    menu: "border shadow-2xl",
    item: "text-[#ebf1ff] hover:brightness-125",
    itemActive: "text-white",
    muted: "text-[#8f95a6]",
    heading: "text-[#8f95a6]",
    badge: "bg-emerald-500/20 text-emerald-300",
    search: "border text-[#ebf1ff] placeholder-[#8f95a6] focus:border-[#3772ff]",
  },
} as const;

const DARK_SURFACE = { backgroundColor: "#202942", borderColor: "#2956bf" };
const DARK_ACTIVE = { backgroundColor: "#2956bf" };
const DARK_SEARCH = { backgroundColor: "#1a2036", borderColor: "#283353" };

interface MenuPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

/**
 * Lets the doctor pick which consultation-sheet template THIS visit uses.
 * The choice belongs to the one visit — it never changes the doctor's or the
 * clinic's default — and nothing already saved is deleted: the backend keeps
 * every section's value, so switching back brings them back.
 *
 * `basePath` is "/consultations/<meeting_id>" or "/clinic-appointments/<id>"; both
 * expose the same available-templates / select-template endpoints.
 *
 * The menu is portaled to <body> and positioned against the button, so it is
 * never clipped (or squeezed to the width) of a narrow, scrolling sidebar and
 * can show long template names in full.
 */
export function ConsultationTemplatePicker({
  basePath,
  currentTemplateId,
  currentTemplateName,
  selected = false,
  disabled = false,
  theme = "light",
  confirmMessage,
  align = "left",
  onChanged,
}: {
  basePath: string;
  currentTemplateId?: number | null;
  currentTemplateName?: string | null;
  /** true when the doctor hand-picked the current template rather than following the default */
  selected?: boolean;
  disabled?: boolean;
  theme?: "light" | "dark";
  /** When set, the doctor is asked to confirm before switching (e.g. when the form already has content). */
  confirmMessage?: string | null;
  /** Which edge of the button the menu lines up with. */
  align?: "left" | "right";
  /** Receives the record returned by select-template — same shape as the record's retrieve. */
  onChanged: (record: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TemplateOption[] | null>(null);
  const [recommended, setRecommended] = useState<RecommendedOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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
    // Open upwards only when there is clearly more room there.
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

  const positioned = pos !== null;
  useEffect(() => {
    if (open && positioned) searchRef.current?.focus();
  }, [open, positioned]);

  const toggle = async () => {
    if (disabled || busy) return;
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    setOpen(true);
    // Refetched on every open so a template created a minute ago is offered.
    setLoading(true);
    try {
      const res = await api.get(`${basePath}/available-templates/`);
      setOptions(res.data?.templates ?? []);
      setRecommended(res.data?.recommended ?? []);
    } catch {
      toast.error("Не удалось загрузить список шаблонов");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const choose = async (templateId: number | null) => {
    setOpen(false);
    const unchanged = templateId === null ? !selected : selected && templateId === currentTemplateId;
    if (unchanged) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const res = await api.post(`${basePath}/select-template/`, { template_id: templateId });
      onChanged(res.data);
      toast.success(
        templateId === null
          ? "Шаблон выбирается автоматически"
          : `Шаблон изменён: ${res.data?.template_snapshot?.name ?? ""}`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось сменить шаблон");
    } finally {
      setBusy(false);
    }
  };

  const q = query.trim().toLowerCase();
  const showAuto = !q || AUTO_LABEL.toLowerCase().includes(q);
  const visibleRecommended = recommended.filter(o => !q || o.name.toLowerCase().includes(q));
  const grouped = (["doctor", "clinic", "shared", "system"] as const)
    .map(scope => ({
      scope,
      items: (options ?? []).filter(o => o.scope === scope && (!q || o.name.toLowerCase().includes(q))),
    }))
    .filter(g => g.items.length > 0);
  const nothingFound = options !== null && !showAuto && visibleRecommended.length === 0 && grouped.length === 0;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        disabled={disabled || busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={
          disabled
            ? "Шаблон нельзя менять после завершения"
            : `${currentTemplateName ? `${currentTemplateName} — ` : ""}выбрать шаблон консультационного листа для этого приёма`
        }
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${t.button}`}
        style={dark ? DARK_SURFACE : undefined}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <LayoutTemplate className="w-4 h-4 flex-shrink-0" />}
        <span className="flex-1 text-left leading-snug break-words line-clamp-2">{currentTemplateName || "Шаблон листа"}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
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
          <div className="p-2 flex-shrink-0">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.muted}`} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск шаблона..."
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl focus:outline-none transition-colors ${t.search}`}
                style={dark ? DARK_SEARCH : undefined}
              />
            </div>
          </div>

          <div className="overflow-y-auto min-h-0 pb-1.5">
            {loading || options === null ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className={`w-5 h-5 animate-spin ${t.muted}`} />
              </div>
            ) : (
              <>
                {visibleRecommended.length > 0 && (
                  <div className="pt-1">
                    <p className={`px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${t.heading}`}>
                      <Star className="w-3 h-3" /> Рекомендовано для этой консультации
                    </p>
                    {visibleRecommended.map(option => {
                      const active = selected && option.id === currentTemplateId;
                      return (
                        <button
                          key={`rec-${option.id}`}
                          type="button"
                          onClick={() => choose(option.id)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${active ? t.itemActive : t.item}`}
                          style={dark && active ? DARK_ACTIVE : undefined}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-1 font-medium leading-snug break-words">
                              {option.name}
                              {option.is_verified && <Award className="w-3 h-3 flex-shrink-0 text-emerald-500" />}
                            </span>
                            <span className={`block text-xs ${active && !dark ? "text-blue-400" : t.muted}`}>
                              {option.sections_count} секц.
                              {(option.clinic_name || option.doctor_name) && <> · {option.clinic_name || option.doctor_name}</>}
                            </span>
                            <span className="flex flex-wrap gap-1 mt-1">
                              {option.reasons.map(reason => (
                                <span
                                  key={reason}
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${t.badge}`}
                                >
                                  {REASON_LABELS[reason] ?? reason}
                                </span>
                              ))}
                            </span>
                          </span>
                          {active && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {showAuto && (
                  <button
                    type="button"
                    onClick={() => choose(null)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${!selected ? t.itemActive : t.item}`}
                    style={dark && !selected ? DARK_ACTIVE : undefined}
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold">{AUTO_LABEL}</span>
                      <span className={`block text-xs ${!selected && !dark ? "text-blue-400" : t.muted}`}>
                        шаблон по умолчанию врача или клиники
                      </span>
                    </span>
                    {!selected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                )}

                {grouped.map(({ scope, items }) => (
                  <div key={scope} className="mt-1 pt-1">
                    <p className={`px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider ${t.heading}`}>
                      {SCOPE_LABELS[scope]}
                    </p>
                    {items.map(option => {
                      const active = selected && option.id === currentTemplateId;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => choose(option.id)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${active ? t.itemActive : t.item}`}
                          style={dark && active ? DARK_ACTIVE : undefined}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium leading-snug break-words">{option.name}</span>
                            <span className={`block text-xs ${active && !dark ? "text-blue-400" : t.muted}`}>
                              {option.sections_count} секц.
                              {option.scope === "shared" && (option.clinic_name || option.doctor_name) && (
                                <> · {option.clinic_name || option.doctor_name}</>
                              )}
                            </span>
                          </span>
                          {option.is_default && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${t.badge}`}>
                              по умолчанию
                            </span>
                          )}
                          {active && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {nothingFound && (
                  <p className={`px-3.5 py-5 text-sm text-center ${t.muted}`}>Ничего не найдено</p>
                )}
                {!q && grouped.length === 0 && (
                  <p className={`px-3.5 py-4 text-sm text-center ${t.muted}`}>Других шаблонов нет</p>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ConsultationTemplatePicker;
