import type { Metadata } from "next";
import Link from "next/link";
import { specialists } from "@/data/specialists";
import { symptoms } from "@/data/symptoms";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FAQJsonLd } from "@/components/seo/FAQJsonLd";
import { MedicalDisclaimer } from "@/components/seo/MedicalDisclaimer";
import { AiTriageWidget } from "@/components/seo/AiTriageWidget";

export const metadata: Metadata = {
  title: "Врачи и специалисты онлайн | ZhanCare.AI",
  description:
    "Найдите терапевта, кардиолога, педиатра, невролога или другого специалиста через AI-триаж и онлайн-запись ZhanCare.AI.",
  alternates: { canonical: "https://zhan.care/specialists" },
  openGraph: {
    title: "Врачи и специалисты онлайн | ZhanCare.AI",
    description: "Найдите нужного специалиста через AI-триаж и запишитесь на онлайн-консультацию.",
    url: "https://zhan.care/specialists",
    images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: "Врачи и специалисты — ZhanCare.AI" }],
  },
};

const HUB_FAQS = [
  {
    question: "Как выбрать нужного специалиста?",
    answer:
      "Пройдите бесплатный AI-триаж ZhanCare.AI — опишите симптомы, и ассистент порекомендует подходящего специалиста. Или выберите врача напрямую из списка, если уже знаете нужную специальность.",
  },
  {
    question: "Можно ли записаться к врачу онлайн?",
    answer:
      "Да. После выбора специалиста вы можете записаться на онлайн-консультацию через ZhanCare.AI без ожидания в очереди.",
  },
  {
    question: "Чем отличается терапевт от узкого специалиста?",
    answer:
      "Терапевт — первое звено помощи: он обследует, назначает анализы и при необходимости направляет к узкому специалисту. К узкому специалисту (кардиолог, невролог, гинеколог) обращаются при конкретных жалобах по его профилю.",
  },
  {
    question: "Что делать, если не знаю, к какому врачу идти?",
    answer:
      "Начните с терапевта или пройдите AI-триаж ZhanCare.AI. AI-ассистент проанализирует симптомы и определит подходящую специальность.",
  },
];

const SPECIALIST_ICONS: Record<string, string> = {
  terapevt:  "🩺",
  kardiolog: "🫀",
  pediatr:   "👶",
  nevrolog:  "🧠",
  ginekolog: "🌸",
};

const SYMPTOM_ICONS: Record<string, string> = {
  "bol-v-grudi":          "🫀",
  "golovnaya-bol":        "🧠",
  "temperatura":          "🌡️",
  "bol-v-zhivote":        "🫁",
  "povyshennoe-davlenie": "💊",
};

const HOW_TO_CHOOSE = [
  { icon: "🔍", title: "Определите симптом", text: "Начните с описания жалоб — боль, температура, слабость, давление." },
  { icon: "🤖", title: "Пройдите AI-триаж",  text: "AI-ассистент подберёт специальность и оценит срочность обращения." },
  { icon: "📅", title: "Запишитесь онлайн",  text: "Выберите удобное время и проведите консультацию без очереди." },
];

export default function SpecialistsHubPage() {
  const specialistEntries = Object.entries(specialists);
  const symptomEntries = Object.entries(symptoms);

  return (
    <>
      <FAQJsonLd faqs={HUB_FAQS} />
      <BreadcrumbJsonLd
        items={[
          { name: "Главная", url: "https://zhan.care/" },
          { name: "Специалисты", url: "https://zhan.care/specialists" },
        ]}
      />

      <div className="min-h-screen bg-white">

        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0e121d] via-[#1e263e] to-[#0e121d] text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-white/40 mb-6">
              <Link href="/" className="hover:text-white/70 transition-colors">Главная</Link>
              <span className="mx-2">/</span>
              <span className="text-white/60">Специалисты</span>
            </nav>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-5 border px-3 py-1.5 rounded-full"
              style={{ color: "#3772ff", borderColor: "rgba(55,114,255,0.3)", background: "rgba(55,114,255,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3772ff] animate-pulse" />
              Онлайн-консультация · AI-подбор
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Врачи и специалисты{" "}
              <span className="text-[#3772ff]">онлайн</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl leading-relaxed">
              ZhanCare.AI помогает подобрать нужного врача по симптомам и записаться
              на онлайн-консультацию или приём в клинике.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* How to choose */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-7">Как выбрать врача</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {HOW_TO_CHOOSE.map((step, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <p className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Specialist cards */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Все специалисты</h2>
            <p className="text-gray-500 text-sm mb-7">
              Выберите специальность, чтобы узнать, что лечит врач, когда к нему обращаться и как записаться.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {specialistEntries.map(([slug, page]) => (
                <Link
                  key={slug}
                  href={`/specialists/${slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all duration-200"
                >
                  <span className="text-2xl shrink-0 mt-0.5">{SPECIALIST_ICONS[slug] ?? "👨‍⚕️"}</span>
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
            <h2 className="text-2xl font-bold mb-3">Подобрать специалиста через AI</h2>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Не знаете, какой врач нужен? Опишите симптомы — AI-ассистент определит
              подходящую специальность и запишет вас онлайн.
            </p>
            <AiTriageWidget />
          </section>

          {/* Related symptoms */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Симптомы и жалобы</h2>
            <p className="text-gray-500 text-sm mb-7">
              Не знаете специальность — начните с симптома.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {symptomEntries.map(([slug, page]) => (
                <Link
                  key={slug}
                  href={`/symptoms/${slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all duration-200"
                >
                  <span className="text-lg shrink-0">{SYMPTOM_ICONS[slug] ?? "🩺"}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#3772ff] transition-colors">
                    {page.h1.split(":")[0]}
                  </span>
                  <span className="ml-auto text-gray-300 group-hover:text-[#3772ff] transition-colors text-xs">→</span>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/symptoms" className="text-sm text-[#3772ff] hover:underline">
                Все симптомы →
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
