"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { StaticImageData } from "next/image";
import LogoKZ from "@/assets/logosaas.png";
import LogoUZ from "@/assets/JanCareAi_uz_logo.png";

interface ClinicCurrencyContextValue {
  clinicCurrency: string;
  setClinicCurrency: (c: string) => void;
  appLogo: StaticImageData;
}

const ClinicCurrencyContext = createContext<ClinicCurrencyContextValue>({
  clinicCurrency: "KZT",
  setClinicCurrency: () => {},
  appLogo: LogoKZ,
});

export function ClinicCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [clinicCurrency, setClinicCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clinicCurrency") || "KZT";
    }
    return "KZT";
  });

  const setClinicCurrency = (c: string) => {
    setClinicCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("clinicCurrency", c);
    }
  };

  useEffect(() => {
    // Try to sync from backend (only for logged-in admins/doctors)
    const token = typeof window !== "undefined"
      ? localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      : null;
    if (!token) return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
    fetch(`${base}/clinic-stats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const cur = data?.clinic_info?.currency;
        if (cur) setClinicCurrency(cur);
      })
      .catch(() => {});
  }, []);

  const appLogo = clinicCurrency === "UZS" ? LogoUZ : LogoKZ;

  return (
    <ClinicCurrencyContext.Provider value={{ clinicCurrency, setClinicCurrency, appLogo }}>
      {children}
    </ClinicCurrencyContext.Provider>
  );
}

export function useClinicCurrency() {
  return useContext(ClinicCurrencyContext);
}
