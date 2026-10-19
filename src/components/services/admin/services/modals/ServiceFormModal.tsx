"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import {
  X, Loader2, CheckCircle2, Save, ChevronDown, ClipboardList, Boxes,
} from "lucide-react";
import type {
  Service, ServiceCategory, StaffMember, ServiceFormData, CategorySettings, InheritableField,
} from "../types/serviceTypes";
import { EMPTY_SERVICE_FORM, getCategoryIcon } from "../types/serviceTypes";
import {
  PriceDurationFields, CurrencySelector, ScheduleSourceToggle, DoctorMultiSelect, CapacityCard, ClinicCard,
  InheritHint,
} from "../components/ServiceFormFields";
import ConsumptionRulesSection from "../../warehouse/components/ConsumptionRulesSection";

// ─── Following the category ─────────────────────────────────────────────────
// A field the admin has NOT set on this service follows its category (this
// clinic's settings for it); a field they HAVE set is the service's own and
// always wins. The server is the authority (diagnostics/category_defaults.py) —
// it re-applies the category to every non-own field on save — this just shows
// the same thing while editing: values from the category, tagged "из категории",
// and a "как в категории" link on a field that has been overridden.

const FORM_KEY: Record<InheritableField, keyof ServiceFormData> = {
  description: "description", price: "price", currency: "currency", duration_minutes: "duration_minutes",
  schedule_source: "schedule_source", doctors: "doctor_ids", capacity_per_slot: "capacity_per_slot",
};
const INHERITABLE = Object.keys(FORM_KEY) as InheritableField[];

/** What the category supplies for a field — undefined when it doesn't define one. */
function categoryValue(st: CategorySettings | null | undefined, f: InheritableField): unknown {
  if (!st || !st.configured) return undefined;
  switch (f) {
    case "description": return st.description.trim() ? st.description : undefined;
    case "price": return st.default_price ?? undefined;
    case "currency": return st.default_currency ?? undefined;
    case "duration_minutes": return st.default_duration_minutes ?? undefined;
    case "schedule_source": return st.default_schedule_source;
    case "doctors": return st.default_doctor_ids.length ? st.default_doctor_ids : undefined;
    // Doctor mode has no fixed per-slot capacity — the server clears it too.
    case "capacity_per_slot": return st.default_schedule_source === "doctor" ? null : (st.default_capacity_per_slot ?? undefined);
  }
}

// Put `next`'s values on every field the service hasn't set itself. A field the
// previous category defined but the new one doesn't goes back to blank when
// creating (nothing to follow any more); when editing it keeps its value, as
// the server does.
function followCategory(
  form: ServiceFormData, own: Set<InheritableField>,
  prev: ServiceCategory | undefined, next: ServiceCategory | undefined, resetUndefined: boolean,
): ServiceFormData {
  const out: Record<string, unknown> = { ...form };
  INHERITABLE.forEach(f => {
    if (own.has(f)) return;
    const v = categoryValue(next?.settings, f);
    if (v !== undefined) out[FORM_KEY[f]] = v;
    else if (resetUndefined && categoryValue(prev?.settings, f) !== undefined) out[FORM_KEY[f]] = EMPTY_SERVICE_FORM[FORM_KEY[f]];
  });
  return out as unknown as ServiceFormData;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ─── Service Form Modal ─────────────────────────────────────────────────────

export function ServiceFormModal({
  mode,
  initial,
  categories,
  staff,
  clinicCurrency,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: Service | null;
  categories: ServiceCategory[];
  staff: StaffMember[];
  clinicCurrency: string;
  user: any;
  onClose: () => void;
  onSaved: (service: Service) => void;
}) {
  // Fields this service sets itself (edit: as saved; create: none yet — every
  // field follows the category until the admin types in it).
  const [own, setOwn] = useState<Set<InheritableField>>(
    () => new Set(mode === "edit" ? (initial?.own_fields ?? []) : []),
  );
  const [form, setForm] = useState<ServiceFormData>(() => {
    if (mode === "edit" && initial) {
      return {
        name: initial.name, description: initial.description || "", price: initial.price || "",
        duration_minutes: initial.duration_minutes, category: initial.category,
        currency: initial.currency || "", schedule_source: initial.schedule_source ?? "own",
        doctor_ids: initial.doctor_ids ?? [],
        capacity_per_slot: initial.capacity_per_slot ?? null,
        warehouse_auto_deduct_enabled: initial.warehouse_auto_deduct_enabled ?? true,
      };
    }
    const first = categories[0];
    return followCategory({ ...EMPTY_SERVICE_FORM, category: first?.slug ?? "" }, new Set(), undefined, first, false);
  });
  const [saving, setSaving] = useState(false);
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catDropdownRect, setCatDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const catBtnRef = useRef<HTMLButtonElement>(null);

  const selected = categories.find(c => c.slug === form.category);
  const SelIcon = selected ? getCategoryIcon(selected.icon) : ClipboardList;

  // The admin edited a field -> it is now the service's own.
  const setOwnField = (f: InheritableField, patch: Partial<ServiceFormData>) => {
    setForm(x => ({ ...x, ...patch }));
    setOwn(o => new Set(o).add(f));
  };
  // "Как в категории": back to following it.
  const resetField = (f: InheritableField) => {
    const v = categoryValue(selected?.settings, f);
    if (v === undefined) return;
    setForm(x => ({ ...x, [FORM_KEY[f]]: v }));
    setOwn(o => { const n = new Set(o); n.delete(f); return n; });
  };

  const describe = (f: InheritableField, v: unknown): string => {
    switch (f) {
      case "duration_minutes": return `${v} мин`;
      case "schedule_source": return v === "doctor" ? "по графику врача" : "своё расписание";
      case "capacity_per_slot": return v ? String(v) : "без лимита";
      case "doctors": return (v as number[]).map(id => staff.find(d => d.id === id)?.last_name ?? "").filter(Boolean).join(", ");
      case "description": { const t = String(v); return t.length > 28 ? `${t.slice(0, 28)}…` : t; }
      default: return String(v);
    }
  };

  // The tag / link next to a field's label — only when the category has a value for it.
  const hint = (f: InheritableField, compact = false) => {
    const v = categoryValue(selected?.settings, f);
    if (v === undefined) return null;
    const following = !own.has(f);
    if (!following && same(form[FORM_KEY[f]], v)) return null;
    return <InheritHint following={following} compact={compact} categoryValue={describe(f, v)} onReset={() => resetField(f)} />;
  };
  const followedCount = INHERITABLE.filter(f => !own.has(f) && categoryValue(selected?.settings, f) !== undefined).length;

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название услуги"); return; }
    if (form.schedule_source === "doctor" && form.doctor_ids.length === 0) {
      toast.error("Выберите хотя бы одного ответственного врача для расписания по графику врача");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price || null,
        currency: form.currency || clinicCurrency,
        doctor_ids: form.doctor_ids,
        capacity_per_slot: form.schedule_source === "doctor" ? null : form.capacity_per_slot,
        warehouse_auto_deduct_enabled: form.warehouse_auto_deduct_enabled,
        // What this service set itself; the server applies the category to the rest.
        own_fields: Array.from(own),
      };
      let res;
      if (mode === "edit") {
        res = await api.patch(`/diagnostics/services/${initial!.id}/`, payload);
        toast.success("Услуга обновлена");
      } else {
        res = await api.post("/diagnostics/services/", payload);
        toast.success("Услуга добавлена");
      }
      onSaved(res.data);
    } catch {
      toast.error("Не удалось сохранить услугу");
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setModalMouseDownTarget(e.target);
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modalMouseDownTarget === e.target) onClose();
    setModalMouseDownTarget(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-[160]">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
              {mode === "edit" ? "Редактировать услугу" : "Добавить услугу"}
            </h2>
            <p className="text-gray-600 mt-1">Диагностическая услуга клиники</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-8 pt-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Категория</label>
              <div className="relative">
                <button ref={catBtnRef} type="button" title="Выбрать категорию"
                  onClick={() => {
                    if (catBtnRef.current) {
                      const r = catBtnRef.current.getBoundingClientRect();
                      setCatDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                    }
                    setCatDropdownOpen(v => !v);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 focus:border-blue-500 transition-colors text-left">
                  {selected
                    ? <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${selected.color}20` }}>
                        <SelIcon size={13} style={{ color: selected.color }} />
                      </span>
                    : <ClipboardList size={14} className="text-gray-400 flex-shrink-0" />
                  }
                  <span className="flex-1 text-sm" style={{ color: selected ? '#1b1b1b' : '#9ca3af' }}>
                    {selected ? selected.name : 'Выберите категорию'}
                  </span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${catDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {catDropdownOpen && createPortal(
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setCatDropdownOpen(false)} />
                    <div style={{ position: 'fixed', top: catDropdownRect.top, left: catDropdownRect.left, width: catDropdownRect.width, zIndex: 999 }}
                      className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                      {categories.map(cat => {
                        const Icon = getCategoryIcon(cat.icon);
                        const sel = form.category === cat.slug;
                        return (
                          <button key={cat.id} type="button"
                            onClick={() => {
                              setForm(f => followCategory(
                                { ...f, category: cat.slug }, own,
                                categories.find(c => c.slug === f.category), cat, mode === "create",
                              ));
                              setCatDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${sel ? 'bg-blue-50' : ''}`}>
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
                              <Icon size={14} style={{ color: cat.color }} />
                            </span>
                            <span className={`flex-1 ${sel ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{cat.name}</span>
                            {sel && <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: cat.color }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body
                )}
              </div>
              {followedCount > 0 && (
                <p className="text-xs text-blue-600 mt-1.5">
                  Поля с отметкой «из категории» берутся из настроек категории «{selected?.name}». Своё значение услуги всегда в приоритете.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название услуги <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Например: Общий анализ крови"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Описание{hint("description")}</label>
              <textarea rows={2} value={form.description} onChange={e => setOwnField("description", { description: e.target.value })}
                placeholder="Краткое описание услуги..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
            </div>
            <PriceDurationFields
              price={form.price} duration={form.duration_minutes} currency={form.currency} clinicCurrency={clinicCurrency}
              onPrice={v => setOwnField("price", { price: v })}
              onDuration={v => setOwnField("duration_minutes", { duration_minutes: v === "" ? 0 : v })}
              priceExtra={hint("price", true)} durationExtra={hint("duration_minutes", true)}
            />

            <CurrencySelector
              currency={form.currency} clinicCurrency={clinicCurrency}
              onChange={v => setOwnField("currency", { currency: v })}
              extra={hint("currency")}
            />

            <ScheduleSourceToggle
              value={form.schedule_source}
              onChange={v => setOwnField("schedule_source", { schedule_source: v })}
              extra={hint("schedule_source")}
            />

            <div>
              <DoctorMultiSelect
                staff={staff} selectedIds={form.doctor_ids} required={form.schedule_source === "doctor"}
                onChange={ids => setOwnField("doctors", { doctor_ids: ids })}
                extra={hint("doctors")}
              />
              {form.schedule_source === "doctor" && (
                <p className="text-xs text-gray-400 mt-1.5">Расписание услуги = объединённые графики выбранных врачей.</p>
              )}
            </div>

            {/* Slot limit — meaningless in doctor-mode, capacity is decided by which assigned doctors are free */}
            {form.schedule_source === "own" && (
              <CapacityCard
                value={form.capacity_per_slot}
                onChange={v => setOwnField("capacity_per_slot", { capacity_per_slot: v })}
                extra={hint("capacity_per_slot")}
              />
            )}

            {mode === "edit" && initial && (
              <div className="rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    Автоматически списывать со склада
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, warehouse_auto_deduct_enabled: !f.warehouse_auto_deduct_enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      form.warehouse_auto_deduct_enabled ? "bg-amber-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        form.warehouse_auto_deduct_enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
                <ConsumptionRulesSection
                  diagnosticsServiceId={initial.id}
                  disabled={!form.warehouse_auto_deduct_enabled}
                />
              </div>
            )}

            <ClinicCard
              user={user} note="Клиника услуги"
              footer={mode === "edit" ? 'Услуга привязана к этой клинике' : 'Услуга будет автоматически привязана к вашей клинике'}
            />
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 z-[160] -mx-8 mt-8 flex gap-4 rounded-b-3xl border-t-2 border-gray-100 bg-white px-8 pt-6 pb-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "edit" ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {mode === "edit" ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
