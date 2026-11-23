"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { StaticImageData } from "next/image";
import LogoKZ from "@/assets/logosaas.png";
import LogoUZ from "@/assets/logosaas_uz.png";
import { BRAND_STYLES } from "@/config/brandConfig";
import type { BrandId, BrandStyle } from "@/config/brandConfig";
import { useLanguage } from "@/context/LanguageContext";

export type { BrandId };

export interface BrandConfig extends BrandStyle {
  logo: StaticImageData;
}

const BRANDS: Record<BrandId, BrandConfig> = {
  kz: { ...BRAND_STYLES.kz, logo: LogoKZ },
  uz: { ...BRAND_STYLES.uz, logo: LogoUZ },
};

interface BrandContextValue {
  brand: BrandConfig;
  appLogo: StaticImageData;
  clinicCurrency: string;
  setClinicCurrency: (c: string) => void;
  // IANA name or fixed UTC offset (e.g. "Asia/Almaty", "+05:00") — the
  // clinic's own timezone, never the browser's. Schedule/slot code must use
  // this (not new Date()) for any "is this today" / "is this slot already
  // past" check, or an admin whose device clock is in a different zone sees
  // a skewed slot list and can end up booking an already-past time.
  clinicTimezone: string;
}

const BrandContext = createContext<BrandContextValue>({
  brand: BRANDS.kz,
  appLogo: LogoKZ,
  clinicCurrency: "KZT",
  setClinicCurrency: () => {},
  clinicTimezone: "Asia/Almaty",
});

interface BrandProviderProps {
  children: React.ReactNode;
  initialBrand?: BrandId;
}

export function BrandProvider({ children, initialBrand = "kz" }: BrandProviderProps) {
  const [brandId, setBrandId] = useState<BrandId>(initialBrand);
  const [clinicCurrency, setClinicCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clinicCurrency") || BRAND_STYLES[initialBrand].currency;
    }
    return BRAND_STYLES[initialBrand].currency;
  });

  const setClinicCurrency = (c: string) => {
    setClinicCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("clinicCurrency", c);
    }
  };

  const [clinicTimezone, setClinicTimezone] = useState<string>("Asia/Almaty");

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
    fetch(`${base}/clinic-stats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const cur = data?.clinic_info?.currency;
        if (cur) setClinicCurrency(cur);
        const tz = data?.clinic_info?.time_zone;
        if (tz) setClinicTimezone(tz);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname.startsWith("uz.")) {
      setBrandId("uz");
    }
  }, []);

  const { language } = useLanguage();
  const brand = BRANDS[brandId];
  const appLogo = language === "uz" ? LogoUZ : brand.logo;

  return (
    <BrandContext.Provider value={{ brand, appLogo, clinicCurrency, setClinicCurrency, clinicTimezone }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

export function useClinicCurrency() {
  return useContext(BrandContext);
}
