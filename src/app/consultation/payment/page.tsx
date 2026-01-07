"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faCopy,
  faCheckCircle,
  faArrowLeft,
  faSpinner,
  faQrcode,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function PaymentPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "waiting" | "confirmed" | "failed">("pending");
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const kaspiNumber = "+7 777 123 4567";
  const amount = 15000;
  const consultationId = "CONS-" + Date.now();

  useEffect(() => {
    if (paymentStatus === "pending" || paymentStatus === "waiting") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentStatus("failed");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus]);

  // Simulate payment confirmation check
  useEffect(() => {
    if (paymentStatus === "waiting") {
      // Simulate doctor confirmation after 5 seconds
      const confirmTimer = setTimeout(() => {
        setPaymentStatus("confirmed");
        toast.success("Оплата подтверждена врачом!");

        // Redirect to video call after 2 seconds
        setTimeout(() => {
          router.push("/video-call/patient/demo-call");
        }, 2000);
      }, 5000);

      return () => clearTimeout(confirmTimer);
    }
  }, [paymentStatus, router]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(kaspiNumber);
    setCopied(true);
    toast.success("Номер скопирован!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSent = () => {
    setPaymentStatus("waiting");
    toast.info("Ожидаем подтверждения от врача...");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => router.back()}
            disabled={paymentStatus === "waiting" || paymentStatus === "confirmed"}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Назад</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Оплата консультации</h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">Осталось</p>
            <p className={`text-lg font-bold ${countdown < 60 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(countdown)}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <AnimatePresence mode="wait">
          {paymentStatus === "pending" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              {/* Payment Instructions */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                  <FontAwesomeIcon icon={faCreditCard} className="text-5xl mb-3" />
                  <h2 className="text-3xl font-bold mb-2">Оплата через Kaspi</h2>
                  <p className="text-blue-100">Переведите указанную сумму на номер врача</p>
                </div>

                <div className="p-8">
                  {/* Amount */}
                  <div className="text-center mb-8">
                    <p className="text-gray-600 mb-2">Сумма к оплате</p>
                    <p className="text-5xl font-bold text-gray-900 mb-1">
                      {amount.toLocaleString()} ₸
                    </p>
                    <p className="text-sm text-gray-500">30 минут видео консультации</p>
                  </div>

                  {/* Kaspi Number */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200 mb-6">
                    <p className="text-sm text-gray-600 mb-2 text-center">Номер Kaspi врача</p>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <p className="text-3xl font-bold text-gray-900">{kaspiNumber}</p>
                      <button
                        onClick={handleCopyNumber}
                        className="w-10 h-10 rounded-lg bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
                      >
                        <FontAwesomeIcon
                          icon={copied ? faCheckCircle : faCopy}
                          className={copied ? "text-green-500" : "text-gray-600"}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-center text-gray-500">
                      ID консультации: {consultationId}
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-4 mb-8">
                    <h3 className="font-bold text-gray-900 text-lg">Инструкция:</h3>
                    <ol className="space-y-3 text-gray-600">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          1
                        </span>
                        <span>Откройте приложение Kaspi.kz</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          2
                        </span>
                        <span>Перейдите в раздел "Переводы"</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          3
                        </span>
                        <span>Введите номер телефона: <strong>{kaspiNumber}</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          4
                        </span>
                        <span>Переведите сумму: <strong>{amount.toLocaleString()} ₸</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          5
                        </span>
                        <span>После перевода нажмите кнопку "Я оплатил" ниже</span>
                      </li>
                    </ol>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handlePaymentSent}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                  >
                    Я оплатил
                  </button>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    Врач подтвердит оплату и консультация начнется автоматически
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Важно!</h4>
                    <p className="text-sm text-yellow-800">
                      Не закрывайте эту страницу после оплаты. Мы автоматически перенаправим вас в видео-консультацию после подтверждения врачом.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {paymentStatus === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <div className="inline-block relative mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
                  <FontAwesomeIcon icon={faCreditCard} className="text-white text-5xl" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-transparent border-t-white rounded-full"
                  />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ожидаем подтверждения...
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Врач проверяет оплату. Это займет несколько секунд.
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                <span>Проверка платежа...</span>
              </div>
            </motion.div>
          )}

          {paymentStatus === "confirmed" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-8xl mb-6" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Оплата подтверждена!
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Перенаправляем вас в видео-консультацию...
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                <span>Подключение к видео...</span>
              </div>
            </motion.div>
          )}

          {paymentStatus === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-8xl mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Время истекло
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                К сожалению, время на оплату истекло. Попробуйте начать консультацию заново.
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Вернуться на главную
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
