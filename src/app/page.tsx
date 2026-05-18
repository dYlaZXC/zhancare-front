import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "ZhanCare.AI — Будущее телемедицины",
  description:
    "ZhanCare.AI — платформа для дистанционных медицинских консультаций с ИИ-ассистентом. Онлайн-консультации врачей, вызов медсестры на дом, умный анализ симптомов. Здоровье в один клик.",
  alternates: {
    canonical: "https://zhan.care",
    languages: {
      "ru-KZ": "https://zhan.care",
      "uz-UZ": "https://uz.zhan.care",
    },
  },
  openGraph: {
    title: "ZhanCare.AI — ИИ-врач, онлайн-консультации в Казахстане",
    description:
      "Онлайн-консультации с врачами, ИИ-анализ симптомов и вызов медсестры на дом. Запишитесь за минуту — первый ответ за 10 секунд. Попробуйте бесплатно.",
    url: "https://zhan.care",
    images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630 }],
  },
};

export default function Home() {
  return <HomeClient />;
}
