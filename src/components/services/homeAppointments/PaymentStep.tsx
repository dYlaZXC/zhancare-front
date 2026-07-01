"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, CreditCard, Shield, ArrowLeft, Loader2, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useConsultationPayment } from "@/components/payment/useConsultationPayment";

const SERVICE_PRICE = 9900;

const PAYMENT_TEXT = {
  ru: {
    apt: "кв.", entrance: "подъезд", intercom: "домофон",
    callDetails: "Детали вызова", address: "Адрес", dateTime: "Дата и время", symptoms: "Симптомы",
    cost: "Стоимость", nurseHomeVisit: "Вызов медсестры на дом", consumables: "Расходные материалы", clarifiedOnSite: "уточняется на месте",
    prepay50: "Предоплата 50%", remainder: (amount: number) => `Остаток ${amount} ₸ — после визита`,
    trustBadge: "Заявка отправится медсёстрам сразу после подтверждения оплаты",
    paymentMethods: "способы оплаты", cash: "Наличные",
    back: "Назад", processing: "Обработка...", pay: "Оплатить", locale: "ru-RU",
  },
  kz: {
    apt: "пәт.", entrance: "кіреберіс", intercom: "домофон",
    callDetails: "Шақыру деректері", address: "Мекенжай", dateTime: "Күні мен уақыты", symptoms: "Симптомдар",
    cost: "Құны", nurseHomeVisit: "Медбикені үйге шақыру", consumables: "Шығыс материалдары", clarifiedOnSite: "жерде нақтыланады",
    prepay50: "50% алдын ала төлем", remainder: (amount: number) => `Қалғаны ${amount} ₸ — визиттен кейін`,
    trustBadge: "Өтінім төлем расталғаннан кейін бірден медбикелерге жіберіледі",
    paymentMethods: "төлем тәсілдері", cash: "Қолма-қол",
    back: "Артқа", processing: "Өңделуде...", pay: "Төлеу", locale: "kk-KZ",
  },
  en: {
    apt: "apt.", entrance: "entrance", intercom: "intercom",
    callDetails: "Call details", address: "Address", dateTime: "Date and time", symptoms: "Symptoms",
    cost: "Cost", nurseHomeVisit: "Nurse home visit", consumables: "Consumables", clarifiedOnSite: "confirmed on site",
    prepay50: "50% prepayment", remainder: (amount: number) => `Remaining ${amount} ₸ — after the visit`,
    trustBadge: "The request is sent to nurses right after payment is confirmed",
    paymentMethods: "payment methods", cash: "Cash",
    back: "Back", processing: "Processing...", pay: "Pay", locale: "en-US",
  },
  uz: {
    apt: "kv.", entrance: "kirish", intercom: "domofon",
    callDetails: "Chaqiruv ma'lumotlari", address: "Manzil", dateTime: "Sana va vaqt", symptoms: "Simptomlar",
    cost: "Narxi", nurseHomeVisit: "Hamshirani uyga chaqirish", consumables: "Sarf materiallari", clarifiedOnSite: "joyida aniqlashtiriladi",
    prepay50: "50% oldindan to'lov", remainder: (amount: number) => `Qolgan ${amount} ₸ — tashrifdan keyin`,
    trustBadge: "To'lov tasdiqlangandan so'ng ariza darhol hamshiralarga yuboriladi",
    paymentMethods: "to'lov usullari", cash: "Naqd pul",
    back: "Orqaga", processing: "Qayta ishlanmoqda...", pay: "To'lash", locale: "uz-UZ",
  },
};

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
  const { language: uiLanguage } = useLanguage();
  const tt = PAYMENT_TEXT[uiLanguage as keyof typeof PAYMENT_TEXT] ?? PAYMENT_TEXT.ru;
  const prepay = Math.round(SERVICE_PRICE * 0.5);

  const subParts: string[] = [];
  if (apartment) subParts.push(`${tt.apt} ${apartment}`);
  if (entrance) subParts.push(`${tt.entrance} ${entrance}`);
  if (intercom) subParts.push(`${tt.intercom} ${intercom}`);
  const fullAddress = subParts.length ? `${address}, ${subParts.join(", ")}` : address;

  const formattedTime = appointmentTime
    ? new Date(appointmentTime).toLocaleString(tt.locale, {
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{tt.callDetails}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3772ff]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[#3772ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{tt.address}</p>
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
              <p className="text-xs text-gray-400 mb-0.5">{tt.dateTime}</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{formattedTime}</p>
            </div>
          </div>

          {symptoms && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3772ff]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-[#3772ff]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{tt.symptoms}</p>
                <p className="text-sm text-gray-800 line-clamp-2">{symptoms}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{tt.cost}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{tt.nurseHomeVisit}</span>
            <span className="text-sm font-semibold text-gray-800">
              {SERVICE_PRICE.toLocaleString()} ₸
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">{tt.consumables}</span>
            <span className="text-xs text-gray-400">{tt.clarifiedOnSite}</span>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-900">{tt.prepay50}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {tt.remainder(SERVICE_PRICE - prepay)}
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
          {tt.trustBadge}
        </p>
      </div>

      {/* Payment methods (visual mock) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 px-2">{tt.paymentMethods}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="flex gap-2 justify-center">
        {["Kaspi Pay", "Visa / MC", tt.cash].map((m) => (
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
          <ArrowLeft className="w-4 h-4" /> {tt.back}
        </button>
        <button
          onClick={onPay}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3772ff] to-[#2956bf] shadow-lg shadow-[#3772ff]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {tt.processing}
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" /> {tt.pay} {prepay.toLocaleString()} ₸
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
