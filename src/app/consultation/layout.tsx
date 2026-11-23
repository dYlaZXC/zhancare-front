import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Консультация",
  robots: { index: false, follow: false },
};

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
