export type BrandId = "kz" | "uz";

export interface BrandStyle {
  id: BrandId;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  sidebarGradient: string;
  sidebarGlow: string;
  accentRgba: string;
  currency: string;
}

export const BRAND_STYLES: Record<BrandId, BrandStyle> = {
  kz: {
    id: "kz",
    name: "ZhanCare.AI",
    tagline: "Будущее телемедицины",
    primary: "#3772ff",
    secondary: "#29358f",
    sidebarGradient: "linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)",
    sidebarGlow: "rgba(55,114,255,0.2)",
    accentRgba: "rgba(55,114,255,",
    currency: "KZT",
  },
  uz: {
    id: "uz",
    name: "JanCare.Ai",
    tagline: "HAR JOYDA",
    primary: "#8b5cf6",
    secondary: "#6d28d9",
    sidebarGradient: "linear-gradient(135deg, #0f0a1e 0%, #1a1030 25%, #4c1d95 75%, #7c3aed 100%)",
    sidebarGlow: "rgba(139,92,246,0.25)",
    accentRgba: "rgba(139,92,246,",
    currency: "UZS",
  },
};
