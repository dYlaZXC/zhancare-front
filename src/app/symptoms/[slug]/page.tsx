import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { symptoms } from "@/data/symptoms";
import { specialists } from "@/data/specialists";
import { MedicalReviewerBox } from "@/components/seo/MedicalReviewerBox";
import { EmergencyWarning } from "@/components/seo/EmergencyWarning";
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
  return Object.keys(symptoms).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = symptoms[slug];
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `https://zhan.care/symptoms/${slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://zhan.care/symptoms/${slug}`,
      images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630, alt: page.h1 }],
    },
  };
}

export default async function SymptomPage({ params }: Props) {
  const { slug } = await params;
  const page = symptoms[slug];
  if (!page) notFound();

  const recommendedSpecs = page.recommendedSpecialists
    .map((s) => ({ slug: s, data: specialists[s] }))
    .filter((s) => s.data);

  return (
    <>
      <FAQJsonLd faqs={page.faqs} />
      <MedicalArticleJsonLd
        type="MedicalWebPage"
        name={page.h1}
        description={page.description}
        url={`https://zhan.care/symptoms/${slug}`}
        updatedAt={page.updatedAt}
        reviewerId={page.reviewedBy}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Главная", url: "https://zhan.care" },
          { name: "Симптомы", url: "https://zhan.care/symptoms" },
          { name: page.h1, url: `https://zhan.care/symptoms/${slug}` },
        ]}
      />

      <div className="bg-[#F8FAFF] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#3772ff]">Главная</Link>
            <span>/</span>
            <Link href="/symptoms" className="hover:text-[#3772ff]">Симптомы</Link>
            <span>/</span>
            <span className="text-gray-600">{page.h1}</span>
          </nav>

          {/* H1 */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-5">
            {page.h1}
          </h1>

          {/* Reviewer */}
          <MedicalReviewerBox reviewerId={page.reviewedBy} updatedAt={page.updatedAt} />

          {/* Emergency warning */}
          <div className="mt-6">
            <EmergencyWarning text={page.emergencyWarning} />
          </div>

          {/* Intro */}
          <p className="mt-7 text-gray-700 leading-relaxed text-base">{page.intro}</p>

          {/* Causes */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Возможные причины</h2>
            <ul className="space-y-2">
              {page.causes.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-[#3772ff] mt-0.5 flex-shrink-0">•</span>
                  {cause}
                </li>
              ))}
            </ul>
          </section>

          {/* When to see a doctor */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Когда нужно обратиться к врачу</h2>
            <ul className="space-y-2">
              {page.whenToSeeDoctor.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* AI Triage Widget */}
          <div className="mt-10">
            <AiTriageWidget symptomSlug={slug} />
          </div>

          {/* Recommended specialists */}
          {recommendedSpecs.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Рекомендуемые специалисты</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {recommendedSpecs.map(({ slug: specSlug, data: spec }) => (
                  <Link
                    key={specSlug}
                    href={`/specialists/${specSlug}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-[#3772ff] hover:shadow-sm transition-all group"
                  >
                    <span className="text-2xl" aria-hidden>🩺</span>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-[#3772ff] capitalize">
                        {specSlug.replace(/-/g, " ")}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">{spec.intro.slice(0, 60)}…</p>
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
