"use client";

import { useRef, useState, type ReactNode } from "react";
import { CURRENCIES, getCurrencySymbol } from "@/utils/currency";
import { X, CheckCircle2, Stethoscope } from "lucide-react";
import type { StaffMember, ScheduleSource } from "../types/serviceTypes";

// The form fields the service editor and the category editor share, so the two
// look and behave identically (a category's settings ARE the service form's
// fields, as the defaults a new service in it starts with).

const LABEL = "block text-sm font-semibold text-gray-700 mb-2";
const INPUT = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors";

// ── "Из категории" marker ───────────────────────────────────────────────────
// Next to a field's label in the SERVICE form when its category supplies a value:
//   the service follows the category         -> a quiet "из категории" tag;
//   the service set its own, different value -> a link back to the category's.
export function InheritHint({
  following, onReset, categoryValue, compact = false,
}: {
  following: boolean;
  onReset: () => void;
  /** What "как в категории" would set, shown in the link. */
  categoryValue: string;
  /** Half-width fields (price / duration): the link stays on the label's line, the value moves to a tooltip. */
  compact?: boolean;
}) {
  if (following) {
    return (
      <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 align-middle">
        из категории
      </span>
    );
  }
  return (
    <button type="button" onClick={onReset} title={categoryValue ? `Вернуть значение категории: ${categoryValue}` : undefined}
      className="ml-2 text-[11px] font-semibold text-blue-600 hover:underline align-middle whitespace-nowrap">
      ↺ как в категории{!compact && categoryValue ? `: ${categoryValue}` : ""}
    </button>
  );
}

// ── Price + duration ────────────────────────────────────────────────────────
export function PriceDurationFields({
  price, duration, currency, clinicCurrency, onPrice, onDuration, priceExtra, durationExtra,
}: {
  price: string;
  duration: number | "";
  currency: string;
  clinicCurrency: string;
  onPrice: (v: string) => void;
  onDuration: (v: number | "") => void;
  priceExtra?: ReactNode;
  durationExtra?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Цена{priceExtra}</label>
        <div className="relative">
          <input type="number" min="0" value={price} onChange={e => onPrice(e.target.value)}
            placeholder="0"
            className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 pointer-events-none">
            {getCurrencySymbol(currency || clinicCurrency)}
          </span>
        </div>
      </div>
      <div>
        <label className={LABEL}>Длительность (мин){durationExtra}</label>
        <input type="number" min="5" max="480" value={duration}
          onChange={e => onDuration(e.target.value === "" ? "" : Number(e.target.value))}
          className={INPUT} />
      </div>
    </div>
  );
}

// ── Currency ────────────────────────────────────────────────────────────────
export function CurrencySelector({
  currency, clinicCurrency, onChange, extra,
}: {
  currency: string;
  clinicCurrency: string;
  onChange: (v: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>
        Валюта цены{extra}
        {!currency && <span className="ml-1.5 font-normal text-gray-400">(по умолчанию клиники: {clinicCurrency})</span>}
      </label>
      <div className="grid grid-cols-4 gap-2">
        {CURRENCIES.map(cur => {
          const active = (currency || clinicCurrency) === cur.value;
          return (
            <button key={cur.value} type="button"
              onClick={() => onChange(cur.value)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}>
              <span className={`text-sm leading-none ${active ? 'text-blue-600' : 'text-gray-400'}`}>{cur.symbol}</span>
              {cur.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Schedule source (own / follows the doctors) ─────────────────────────────
export function ScheduleSourceToggle({
  value, onChange, label = "Расписание услуги", extra,
}: {
  value: ScheduleSource;
  onChange: (v: ScheduleSource) => void;
  label?: string;
  extra?: ReactNode;
}) {
  const options: { key: ScheduleSource; title: string; hint: string }[] = [
    { key: "own", title: "Своё расписание", hint: "Настраивается отдельно для услуги" },
    { key: "doctor", title: "По графику врача", hint: "Следует расписанию назначенных врачей" },
  ];
  return (
    <div>
      <label className={LABEL}>{label}{extra}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(o => (
          <button key={o.key} type="button" onClick={() => onChange(o.key)}
            className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
              value === o.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}>
            {o.title}
            <span className="block text-xs font-normal mt-0.5 opacity-70">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Responsible doctors — searchable multi-select with removable tags ───────
export function DoctorMultiSelect({
  staff, selectedIds, onChange, required, extra,
}: {
  staff: StaffMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  required?: boolean;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = staff.filter(d => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${d.last_name} ${d.first_name} ${d.specialization ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <label className={LABEL}>
        Ответственные врачи {required && <span className="text-red-500">*</span>}{extra}
      </label>
      <div className="relative">
        <div
          onClick={() => { setOpen(true); searchRef.current?.focus(); }}
          className="relative z-[151] w-full min-h-[48px] px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus-within:border-blue-500 transition-colors flex flex-wrap items-center gap-1.5 cursor-text"
        >
          {selectedIds.map(id => {
            const d = staff.find(s => s.id === id);
            if (!d) return null;
            return (
              <span key={id}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 whitespace-nowrap">
                <Stethoscope size={11} className="text-blue-400 flex-shrink-0" />
                {d.last_name} {d.first_name}
                <button type="button"
                  onClick={e => { e.stopPropagation(); onChange(selectedIds.filter(x => x !== id)); }}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <X size={10} />
                </button>
              </span>
            );
          })}
          <input
            ref={searchRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selectedIds.length === 0 ? "Начните вводить имя врача..." : ""}
            className="flex-1 min-w-[140px] outline-none text-sm bg-transparent py-1"
          />
        </div>
        {open && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => { setOpen(false); setSearch(""); }} />
            <div className="absolute left-0 right-0 top-full mt-1 z-[151] bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">Врачи не найдены</p>
              ) : filtered.map(d => {
                const checked = selectedIds.includes(d.id);
                return (
                  <button key={d.id} type="button"
                    onClick={() => {
                      onChange(checked ? selectedIds.filter(id => id !== d.id) : [...selectedIds, d.id]);
                      setSearch("");
                      searchRef.current?.focus();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${checked ? 'bg-blue-50' : ''}`}
                  >
                    <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${checked ? 'text-blue-700' : 'text-gray-800'}`}>
                        {d.last_name} {d.first_name}
                      </p>
                      {d.specialization && <p className="text-xs text-gray-400 mt-0.5 truncate">{d.specialization}</p>}
                    </span>
                    {checked && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Slot limit ──────────────────────────────────────────────────────────────
export function CapacityCard({
  value, onChange, extra,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  extra?: ReactNode;
}) {
  const limited = value !== null;
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${limited ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className={`text-sm font-semibold mb-0.5 ${limited ? 'text-blue-700' : 'text-gray-700'}`}>
            Лимит пациентов на слот{extra}
          </p>
          <p className={`text-xs ${limited ? 'text-blue-500' : 'text-gray-400'}`}>
            {limited ? 'Ограничено' : 'Без ограничений'}
          </p>
        </div>
        <button type="button"
          onClick={() => onChange(limited ? null : 1)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${limited ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${limited ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
      {value !== null && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm text-blue-700 font-semibold">Количество:</span>
          <input type="number" min="1" max="999" value={value}
            onChange={e => onChange(Math.max(1, Number(e.target.value)))}
            className="w-20 text-center px-2 py-1.5 rounded-lg border-2 border-blue-300 text-sm font-bold text-blue-700 outline-none focus:border-blue-500 transition-colors bg-white" />
          <span className="text-sm text-blue-500">
            {value === 1 ? 'пациент' : value < 5 ? 'пациента' : 'пациентов'} на слот
          </span>
        </div>
      )}
    </div>
  );
}

// ── Clinic card ─────────────────────────────────────────────────────────────
export function ClinicCard({
  user, note, footer,
}: {
  user: any;
  note: string;
  /** The tick line under the clinic (what being bound to it means). */
  footer?: string;
}) {
  return (
    <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
      <div className="flex items-center gap-3">
        {user?.clinic?.logo ? (
          <div className="flex-shrink-0 bg-white p-1.5 rounded-xl border-2 border-blue-200 shadow-sm w-10 h-10 flex items-center justify-center">
            <img
              src={user.clinic.logo}
              alt={user.clinic.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.style && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex');
              }}
            />
            <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-gray-800">{user?.clinic?.name || 'Ваша клиника'}</p>
          <p className="text-xs text-gray-500">{note}</p>
        </div>
      </div>
      {footer && (
        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {footer}
        </p>
      )}
    </div>
  );
}
