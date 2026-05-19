import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cities, ACTIVE_CITIES } from "@/data/cities";
import { symptoms } from "@/data/symptoms";
import { specialists } from "@/data/specialists";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FAQJsonLd } from "@/components/seo/FAQJsonLd";
import { MedicalDisclaimer } from "@/components/seo/MedicalDisclaimer";
import { AiTriageWidget } from "@/components/seo/AiTriageWidget";

interface Props { params: Promise<{ city: string }> }

export function generateStaticParams() {
  return ACTIVE_CITIES.map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = cities[citySlug];
  if (!city) return {};

  return {
    title: `Врач онлайн ${city.nameIn} — AI-триаж и запись | ZhanCare.AI`,
    description: `Пройдите AI-анализ симптомов, выберите подходящего врача и запишитесь на онлайн-консультацию или приём ${city.nameIn} через ZhanCare.AI.`,
    alternates: { canonical: `https://zhan.care/${citySlug}` },
    openGraph: {
      title: `Врач онлайн ${city.nameIn} | ZhanCare.AI`,
      description: `AI-триаж симптомов и онлайн-запись к врачу ${city.nameIn}.`,
      url: `https://zhan.care/${citySlug}`,
      images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: `Врач онлайн ${city.nameIn} — ZhanCare.AI` }],
    },
  };
}

const SYMPTOM_ICONS: Record<string, string> = {
  "bol-v-grudi": "🫀", "golovnaya-bol": "🧠",
  "temperatura": "🌡️", "bol-v-zhivote": "🫁",
  "povyshennoe-davlenie": "💊",
};
const SPECIALIST_ICONS: Record<string, string> = {
  terapevt: "🩺", kardiolog: "🫀", pediatr: "👶", nevrolog: "🧠", ginekolog: "🌸",
};

const CITY_FAQS = (cityName: string, nameIn: string) => [
  {
    question: `Можно ли записаться к врачу ${nameIn} онлайн?`,
    answer: `Да. ZhanCare.AI позволяет пройти AI-триаж и записаться к специалисту ${nameIn} на онлайн-консультацию без очереди, или на приём в клинике.`,
  },
  {
    question: `К какому врачу обратиться при симптомах ${nameIn}?`,
    answer: `Пройдите AI-триаж на ZhanCare.AI — опишите симптомы, и ассистент определит нужную специальность. Если симптомы неясны, начните с терапевта.`,
  },
  {
    question: `Как работает AI-триаж ZhanCare.AI?`,
    answer: `AI-ассистент задаёт уточняющие вопросы о симптомах, оценивает срочность и рекомендует специальность врача. Это не диагноз, а ориентировочная помощь в выборе специалиста.`,
  },
];

export default async function CityHubPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = cities[citySlug];
  if (!city) notFound();

  const symptomEntries = Object.entries(symptoms);
  const specialistEntries = Object.entries(specialists);
  const faqs = CITY_FAQS(city.name, city.nameIn);

  return (
    <>
      <FAQJsonLd faqs={faqs} />
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://zhan.care/" },
        { name: city.name, url: `https://zhan.care/${citySlug}` },
      ]} />

      <div className="min-h-screen bg-white">

        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0e121d] via-[#1e263e] to-[#0e121d] text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-white/40 mb-6">
              <Link href="/" className="hover:text-white/70 transition-colors">Главная</Link>
              <span className="mx-2">/</span>
              <span className="text-white/60">{city.name}</span>
            </nav>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-5 border px-3 py-1.5 rounded-full"
              style={{ color: "#3772ff", borderColor: "rgba(55,114,255,0.3)", background: "rgba(55,114,255,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3772ff] animate-pulse" />
              {city.name} · Онлайн и офлайн
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Врач онлайн{" "}
              <span className="text-[#3772ff]">{city.nameIn}</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl leading-relaxed mb-8">
              {city.description} Пройдите AI-триаж, подберите нужного специалиста и запишитесь онлайн без очереди.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm">
              {[
                { label: "Клиник", value: city.clinicsCount },
                { label: "Население", value: city.population },
                { label: "Запись", value: "Онлайн" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="text-xs text-white/40">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* AI triage */}
          <section className="mb-14 rounded-2xl bg-gradient-to-br from-[#0e121d] to-[#1e263e] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#3772ff] mb-3">
              Бесплатно · {city.nameIn}
            </p>
            <h2 className="text-2xl font-bold mb-3">Подобрать врача через AI</h2>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Опишите симптомы — AI-ассистент поможет выбрать специалиста и записаться
              на консультацию {city.nameIn}.
            </p>
            <AiTriageWidget />
          </section>

          {/* Specialists in city */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Специалисты {city.nameIn}
            </h2>
            <p className="text-gray-500 text-sm mb-7">
              Выберите специальность — узнайте, что лечит врач и когда к нему обращаться.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specialistEntries.map(([slug, page]) => (
                <Link key={slug} href={`/${citySlug}/specialists/${slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all duration-200">
                  <span className="text-2xl shrink-0">{SPECIALIST_ICONS[slug] ?? "👨‍⚕️"}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-[#3772ff] transition-colors">
                      {page.h1.split(":")[0]} {city.nameIn}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Онлайн-запись</p>
                  </div>
                  <span className="ml-auto text-gray-300 group-hover:text-[#3772ff] text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Symptoms in city */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Симптомы — к какому врачу {city.nameIn}
            </h2>
            <p className="text-gray-500 text-sm mb-7">
              Выберите симптом, чтобы узнать причины и получить рекомендацию по специалисту.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {symptomEntries.map(([slug, page]) => (
                <Link key={slug} href={`/${citySlug}/symptoms/${slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all duration-200">
                  <span className="text-2xl shrink-0">{SYMPTOM_ICONS[slug] ?? "🩺"}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-[#3772ff] transition-colors">
                      {page.h1.split(":")[0]} {city.nameIn}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">AI-триаж · Запись онлайн</p>
                  </div>
                  <span className="ml-auto text-gray-300 group-hover:text-[#3772ff] text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-xl border border-gray-100 bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-gray-800 text-sm list-none">
                    {faq.question}
                    <span className="ml-4 shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200">▾</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mb-14 p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <h2 className="text-base font-bold text-gray-700 mb-4">Смотрите также</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/symptoms", label: "Все симптомы" },
                { href: "/specialists", label: "Все специалисты" },
                ...specialistEntries.map(([slug, p]) => ({ href: `/specialists/${slug}`, label: p.h1.split(":")[0] })),
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="text-xs text-[#3772ff] border border-[#3772ff]/20 bg-white rounded-full px-3 py-1 hover:bg-[#3772ff]/5 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </section>

          <MedicalDisclaimer />
        </div>
      </div>
    </>
  );
}
