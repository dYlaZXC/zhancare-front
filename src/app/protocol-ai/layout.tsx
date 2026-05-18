import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protocol AI — Клинические протоколы",
  description:
    "ИИ-поиск по клиническим протоколам Казахстана. Мгновенный доступ к стандартам лечения и диагностики от ZhanCare.AI.",
  alternates: { canonical: "https://zhan.care/protocol-ai" },
  openGraph: {
    title: "Protocol AI — Клинические протоколы | ZhanCare.AI",
    description: "ИИ-поиск по клиническим протоколам Казахстана. Стандарты лечения и диагностики.",
    url: "https://zhan.care/protocol-ai",
    images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630 }],
  },
};

export default function ProtocolAILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
