"use client";

import { Building2, CreditCard, Gift, Wallet } from "lucide-react";
import type { PaymentTypeOption } from "../types/addEventTypes";

const PAYMENT_TYPE_OPTIONS: {
  type: PaymentTypeOption;
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
    type: 'pay_at_clinic',
    label: 'В клинике',
    sub: 'Оплата при визите',
    Icon: Building2,
    selectedBg: '#f0fdf4',
    selectedBorder: '#86efac',
    selectedText: '#15803d',
    selectedIconBg: '#dcfce7',
    selectedIconColor: '#16a34a',
  },
  {
    type: 'free',
    label: 'Бесплатно',
    sub: 'Без оплаты',
    Icon: Gift,
    selectedBg: '#eff6ff',
    selectedBorder: '#93c5fd',
    selectedText: '#1d4ed8',
    selectedIconBg: '#dbeafe',
    selectedIconColor: '#2563eb',
  },
  {
    type: 'full_prepay',
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
    type: 'partial_prepay',
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

export function PaymentSection({
  paymentType,
  onPaymentTypeChange,
  prepayAmount,
  onPrepayAmountChange,
  doctorPrice,
  doctorPreference,
}: {
  paymentType: PaymentTypeOption;
  onPaymentTypeChange: (type: PaymentTypeOption) => void;
  prepayAmount: string;
  onPrepayAmountChange: (val: string) => void;
  doctorPrice: number;
  doctorPreference?: PaymentTypeOption;
}) {
  const visibleOptions = PAYMENT_TYPE_OPTIONS.filter(o => o.type !== 'free' || doctorPrice === 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="block text-sm font-semibold" style={{ color: '#1e263e' }}>
          Тип оплаты
        </label>
        {doctorPreference && paymentType === doctorPreference && (
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Как настроено у врача
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visibleOptions.map(({ type, label, sub, Icon, selectedBg, selectedBorder, selectedText, selectedIconBg, selectedIconColor }) => {
          const isSelected = paymentType === type;
          const isDoctorDefault = doctorPreference === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onPaymentTypeChange(type)}
              className="relative flex items-center gap-3 px-3 py-3 rounded-2xl border-2 text-left transition-all"
              style={{
                backgroundColor: isSelected ? selectedBg : '#fff',
                borderColor: isSelected ? selectedBorder : (isDoctorDefault ? '#bfdbfe' : '#e5e7eb'),
              }}
            >
              {isDoctorDefault && !isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" title="Предпочтение врача" />
              )}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isSelected ? selectedIconBg : '#f3f4f6' }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isSelected ? selectedIconColor : '#9ca3af' }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: isSelected ? selectedText : '#374151' }}>
                  {label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {paymentType === 'partial_prepay' && (
        <div className="mt-3">
          <label className="block text-xs font-semibold mb-1.5 text-gray-600">
            Сумма предоплаты <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={prepayAmount}
              onChange={e => onPrepayAmountChange(e.target.value)}
              placeholder="0"
              min={1}
              required
              className="w-full px-4 py-3 pr-16 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm bg-amber-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-amber-600">
              ₸
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
