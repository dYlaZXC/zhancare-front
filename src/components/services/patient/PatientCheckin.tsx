"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api, getAccessToken } from "@/utils/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PatientCheckin() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Код не найден. Попросите на ресепшене показать QR-код ещё раз.");
      return;
    }
    if (!getAccessToken()) {
      setStatus("error");
      setMessage("Войдите в личный кабинет пациента, затем отсканируйте код снова.");
      return;
    }
    api.post("/subscriptions/checkin/", { token })
      .then(() => {
        setStatus("success");
        setMessage("Вы отмечены как прибывший. Сотрудник подтвердит ваше посещение на занятии.");
      })
      .catch(e => {
        setStatus("error");
        setMessage(e?.response?.data?.error || "Не удалось зарегистрировать приход. Обратитесь к администратору.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Регистрируем приход...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-lg font-bold mb-2" style={{ color: "#1e263e" }}>Готово!</h1>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <Link href="/patient/subscriptions" className="text-sm font-semibold text-blue-600">
              Мои абонементы
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg font-bold mb-2" style={{ color: "#1e263e" }}>Не получилось</h1>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            {!getAccessToken() && (
              <Link href="/login" className="text-sm font-semibold text-blue-600">Войти</Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
