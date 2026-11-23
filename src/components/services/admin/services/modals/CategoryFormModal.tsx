"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, CheckCircle2, Save, ChevronDown } from "lucide-react";
import type { ServiceCategory, CategoryFormData, StaffMember, ScheduleSource } from "../types/serviceTypes";
import { EMPTY_CATEGORY_FORM, ICON_OPTIONS, getCategoryIcon, toSlug } from "../types/serviceTypes";
import {
  PriceDurationFields, CurrencySelector, ScheduleSourceToggle, DoctorMultiSelect, CapacityCard, ClinicCard,
} from "../components/ServiceFormFields";

// Colours offered as one-click swatches; anything else via the picker.
const COLOR_PRESETS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", "#A855F7", "#EC4899", "#64748B",
];

// Create / edit one category — opened from the "Добавить категорию" header
// button and each card's pencil. Built like ServiceFormModal (same width,
// header, field/label/input styling, toggle card, footer) AND with the same
// fields: a category carries the service form's price / duration / currency /
// schedule source / responsible doctors / slot limit as this clinic's defaults
// for NEW services in it. Weekly hours are NOT edited here — like a service's,
// they have their own "Расписание" modal (the calendar button on the card).
//
// The name/icon/colour/status are the category itself (shared by every
// clinic); everything below "Настройки услуг" is saved for the admin's own
// clinic only.
export function CategoryFormModal({
  initial,
  staff,
  clinicCurrency,
  user,
  onClose,
  onSaved,
}: {
  initial: ServiceCategory | null;
  staff: StaffMember[];
  clinicCurrency: string;
  user: any;
  onClose: () => void;
  onSaved: (cat: ServiceCategory & { synced_services?: number }, mode: "create" | "edit") => void;
}) {
  const editing = initial !== null;
  // Settings are this clinic's; an admin with no clinic (a super admin) only
  // edits the category itself.
  const hasClinic = !!user?.clinic;
  const [form, setForm] = useState<CategoryFormData>(
    initial
      ? { slug: initial.slug, name: initial.name, icon: initial.icon, color: initial.color, is_active: initial.is_active }
      : { ...EMPTY_CATEGORY_FORM },
  );

  // The service form's fields, as this clinic's defaults for new services.
  const s0 = initial?.settings ?? null;
  const [description, setDescription] = useState(s0?.description ?? "");
  const [price, setPrice] = useState(s0?.default_price ?? "");
  const [duration, setDuration] = useState<number | "">(s0?.default_duration_minutes ?? "");
  const [currency, setCurrency] = useState(s0?.default_currency ?? "");
  const [scheduleSource, setScheduleSource] = useState<ScheduleSource>(s0?.default_schedule_source ?? "own");
  const [doctorIds, setDoctorIds] = useState<number[]>(s0?.default_doctor_ids ?? []);
  const [capacity, setCapacity] = useState<number | null>(s0?.default_capacity_per_slot ?? null);
  const [settingsLoading, setSettingsLoading] = useState(editing && hasClinic);

  const [saving, setSaving] = useState(false);
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [iconDropdownRect, setIconDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const iconBtnRef = useRef<HTMLButtonElement>(null);

  // Editing: fetch the saved settings fresh (the list carries them too, but
  // this is what the form must save back over).
  useEffect(() => {
    if (!editing || !hasClinic) return;
    let cancelled = false;
    api.get(`/diagnostics/categories/${initial!.id}/settings/`)
      .then(res => {
        if (cancelled) return;
        const d = res.data;
        setDescription(d.description ?? "");
        setPrice(d.default_price ?? "");
        setDuration(d.default_duration_minutes ?? "");
        setCurrency(d.default_currency ?? "");
        setScheduleSource(d.default_schedule_source ?? "own");
        setDoctorIds(d.default_doctor_ids ?? []);
        setCapacity(d.default_capacity_per_slot ?? null);
      })
      .catch(() => { if (!cancelled) toast.error("Не удалось загрузить настройки категории"); })
      .finally(() => { if (!cancelled) setSettingsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название категории"); return; }
    if (hasClinic && scheduleSource === "doctor" && doctorIds.length === 0) {
      toast.error("Выберите хотя бы одного ответственного врача для расписания по графику врача");
      return;
    }
    // Editing but the settings never loaded: saving would overwrite them with
    // blanks — refuse rather than silently wipe.
    if (hasClinic && editing && settingsLoading) { toast.info("Подождите, настройки категории ещё загружаются"); return; }

    const payload = { ...form, slug: form.slug.trim() || toSlug(form.name) };
    setSaving(true);
    let saved: ServiceCategory | null = null;
    try {
      const res = editing
        ? await api.patch(`/diagnostics/categories/${initial!.id}/`, payload)
        : await api.post("/diagnostics/categories/", payload);
      saved = res.data as ServiceCategory;
    } catch {
      toast.error("Не удалось сохранить категорию");
      setSaving(false);
      return;
    }

    if (!hasClinic) {
      toast.success(editing ? "Категория обновлена" : "Категория добавлена");
      onSaved(saved, editing ? "edit" : "create");
      setSaving(false);
      return;
    }

    try {
      const res = await api.patch(`/diagnostics/categories/${saved.id}/settings/`, {
        description,
        default_price: price === "" ? null : price,
        default_currency: currency || null,
        default_duration_minutes: duration === "" ? null : duration,
        default_schedule_source: scheduleSource,
        default_doctor_ids: doctorIds,
        default_capacity_per_slot: scheduleSource === "doctor" ? null : capacity,
      });
      const synced = (res.data as { synced_services?: number }).synced_services ?? 0;
      toast.success(
        (editing ? "Категория обновлена" : "Категория добавлена")
        + (synced > 0 ? ` · обновлено услуг: ${synced}` : ""),
      );
      onSaved(res.data as ServiceCategory & { synced_services?: number }, editing ? "edit" : "create");
    } catch (e: any) {
      const detail = e?.response?.data;
      const msg = typeof detail === "object" && detail
        ? Object.values(detail as Record<string, unknown>).flat().join(" ")
        : "";
      if (editing) {
        toast.error(msg || "Не удалось сохранить настройки категории");
      } else {
        // The category itself already exists now — close and refresh, so a
        // retry can't try to create it a second time.
        toast.warn("Категория создана, но настройки не сохранились — откройте её и сохраните настройки ещё раз");
        onSaved(saved, "create");
      }
    } finally {
      setSaving(false);
    }
  };

  const SelectedIcon = getCategoryIcon(form.icon);
  const selectedIconLabel = ICON_OPTIONS.find(o => o.value === form.icon)?.label ?? "Выбрать";
  const color = form.color || "#6366F1";

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
              {editing ? "Редактировать категорию" : "Добавить категорию"}
            </h2>
            <p className="text-gray-600 mt-1">Категория диагностических услуг</p>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название категории <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({ ...f, name, slug: editing ? f.slug : toSlug(name) }));
                }}
                placeholder="Например: Гастроэнтерология"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
              {form.slug && <p className="text-xs text-gray-400 mt-1.5 font-mono">slug: {form.slug}</p>}
            </div>

            {hasClinic && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Описание</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Краткое описание категории..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
              </div>
            )}

            {/* Icon picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Иконка</label>
              <div className="relative">
                <button ref={iconBtnRef} type="button" title="Выбрать иконку"
                  onClick={() => {
                    if (iconBtnRef.current) {
                      const r = iconBtnRef.current.getBoundingClientRect();
                      setIconDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                    }
                    setIconDropdownOpen(v => !v);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 focus:border-blue-500 transition-colors text-left">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                    <SelectedIcon size={13} style={{ color }} />
                  </span>
                  <span className="flex-1 text-sm" style={{ color: '#1b1b1b' }}>{selectedIconLabel}</span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${iconDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {iconDropdownOpen && createPortal(
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setIconDropdownOpen(false)} />
                    <div style={{ position: 'fixed', top: iconDropdownRect.top, left: iconDropdownRect.left, width: iconDropdownRect.width, zIndex: 999 }}
                      className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                      {ICON_OPTIONS.map(opt => {
                        const Icon = getCategoryIcon(opt.value);
                        const sel = form.icon === opt.value;
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => { setForm(f => ({ ...f, icon: opt.value })); setIconDropdownOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${sel ? 'bg-blue-50' : ''}`}>
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                              <Icon size={14} style={{ color }} />
                            </span>
                            <span className={`flex-1 text-left ${sel ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{opt.label}</span>
                            {sel && <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body,
                )}
              </div>
            </div>

            {/* Colour */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Цвет</label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map(c => {
                  const active = color.toLowerCase() === c.toLowerCase();
                  return (
                    <button key={c} type="button" title={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center ${
                        active ? 'border-gray-800 scale-105 shadow-md' : 'border-white shadow-sm hover:scale-105'
                      }`}
                      style={{ background: c }}>
                      {active && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                  );
                })}
                {/* Any other colour */}
                <label title="Свой цвет"
                  className="relative w-9 h-9 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center cursor-pointer text-gray-400 text-lg leading-none overflow-hidden">
                  +
                  <input type="color" value={color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </label>
                <span className="ml-1 text-xs font-bold tracking-wider text-gray-500 font-mono">{color.toUpperCase()}</span>
              </div>
            </div>

            {/* Status — same switch card as the service form's slot limit */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${form.is_active ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-semibold mb-0.5 ${form.is_active ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {form.is_active ? 'Категория активна' : 'Категория неактивна'}
                  </p>
                  <p className={`text-xs ${form.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {form.is_active ? 'Показывается пациентам и в записи' : 'Скрыта из записи и списков пациентов'}
                  </p>
                </div>
                <button type="button" role="switch" aria-checked={form.is_active}
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {hasClinic ? (
              <>
                {/* ── Настройки услуг: the service form's own fields ── */}
                <div className="pt-2 border-t-2 border-gray-100">
                  <h3 className="text-lg font-bold mt-6" style={{ color: '#1e263e' }}>Настройки услуг категории</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Услуги этой категории в вашей клинике берут эти значения, если у самой услуги поле не задано вручную.
                    Если у услуги своё значение — приоритет у услуги.
                  </p>
                </div>

                {settingsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    <PriceDurationFields
                      price={price} duration={duration} currency={currency} clinicCurrency={clinicCurrency}
                      onPrice={setPrice} onDuration={setDuration}
                    />

                    {price !== "" && Number(price) > 0 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 -mt-2">
                        Услуги этой категории, у которых своя цена не задана, станут платными по этой цене.
                      </p>
                    )}

                    <CurrencySelector currency={currency} clinicCurrency={clinicCurrency} onChange={setCurrency} />

                    <ScheduleSourceToggle value={scheduleSource} onChange={setScheduleSource} label="Расписание услуг" />

                    <div>
                      <DoctorMultiSelect
                        staff={staff} selectedIds={doctorIds} required={scheduleSource === "doctor"}
                        onChange={setDoctorIds}
                      />
                      {scheduleSource === "doctor" && (
                        <p className="text-xs text-gray-400 mt-1.5">Расписание услуг = объединённые графики выбранных врачей.</p>
                      )}
                    </div>

                    {scheduleSource === "own" && (
                      <CapacityCard value={capacity} onChange={setCapacity} />
                    )}

                    <p className="text-xs text-gray-400 -mt-2">
                      Часы работы категории задаются отдельно — кнопкой с календарём в списке категорий.
                    </p>
                  </>
                )}

                <ClinicCard
                  user={user} note="Настройки категории для этой клиники"
                  footer="Часы, цена и врачи задаются отдельно для каждой клиники — категория общая"
                />
              </>
            ) : (
              <div className="rounded-2xl p-4 border-2 border-amber-100 bg-amber-50 text-sm text-amber-700">
                Цена, длительность, врачи и часы работы задаются для конкретной клиники — у вашей учётной записи клиника не выбрана,
                поэтому здесь можно менять только саму категорию.
              </div>
            )}
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
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {editing ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
