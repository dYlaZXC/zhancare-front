import { medicalReviewers } from "@/data/medical-reviewers";

interface Props {
  type: "MedicalWebPage" | "MedicalCondition";
  name: string;
  description: string;
  url: string;
  updatedAt: string;
  reviewerId: string;
}

export function MedicalArticleJsonLd({ type, name, description, url, updatedAt, reviewerId }: Props) {
  const reviewer = medicalReviewers[reviewerId];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url,
    dateModified: updatedAt,
    inLanguage: "ru-KZ",
    publisher: {
      "@type": "Organization",
      name: "ZhanCare.AI",
      url: "https://zhan.care",
      logo: {
        "@type": "ImageObject",
        url: "https://zhan.care/logosaas.png",
      },
    },
  };

  if (reviewer) {
    schema.reviewedBy = {
      "@type": "Physician",
      name: reviewer.name,
      description: reviewer.credentials,
      medicalSpecialty: reviewer.specialty,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
