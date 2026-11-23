import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Medical Game",
  description:
    "Интерактивная медицинская игра с ИИ от ZhanCare.AI. Проверь свои знания о здоровье и медицине в игровом формате.",
  alternates: { canonical: "https://zhan.care/aigame" },
  openGraph: {
    title: "AI Medical Game — ZhanCare.AI",
    description: "Интерактивная медицинская игра с ИИ. Проверь свои знания о здоровье.",
    url: "https://zhan.care/aigame",
    images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630 }],
  },
};

export default function AigameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
