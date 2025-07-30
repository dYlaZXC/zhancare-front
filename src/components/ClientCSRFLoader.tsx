"use client";

import { useEffect } from "react";
import { api } from "@/utils/api"; // or "@/utils/axiosInstance"

export function ClientCSRFLoader() {
  useEffect(() => {
    // ✅ Uses axiosInstance with proper baseURL and credentials
    api.get("/csrf/")
      .then(() => {
        console.debug("✅ CSRF cookie set");
      })
      .catch((err) => {
        console.warn("❌ Failed to set CSRF cookie", err);
      });
  }, []);

  return null;
}
