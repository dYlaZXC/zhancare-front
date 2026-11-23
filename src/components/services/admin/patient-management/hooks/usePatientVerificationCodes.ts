"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/api";

// Shared by every "create a new patient inline" admin form (AddEventModal,
// AssignConsultationModal, AssignDiagnosticsModal, PatientFormModal) — all
// of them used to collect/generate a password for the admin to relay to the
// patient. PatientsViewSet.create (common/views/admin.py) no longer accepts
// one: it now requires the exact same phone-verified (+ optional
// email-verified) gate self-registration uses, via these four actions.
export type VerificationStatus = "unset" | "sending" | "sent" | "verifying" | "verified" | "skipped";

export function usePhoneVerification(phone: string) {
  const [status, setStatus] = useState<VerificationStatus>("unset");
  const [otpError, setOtpError] = useState<string | null>(null);

  const send = async () => {
    setStatus("sending");
    try {
      await api.post("/patients/send-create-phone-code/", { phone });
      setOtpError(null);
      setStatus("sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось отправить код");
      setStatus("unset");
    }
  };

  const verify = async (code: string) => {
    setStatus("verifying");
    setOtpError(null);
    try {
      await api.post("/patients/verify-create-phone-code/", { phone, code });
      setStatus("verified");
    } catch (err: any) {
      setOtpError(err?.response?.data?.error || "Неверный код. Попробуйте снова.");
      setStatus("sent");
    }
  };

  const resend = async (): Promise<boolean> => {
    try {
      await api.post("/patients/send-create-phone-code/", { phone });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось отправить код");
      return false;
    }
  };

  const reset = () => {
    setStatus("unset");
    setOtpError(null);
  };

  return { status, otpError, send, verify, resend, reset, changePhone: reset };
}

export function useEmailVerification(email: string) {
  const [status, setStatus] = useState<VerificationStatus>("unset");
  const [otpError, setOtpError] = useState<string | null>(null);

  const send = async () => {
    setStatus("sending");
    try {
      await api.post("/patients/send-create-email-code/", { email });
      setOtpError(null);
      setStatus("sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось отправить код");
      setStatus("unset");
    }
  };

  const verify = async (code: string) => {
    setStatus("verifying");
    setOtpError(null);
    try {
      await api.post("/patients/verify-create-email-code/", { email, code });
      setStatus("verified");
    } catch (err: any) {
      setOtpError(err?.response?.data?.error || "Неверный код. Попробуйте снова.");
      setStatus("sent");
    }
  };

  const resend = async (): Promise<boolean> => {
    try {
      await api.post("/patients/send-create-email-code/", { email });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось отправить код");
      return false;
    }
  };

  const skip = () => {
    setStatus("skipped");
    setOtpError(null);
  };

  const reset = () => {
    setStatus("unset");
    setOtpError(null);
  };

  return { status, otpError, send, verify, resend, skip, reset, changeEmail: reset };
}
