"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { WarehouseConsumptionAttempt } from "../types";

export default function FailedAttemptsSection() {
  const [attempts, setAttempts] = useState<WarehouseConsumptionAttempt[]>([]);
  // Separate from `refreshing` on purpose: this section should stay fully
  // invisible until the FIRST fetch confirms there's actually something to
  // flag (not just "still checking") — otherwise the red header+spinner
  // flashes on every page load, even for a clinic with zero failures, and
  // then vanishes once the empty result comes back. A later refetch (after
  // clicking "Повторить") reuses `refreshing` instead, so the already-
  // visible list doesn't unmount/flash a second time.
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const fetchFailed = useCallback(async () => {
    setRefreshing(true);
    try {
      const [insufficient, errored] = await Promise.all([
        api.get("/warehouse/consumption-attempts/?status=failed_insufficient_stock"),
        api.get("/warehouse/consumption-attempts/?status=failed_error"),
      ]);
      const toList = (d: any) => (Array.isArray(d) ? d : d.results || []);
      setAttempts([...toList(insufficient.data), ...toList(errored.data)]);
    } catch {
      // Non-critical section — fail quietly rather than blocking the page.
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { fetchFailed(); }, [fetchFailed]);

  const handleRetry = async (id: number) => {
    setRetryingId(id);
    try {
      const res = await api.post(`/warehouse/consumption-attempts/${id}/retry/`);
      if (res.data?.status === "completed") {
        toast.success("Списание выполнено");
        setAttempts((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.warning("Остатка всё ещё недостаточно");
        fetchFailed();
      }
    } catch {
      toast.error("Ошибка при повторной попытке");
    } finally {
      setRetryingId(null);
    }
  };

  if (initialLoading || attempts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-red-100 bg-red-50/60 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-bold text-red-700">Неудавшиеся списания</h3>
        {refreshing && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400 ml-auto" />}
      </div>
      <div className="divide-y divide-gray-50">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{attempt.appointment_label || `Попытка #${attempt.id}`}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {attempt.status === "failed_insufficient_stock"
                  ? "Недостаточно остатка"
                  : (attempt.last_error || "Ошибка обработки")}
                {" · попыток: "}{attempt.attempt_count}
              </p>
            </div>
            <button
              onClick={() => handleRetry(attempt.id)}
              disabled={retryingId === attempt.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-60 flex-shrink-0"
            >
              {retryingId === attempt.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Повторить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
