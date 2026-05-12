"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, CreditCard, Shield, ArrowLeft, Loader2, Clock } from "lucide-react";

const SERVICE_PRICE = 9900;

interface PaymentStepProps {
  address: string;
  apartment: string;
  entrance: string;
  intercom: string;
  addressComment: string;
  appointmentTime: string;
  symptoms: string;
  onBack: () => void;
  onPay: () => void;
  loading?: boolean;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  address,
  apartment,
  entrance,
  intercom,
  addressComment,
  appointmentTime,
  symptoms,
  onBack,
  onPay,
  loading = false,
}) => {
  const prepay = Math.round(SERVICE_PRICE * 0.5);

  const subParts: string[] = [];
  if (apartment) subParts.push(`кв. ${apartment}`);
  if (entrance) subParts.push(`подъезд ${entrance}`);
  if (intercom) subParts.push(`домофон ${intercom}`);
  const fullAddress = subParts.length ? `${address}, ${subParts.join(", ")}` : address;

  const formattedTime = appointmentTime
    ? new Date(appointmentTime).toLocaleString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Детали вызова</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3772ff]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[#3772ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Адрес</p>
              <p className="text-sm font-semibold text-gray-900 break-words">{fullAddress}</p>
              {addressComment && (
                <p className="text-xs text-gray-500 italic mt-0.5">{addressComment}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3772ff]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#3772ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Дата и время</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{formattedTime}</p>
            </div>
          </div>

          {symptoms && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3772ff]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-[#3772ff]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Симптомы</p>
                <p className="text-sm text-gray-800 line-clamp-2">{symptoms}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Стоимость</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Вызов медсестры на дом</span>
            <span className="text-sm font-semibold text-gray-800">
              {SERVICE_PRICE.toLocaleString()} ₸
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Расходные материалы</span>
            <span className="text-xs text-gray-400">уточняется на месте</span>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-900">Предоплата 50%</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Остаток {SERVICE_PRICE - prepay} ₸ — после визита
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-[#3772ff]">
                  {prepay.toLocaleString()} ₸
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badge */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
        <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <p className="text-xs text-emerald-800 font-medium">
          Заявка отправится медсёстрам сразу после подтверждения оплаты
        </p>
      </div>

      {/* Payment methods (visual mock) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 px-2">способы оплаты</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="flex gap-2 justify-center">
        {["Kaspi Pay", "Visa / MC", "Наличные"].map((m) => (
          <span key={m} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 bg-white font-medium">
            {m}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <button
          onClick={onPay}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3772ff] to-[#2956bf] shadow-lg shadow-[#3772ff]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Обработка...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" /> Оплатить {prepay.toLocaleString()} ₸
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
