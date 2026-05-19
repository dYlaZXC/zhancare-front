import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Консультация врача онлайн за 5 минут | ZhanCare.AI",
  description:
    "AI-анализ симптомов, подбор врача и онлайн-консультация через ZhanCare.AI. Найдите нужного специалиста за несколько минут. Первый ответ — за секунды.",
  alternates: {
    canonical: "https://zhan.care/",
    languages: {
      "ru": "https://zhan.care/",
      "x-default": "https://zhan.care/",
    },
  },
  openGraph: {
    title: "ZhanCare.AI — ИИ-ассистент и онлайн-консультации в Казахстане",
    description:
      "Онлайн-консультации с врачами, ИИ-анализ симптомов и вызов медсестры на дом. Запишитесь за минуту — первый ответ за 10 секунд. Попробуйте бесплатно.",
    url: "https://zhan.care",
    images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: "ZhanCare.AI — ИИ-ассистент и онлайн-консультации в Казахстане" }],
  },
};

export default function Home() {
  return <HomeClient />;
}
