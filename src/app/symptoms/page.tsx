import type { Metadata } from "next";
import Link from "next/link";
import { symptoms } from "@/data/symptoms";
import { specialists } from "@/data/specialists";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FAQJsonLd } from "@/components/seo/FAQJsonLd";
import { MedicalDisclaimer } from "@/components/seo/MedicalDisclaimer";
import { AiTriageWidget } from "@/components/seo/AiTriageWidget";

export const metadata: Metadata = {
  title: "Симптомы — к какому врачу обратиться | ZhanCare.AI",
  description:
    "Выберите симптом, узнайте возможные причины и пройдите AI-триаж ZhanCare.AI, чтобы подобрать подходящего врача онлайн.",
  alternates: { canonical: "https://zhan.care/symptoms" },
  openGraph: {
    title: "Симптомы — к какому врачу обратиться | ZhanCare.AI",
    description: "Выберите симптом, узнайте возможные причины и пройдите AI-триаж, чтобы подобрать нужного врача.",
    url: "https://zhan.care/symptoms",
    images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: "Симптомы и врачи — ZhanCare.AI" }],
  },
};

const URGENT_SYMPTOMS = [
  "Боль в груди с отдачей в руку или челюсть",
  "Потеря сознания или предобморочное состояние",
  "Внезапная сильная головная боль",
  "Затруднённое дыхание или удушье",
  "Температура выше 39°C без снижения",
  "Сильная боль в животе с напряжением мышц",
];

const HUB_FAQS = [
  {
    question: "Как понять, к какому врачу обратиться при симптоме?",
    answer:
      "Выберите симптом из списка — на каждой странице есть раздел «К какому врачу обратиться» с рекомендацией по специалисту. Для точного подбора пройдите бесплатный AI-триаж ZhanCare.AI.",
  },
  {
    question: "Что делать, если симптом срочный?",
    answer:
      "Если симптомы угрожают жизни (боль в груди, потеря сознания, затруднённое дыхание), немедленно звоните 103. При менее острых симптомах воспользуйтесь AI-триажем для быстрой оценки.",
  },
  {
    question: "Можно ли проконсультироваться онлайн?",
    answer:
      "Да. После AI-триажа ZhanCare.AI вы можете записаться к нужному специалисту на онлайн-консультацию без очереди.",
  },
  {
    question: "Насколько точен AI-триаж?",
    answer:
      "AI-триаж помогает оценить вероятные причины симптомов и определить нужного специалиста, но не заменяет диагноз врача. Результат триажа — ориентировочная рекомендация.",
  },
];

const SYMPTOM_ICONS: Record<string, string> = {
  "bol-v-grudi":        "🫀",
  "golovnaya-bol":      "🧠",
  "temperatura":        "🌡️",
  "bol-v-zhivote":      "🫁",
  "povyshennoe-davlenie": "💊",
};

const SPECIALIST_ICONS: Record<string, string> = {
  terapevt:  "🩺",
  kardiolog: "🫀",
  pediatr:   "👶",
  nevrolog:  "🧠",
  ginekolog: "🌸",
};

export default function SymptomsHubPage() {
  const symptomEntries = Object.entries(symptoms);
  const specialistEntries = Object.entries(specialists);

  return (
    <>
      <FAQJsonLd faqs={HUB_FAQS} />
      <BreadcrumbJsonLd
        items={[
          { name: "Главная", url: "https://zhan.care/" },
          { name: "Симптомы", url: "https://zhan.care/symptoms" },
        ]}
      />

      <div className="min-h-screen bg-white">

        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0e121d] via-[#1e263e] to-[#0e121d] text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-white/40 mb-6">
              <Link href="/" className="hover:text-white/70 transition-colors">Главная</Link>
              <span className="mx-2">/</span>
              <span className="text-white/60">Симптомы</span>
            </nav>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-5 border px-3 py-1.5 rounded-full"
              style={{ color: "#3772ff", borderColor: "rgba(55,114,255,0.3)", background: "rgba(55,114,255,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3772ff] animate-pulse" />
              AI-триаж · Онлайн-запись
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Симптомы —{" "}
              <span className="text-[#3772ff]">к какому врачу</span>{" "}
              обратиться
            </h1>
            <p className="text-white/50 text-lg max-w-2xl leading-relaxed">
              Выберите симптом, узнайте возможные причины и пройдите бесплатный AI-триаж,
              чтобы найти нужного специалиста и записаться онлайн.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Urgent warning */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 mb-12">
            <h2 className="text-base font-bold text-red-700 mb-3 flex items-center gap-2">
              🚨 Когда нужна скорая помощь — звоните 103
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {URGENT_SYMPTOMS.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-red-600">
                  <span className="mt-0.5 shrink-0 text-red-400">▸</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Symptom cards */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Популярные симптомы</h2>
            <p className="text-gray-500 text-sm mb-7">
              Нажмите на симптом, чтобы узнать причины, к какому врачу идти и как действовать.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {symptomEntries.map(([slug, page]) => (
                <Link
                  key={slug}
                  href={`/symptoms/${slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all duration-200"
                >
                  <span className="text-2xl shrink-0">{SYMPTOM_ICONS[slug] ?? "🩺"}</span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-[#3772ff] transition-colors text-sm leading-snug mb-1">
                      {page.h1}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-2">{page.intro}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* AI triage CTA */}
          <section className="mb-14 rounded-2xl bg-gradient-to-br from-[#0e121d] to-[#1e263e] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#3772ff] mb-3">Бесплатно · за 2 минуты</p>
            <h2 className="text-2xl font-bold mb-3">Не знаете, к какому врачу идти?</h2>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Опишите симптомы — AI-ассистент ZhanCare поможет определить возможную причину
              и порекомендует нужного специалиста.
            </p>
            <AiTriageWidget />
          </section>

          {/* Related specialists */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Специалисты онлайн</h2>
            <p className="text-gray-500 text-sm mb-7">
              Узнайте, что лечит каждый специалист и когда к нему обращаться.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {specialistEntries.map(([slug, page]) => (
                <Link
                  key={slug}
                  href={`/specialists/${slug}`}
                  className="group flex flex-col items-center text-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all duration-200"
                >
                  <span className="text-2xl mb-2">{SPECIALIST_ICONS[slug] ?? "👨‍⚕️"}</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#3772ff] transition-colors leading-snug">
                    {page.h1.split(":")[0]}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/specialists" className="text-sm text-[#3772ff] hover:underline">
                Все специалисты →
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
            <div className="space-y-4">
              {HUB_FAQS.map((faq) => (
                <details key={faq.question} className="group rounded-xl border border-gray-100 bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-gray-800 text-sm list-none">
                    {faq.question}
                    <span className="ml-4 shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200">▾</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <MedicalDisclaimer />
        </div>
      </div>
    </>
  );
}
