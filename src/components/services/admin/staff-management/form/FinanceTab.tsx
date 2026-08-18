"use client";

import { Building2, CreditCard, Plus, Trash2, Wallet } from "lucide-react";
import { getCurrencySymbol } from "@/utils/currency";
import SearchSelect from "../../schedule/components/SearchSelect";
import type { StaffFormData } from "../types/staffTypes";

const PAYMENT_PREFERENCE_OPTIONS: {
  value: string;
  label: string;
  sub: string;
  Icon: React.ElementType;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  selectedIconBg: string;
  selectedIconColor: string;
}[] = [
  {
    value: 'pay_at_clinic',
    label: 'Без предоплаты',
    sub: 'Оплата на приёме',
    Icon: Building2,
    selectedBg: '#f0fdf4',
    selectedBorder: '#86efac',
    selectedText: '#15803d',
    selectedIconBg: '#dcfce7',
    selectedIconColor: '#16a34a',
  },
  {
    value: 'full_prepay',
    label: 'Полная предоплата',
    sub: '100% заранее',
    Icon: CreditCard,
    selectedBg: '#faf5ff',
    selectedBorder: '#c4b5fd',
    selectedText: '#7c3aed',
    selectedIconBg: '#ede9fe',
    selectedIconColor: '#7c3aed',
  },
  {
    value: 'partial_prepay',
    label: 'Частичная',
    sub: 'Депозит заранее',
    Icon: Wallet,
    selectedBg: '#fffbeb',
    selectedBorder: '#fcd34d',
    selectedText: '#b45309',
    selectedIconBg: '#fef3c7',
    selectedIconColor: '#d97706',
  },
];

function PaymentPreferenceButtons({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {PAYMENT_PREFERENCE_OPTIONS.map(({ value: optValue, label, sub, Icon, selectedBg, selectedBorder, selectedText, selectedIconBg, selectedIconColor }) => {
        const isSelected = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
            style={{
              backgroundColor: isSelected ? selectedBg : '#fff',
              borderColor: isSelected ? selectedBorder : '#e5e7eb',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: isSelected ? selectedIconBg : '#f3f4f6' }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: isSelected ? selectedIconColor : '#9ca3af' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight" style={{ color: isSelected ? selectedText : '#374151' }}>
                {label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function FinanceTab({
  form,
  set,
  clinicCurrency,
  diagCommissions,
  diagServices,
  onAddDiagCommission,
  onRemoveDiagCommission,
  onDiagCommissionChange,
}: {
  form: StaffFormData;
  set: (k: keyof StaffFormData, v: any) => void;
  clinicCurrency: string;
  diagCommissions: { service_id: string; doctor_share_percent: string }[];
  diagServices: { id: number; name: string; price: number | null }[];
  onAddDiagCommission: () => void;
  onRemoveDiagCommission: (index: number) => void;
  onDiagCommissionChange: (index: number, field: 'service_id' | 'doctor_share_percent', value: string) => void;
}) {
  return (
    <>
      {/* Consultation Prices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Цены консультации</label>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            {getCurrencySymbol(clinicCurrency)} {clinicCurrency}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Приём в клинике</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={form.offline_consultation_price}
                onChange={(e) => set('offline_consultation_price', e.target.value)}
                className="w-full pl-4 pr-14 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md pointer-events-none">
                {getCurrencySymbol(clinicCurrency)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Видеоконсультация</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={form.online_consultation_price}
                onChange={(e) => set('online_consultation_price', e.target.value)}
                className="w-full pl-4 pr-14 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md pointer-events-none">
                {getCurrencySymbol(clinicCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment preference: how the doctor prefers to receive payment, per consultation type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Предпочтительный способ оплаты</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Приём в клинике</label>
            <PaymentPreferenceButtons
              value={form.offline_payment_preference}
              onChange={(v) => set('offline_payment_preference', v)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Видеоконсультация</label>
            <PaymentPreferenceButtons
              value={form.online_payment_preference}
              onChange={(v) => set('online_payment_preference', v)}
            />
          </div>
        </div>
      </div>

      {/* Revenue split: doctor's cut vs clinic's cut, per consultation type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Доля врача от консультации</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Приём в клинике</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.offline_doctor_share_percent}
                onChange={(e) => set('offline_doctor_share_percent', e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md pointer-events-none">%</span>
            </div>
            {(() => {
              const price = Number(form.offline_consultation_price) || 0;
              const doctorAmt = Math.round(price * (Number(form.offline_doctor_share_percent) || 0) / 100);
              const sym = getCurrencySymbol(clinicCurrency);
              return (
                <p className="text-xs text-gray-400 mt-1">
                  Врач: {doctorAmt.toLocaleString('ru-RU')} {sym} · Клиника: {(price - doctorAmt).toLocaleString('ru-RU')} {sym}
                </p>
              );
            })()}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Видеоконсультация</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.online_doctor_share_percent}
                onChange={(e) => set('online_doctor_share_percent', e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md pointer-events-none">%</span>
            </div>
            {(() => {
              const price = Number(form.online_consultation_price) || 0;
              const doctorAmt = Math.round(price * (Number(form.online_doctor_share_percent) || 0) / 100);
              const sym = getCurrencySymbol(clinicCurrency);
              return (
                <p className="text-xs text-gray-400 mt-1">
                  Врач: {doctorAmt.toLocaleString('ru-RU')} {sym} · Клиника: {(price - doctorAmt).toLocaleString('ru-RU')} {sym}
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Diagnostics commissions: which tests this doctor earns a cut of when referring patients */}
      {form.role === 'doctor' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">Проценты за диагностику</label>
            <button
              type="button"
              onClick={onAddDiagCommission}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
          {diagCommissions.length === 0 ? (
            <p className="text-xs text-gray-400">
              Врач не получает процент с диагностики. Добавьте услугу, чтобы назначить комиссию за назначенные обследования.
            </p>
          ) : (
            <div className="space-y-3">
              {diagCommissions.map((row, index) => {
                const service = diagServices.find(s => String(s.id) === row.service_id);
                const price = service?.price ?? null;
                const pct = Number(row.doctor_share_percent) || 0;
                const doctorAmt = price != null ? Math.round(price * pct / 100) : null;
                const sym = getCurrencySymbol(clinicCurrency);
                return (
                  <div key={index}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchSelect
                          options={diagServices.map(s => ({
                            id: s.id,
                            label: s.name,
                            subtitle: s.price != null ? `${s.price.toLocaleString('ru-RU')} ${getCurrencySymbol(clinicCurrency)}` : undefined,
                          }))}
                          value={row.service_id}
                          onChange={(val) => onDiagCommissionChange(index, 'service_id', val)}
                          placeholder="Выберите услугу..."
                        />
                      </div>
                      <div className="relative w-28 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={row.doctor_share_percent}
                          onChange={(e) => onDiagCommissionChange(index, 'doctor_share_percent', e.target.value)}
                          className="w-full pl-3 pr-8 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="20"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-600">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveDiagCommission(index)}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {doctorAmt != null && (
                      <p className="text-xs text-gray-400 mt-1 ml-1">
                        При цене {price!.toLocaleString('ru-RU')} {sym}: врач получит {doctorAmt.toLocaleString('ru-RU')} {sym}, клиника — {(price! - doctorAmt).toLocaleString('ru-RU')} {sym}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
