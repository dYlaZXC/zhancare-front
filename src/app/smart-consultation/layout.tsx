import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Умная консультация",
  robots: { index: false, follow: false },
};

export default function SmartConsultationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
