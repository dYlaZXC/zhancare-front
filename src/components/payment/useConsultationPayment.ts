"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { loadTipTopPayScript, openTipTopPayWidget } from "@/lib/tiptoppay";
import { useAuth } from "@/context/AuthContext";

export type PaymentType = "online" | "offline" | "diagnostics" | "home";

export interface ConsultationPaymentOptions {
  paymentType: PaymentType;
  amount: number;
  description: string;
  bookingData: Record<string, unknown>;
}

export interface PaymentResult {
  paymentId: string;
  resultId: string;
  status: "paid";
  /** True when nothing was charged online because the doctor is configured
   * "pay at clinic" (as opposed to the consultation genuinely being free). */
  payAtClinic?: boolean;
}

export function useConsultationPayment() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(opts: ConsultationPaymentOptions): Promise<PaymentResult> {
    setLoading(true);
    setError(null);

    try {
      // Pre-load widget script in background (non-blocking for UX)
      loadTipTopPayScript().catch(() => {});

      // 1. Create pending payment record on backend
      const checkoutRes = await api.post(
        "/payments/consultation/checkout/",
        {
          payment_type: opts.paymentType,
          amount: opts.amount,
          description: opts.description,
          booking_data: opts.bookingData,
        },
        { headers: token ? { Authorization: `Token ${token}` } : {} }
      );

      const { free, pay_at_clinic: payAtClinic, payment_id: paymentId, result_id: freeResultId } = checkoutRes.data;

      // Free consultation (doctor price = 0), OR a "pay at clinic" doctor
      // (real price > 0, just not collected online) — either way nothing
      // to charge right now, so the payment widget is skipped entirely.
      if (free) {
        return { paymentId, resultId: freeResultId ?? "", status: "paid", payAtClinic: Boolean(payAtClinic) };
      }

      const { amount, currency, description, public_terminal_id: publicTerminalId, email } = checkoutRes.data;

      // 2. Open TipTop Pay widget
      await openTipTopPayWidget(publicTerminalId, {
        description,
        amount,
        currency: currency ?? "KZT",
        externalId: paymentId,  // TipTop maps externalId → InvoiceId in webhooks (renamed from invoiceId)
        userInfo: {
          accountId: String(user?.id ?? ""),
          email: email ?? "",
        },
      });

      // 3. Poll backend until payment confirmed by webhook (max 45s)
      const result = await pollPaymentStatus(paymentId, token);
      return result;
    } catch (err: any) {
      const msg = err?.message ?? "Ошибка при оплате";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { pay, loading, error };
}

async function pollPaymentStatus(
  paymentId: string,
  token: string | null,
  maxAttempts = 30,
  intervalMs = 1500
): Promise<PaymentResult> {
  const headers = token ? { Authorization: `Token ${token}` } : {};

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await api.get(`/payments/consultation/status/${paymentId}/`, { headers });
    const data = res.data;
    if (data.status === "paid") {
      return { paymentId, resultId: data.result_id ?? "", status: "paid" };
    }
    if (data.status === "failed" || data.status === "cancelled") {
      throw new Error("Платёж не прошёл. Попробуйте ещё раз.");
    }
  }
  throw new Error("Время ожидания подтверждения истекло. Проверьте историю транзакций.");
}
