"use client";

import { Plus, Trash2 } from "lucide-react";
import { getCurrencySymbol } from "@/utils/currency";
import SearchSelect from "../../schedule/components/SearchSelect";
import type { StaffFormData } from "../types/staffTypes";

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
