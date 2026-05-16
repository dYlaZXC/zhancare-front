"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { StaticImageData } from "next/image";
import LogoKZ from "@/assets/logosaas.png";
import LogoUZ from "@/assets/JanCareAi_uz_logo.png";
import { BRAND_STYLES } from "@/config/brandConfig";
import type { BrandId, BrandStyle } from "@/config/brandConfig";

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
}

const BrandContext = createContext<BrandContextValue>({
  brand: BRANDS.kz,
  appLogo: LogoKZ,
  clinicCurrency: "KZT",
  setClinicCurrency: () => {},
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
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname.startsWith("uz.")) {
      setBrandId("uz");
    }
  }, []);

  const brand = BRANDS[brandId];

  return (
    <BrandContext.Provider value={{ brand, appLogo: brand.logo, clinicCurrency, setClinicCurrency }}>
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
