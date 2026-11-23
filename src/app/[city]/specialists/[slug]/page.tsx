import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cities, ACTIVE_CITIES } from "@/data/cities";
import { specialists } from "@/data/specialists";
import { symptoms } from "@/data/symptoms";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FAQJsonLd } from "@/components/seo/FAQJsonLd";
import { MedicalDisclaimer } from "@/components/seo/MedicalDisclaimer";
import { AiTriageWidget } from "@/components/seo/AiTriageWidget";

interface Props { params: Promise<{ city: string; slug: string }> }

export function generateStaticParams() {
  return ACTIVE_CITIES.flatMap((city) =>
    Object.keys(specialists).map((slug) => ({ city, slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = cities[citySlug];
  const page = specialists[slug];
  if (!city || !page) return {};

  const specialistName = page.h1.split(":")[0];
  const title = `${specialistName} ${city.nameIn} онлайн — AI-триаж и запись | ZhanCare.AI`;
  const description = `Подберите ${specialistName.toLowerCase()} ${city.nameIn} через AI-триаж ZhanCare.AI, узнайте когда нужна консультация и запишитесь к врачу онлайн.`;

  return {
    title,
    description,
    alternates: { canonical: `https://zhan.care/${citySlug}/specialists/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://zhan.care/${citySlug}/specialists/${slug}`,
      images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function CitySpecialistPage({ params }: Props) {
  const { city: citySlug, slug } = await params;
  const city = cities[citySlug];
  const page = specialists[slug];
  if (!city || !page) notFound();

  const specialistName = page.h1.split(":")[0];

  const relatedSymptomPages = page.relatedSymptoms
    .map((s) => ({ slug: s, data: symptoms[s] }))
    .filter((s) => s.data);

  return (
    <>
      <FAQJsonLd faqs={page.faqs} />
      <BreadcrumbJsonLd items={[
        { name: "Главная",          url: "https://zhan.care/" },
        { name: city.name,          url: `https://zhan.care/${citySlug}` },
        { name: "Специалисты",      url: `https://zhan.care/specialists` },
        { name: specialistName,     url: `https://zhan.care/${citySlug}/specialists/${slug}` },
      ]} />

      <div className="min-h-screen bg-white">

        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0e121d] via-[#1e263e] to-[#0e121d] text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="text-sm text-white/40 mb-6 flex flex-wrap gap-1 items-center">
              <Link href="/" className="hover:text-white/70">Главная</Link>
              <span>/</span>
              <Link href={`/${citySlug}`} className="hover:text-white/70">{city.name}</Link>
              <span>/</span>
              <Link href="/specialists" className="hover:text-white/70">Специалисты</Link>
              <span>/</span>
              <span className="text-white/60">{specialistName}</span>
            </nav>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-5 border px-3 py-1.5 rounded-full"
              style={{ color: "#3772ff", borderColor: "rgba(55,114,255,0.3)", background: "rgba(55,114,255,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3772ff] animate-pulse" />
              {city.name} · Онлайн-запись
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">
              {specialistName}{" "}
              <span className="text-[#3772ff]">{city.nameIn}</span>
              {" "}— онлайн-консультация
            </h1>
            <p className="text-white/50 leading-relaxed">{page.intro}</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10">

          {/* What they treat */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Что лечит {specialistName.toLowerCase()} {city.nameIn}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {page.whatTheyTreat.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 shrink-0 text-[#3772ff]">▸</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* When to see */}
          <section className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-base font-bold text-blue-800 mb-3">
              Когда обратиться к {specialistName.toLowerCase().replace(/^./, (c) => c.toLowerCase())}у {city.nameIn}
            </h2>
            <ul className="space-y-2">
              {page.whenToSee.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-blue-700">
                  <span className="mt-1 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* AI triage CTA */}
          <section className="mb-10 rounded-2xl bg-gradient-to-br from-[#0e121d] to-[#1e263e] p-7 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#3772ff] mb-2">
              Бесплатно · {city.name}
            </p>
            <h2 className="text-xl font-bold mb-2">
              Записаться к {specialistName.toLowerCase()} {city.nameIn}
            </h2>
            <p className="text-white/45 text-sm mb-5 max-w-md mx-auto">
              Пройдите AI-триаж — ассистент подтвердит, что вам нужен именно этот специалист,
              и поможет записаться онлайн.
            </p>
            <AiTriageWidget specialistSlug={slug} />
          </section>

          {/* Related symptoms */}
          {relatedSymptomPages.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Симптомы, с которыми обращаются к {specialistName.toLowerCase()}у
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedSymptomPages.map(({ slug: sSlug, data: sPage }) => (
                  <Link key={sSlug} href={`/${citySlug}/symptoms/${sSlug}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#3772ff]/30 transition-all">
                    <span className="text-xl">🩺</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 group-hover:text-[#3772ff] transition-colors">
                        {sPage!.h1.split(":")[0]} {city.nameIn}
                      </p>
                    </div>
                    <span className="ml-auto text-gray-300 group-hover:text-[#3772ff]">→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Частые вопросы</h2>
            <div className="space-y-3">
              {page.faqs.map((faq) => (
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
          <div className="flex flex-wrap gap-2 mb-10 p-5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-500 font-medium w-full mb-1">Смотрите также:</span>
            <Link href={`/specialists/${slug}`} className="text-xs text-[#3772ff] border border-[#3772ff]/20 bg-white rounded-full px-3 py-1 hover:bg-[#3772ff]/5">
              {specialistName} (все города)
            </Link>
            <Link href={`/${citySlug}`} className="text-xs text-[#3772ff] border border-[#3772ff]/20 bg-white rounded-full px-3 py-1 hover:bg-[#3772ff]/5">
              Врачи {city.nameIn}
            </Link>
            <Link href="/specialists" className="text-xs text-[#3772ff] border border-[#3772ff]/20 bg-white rounded-full px-3 py-1 hover:bg-[#3772ff]/5">
              Все специалисты
            </Link>
          </div>

          <MedicalDisclaimer />
        </div>
      </div>
    </>
  );
}
