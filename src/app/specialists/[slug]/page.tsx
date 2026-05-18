import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { specialists } from "@/data/specialists";
import { symptoms } from "@/data/symptoms";
import { MedicalReviewerBox } from "@/components/seo/MedicalReviewerBox";
import { MedicalDisclaimer } from "@/components/seo/MedicalDisclaimer";
import { SourcesList } from "@/components/seo/SourcesList";
import { FAQJsonLd } from "@/components/seo/FAQJsonLd";
import { MedicalArticleJsonLd } from "@/components/seo/MedicalArticleJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { AiTriageWidget } from "@/components/seo/AiTriageWidget";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(specialists).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = specialists[slug];
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `https://zhan.care/specialists/${slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://zhan.care/specialists/${slug}`,
      images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: page.h1 }],
    },
  };
}

export default async function SpecialistPage({ params }: Props) {
  const { slug } = await params;
  const page = specialists[slug];
  if (!page) notFound();

  const relatedSymptomPages = page.relatedSymptoms
    .map((s) => ({ slug: s, data: symptoms[s] }))
    .filter((s) => s.data);

  return (
    <>
      <FAQJsonLd faqs={page.faqs} />
      <MedicalArticleJsonLd
        type="MedicalWebPage"
        name={page.h1}
        description={page.description}
        url={`https://zhan.care/specialists/${slug}`}
        updatedAt={page.updatedAt}
        reviewerId={page.reviewedBy}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Главная", url: "https://zhan.care" },
          { name: "Специалисты", url: "https://zhan.care/specialists" },
          { name: page.h1, url: `https://zhan.care/specialists/${slug}` },
        ]}
      />

      <div className="bg-[#F8FAFF] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#3772ff]">Главная</Link>
            <span>/</span>
            <Link href="/specialists" className="hover:text-[#3772ff]">Специалисты</Link>
            <span>/</span>
            <span className="text-gray-600">{page.h1}</span>
          </nav>

          {/* H1 */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-5">
            {page.h1}
          </h1>

          {/* Reviewer */}
          <MedicalReviewerBox reviewerId={page.reviewedBy} updatedAt={page.updatedAt} />

          {/* Intro */}
          <p className="mt-7 text-gray-700 leading-relaxed text-base">{page.intro}</p>

          {/* What they treat */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Что лечит</h2>
            <ul className="space-y-2">
              {page.whatTheyTreat.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-[#3772ff] mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* When to see */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Когда нужно обратиться</h2>
            <ul className="space-y-2">
              {page.whenToSee.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* AI Triage Widget */}
          <div className="mt-10">
            <AiTriageWidget specialistSlug={slug} />
          </div>

          {/* Clinic booking CTA */}
          <section className="mt-10 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Записаться к {page.h1.split(":")[0].toLowerCase()}</h2>
            <p className="text-gray-500 text-sm mb-4">
              Выберите удобное время — врач ответит в течение нескольких минут. Онлайн или очно, в вашей клинике.
            </p>
            <Link
              href={`/consultation/symptoms?specialist=${slug}`}
              className="inline-block bg-[#3772ff] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#2960e8] transition-colors text-sm md:text-base"
            >
              Записаться онлайн →
            </Link>
          </section>

          {/* Related symptoms */}
          {relatedSymptomPages.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Связанные симптомы</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedSymptomPages.map(({ slug: symSlug, data: sym }) => (
                  <Link
                    key={symSlug}
                    href={`/symptoms/${symSlug}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-[#3772ff] hover:shadow-sm transition-all group"
                  >
                    <span className="text-2xl" aria-hidden>🔍</span>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-[#3772ff] text-sm">
                        {sym.h1.split(":")[0]}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">{sym.intro.slice(0, 60)}…</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {page.faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl px-5 py-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">{faq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sources */}
          <div className="mt-10">
            <SourcesList sourceIds={page.sources} />
          </div>

          {/* Disclaimer */}
          <div className="mt-6">
            <MedicalDisclaimer />
          </div>

        </div>
      </div>
    </>
  );
}
