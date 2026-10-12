/**
 * Display-only mirror of payments/services.py's resolve_consultation_payment_plan.
 * The backend (ConsultationCheckoutView) is always the enforced source of
 * truth for what's actually charged — this only decides what the booking
 * screen shows the patient BEFORE they commit, so it must not drift from a
 * doctor's actual preference, but a mismatch here can never over/undercharge
 * anyone (see useConsultationPayment.pay, which reads the real amount back
 * out of the checkout response, never from what the frontend computed/sent).
 */

export type PaymentPreference = "pay_at_clinic" | "full_prepay" | "partial_prepay" | null | undefined;

export interface ConsultationPriceInfo {
  online_consultation_price?: string | number | null;
  offline_consultation_price?: string | number | null;
  online_payment_preference?: PaymentPreference;
  offline_payment_preference?: PaymentPreference;
  online_prepay_percent?: number | null;
  offline_prepay_percent?: number | null;
}

export interface ConsultationAmountPlan {
  /** Full real price of the consultation (0 = genuinely free). */
  fullPrice: number;
  /** What to actually charge online right now — 0 means skip the payment widget. */
  amount: number;
  /** Real price > 0 but nothing charged online (pay at the clinic instead). */
  payAtClinic: boolean;
}

export function resolveConsultationDisplayAmount(
  doctor: ConsultationPriceInfo | null | undefined,
  consultationType: "online" | "offline"
): ConsultationAmountPlan {
  if (!doctor) return { fullPrice: 0, amount: 0, payAtClinic: false };

  const rawPrice = consultationType === "online" ? doctor.online_consultation_price : doctor.offline_consultation_price;
  const preference = consultationType === "online" ? doctor.online_payment_preference : doctor.offline_payment_preference;
  const prepayPercent = consultationType === "online" ? doctor.online_prepay_percent : doctor.offline_prepay_percent;

  const fullPrice = rawPrice !== null && rawPrice !== undefined ? Math.round(Number(rawPrice)) : 0;
  if (fullPrice <= 0) return { fullPrice: 0, amount: 0, payAtClinic: false };

  if (preference === "pay_at_clinic") {
    return { fullPrice, amount: 0, payAtClinic: true };
  }

  if (preference === "partial_prepay") {
    const percent = prepayPercent && prepayPercent > 0 && prepayPercent < 100 ? prepayPercent : 50;
    const deposit = Math.round((fullPrice * percent) / 100);
    if (deposit > 0 && deposit < fullPrice) {
      return { fullPrice, amount: deposit, payAtClinic: false };
    }
    return { fullPrice, amount: 0, payAtClinic: true };
  }

  // 'full_prepay' and any unrecognized value — today's only existing behavior
  return { fullPrice, amount: fullPrice, payAtClinic: false };
}
