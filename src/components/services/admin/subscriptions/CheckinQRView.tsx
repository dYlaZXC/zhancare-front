"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/utils/api";
import { RefreshCw } from "lucide-react";

export default function CheckinQRView() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/subscriptions/checkin/qr/");
      const target = `${window.location.origin}/checkin?token=${encodeURIComponent(data.token)}`;
      setUrl(target);
      setSecondsLeft(data.expires_in);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось получить QR-код");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 50_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>QR Check-in</h1>
        <p className="text-gray-600">Отображайте этот код на экране на ресепшене — пациенты сканируют камерой телефона</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-4 max-w-md">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : url ? (
          <>
            <QRCodeSVG value={url} size={240} />
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Обновится через {secondsLeft}с
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">Загрузка...</p>
        )}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 max-w-md text-xs text-gray-500">
        Сканирование отмечает приход пациента. Списание занятия с абонемента всё равно
        происходит только после подтверждения присутствия сотрудником или инструктором
        в карточке занятия.
      </div>
    </div>
  );
}
