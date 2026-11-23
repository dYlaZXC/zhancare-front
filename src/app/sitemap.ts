import type { MetadataRoute } from "next";
import { symptoms } from "@/data/symptoms";
import { specialists } from "@/data/specialists";
import { ACTIVE_CITIES } from "@/data/cities";

async function getClinicSlugs(): Promise<string[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  try {
    const res = await fetch(`${apiUrl}/public/clinic-agents/slugs/`, {
      next: { revalidate: 86400 }, // refresh once per day
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.slugs) ? data.slugs : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://zhan.care";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                     lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/symptoms`,       lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/specialists`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/aigame`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/protocol-ai`,    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`,        lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/terms`,          lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/data-deletion`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const specialistRoutes: MetadataRoute.Sitemap = Object.keys(specialists).map((slug) => ({
    url: `${base}/specialists/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const symptomRoutes: MetadataRoute.Sitemap = Object.keys(symptoms).map((slug) => ({
    url: `${base}/symptoms/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const slugs = await getClinicSlugs();
  const clinicRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/consultation/symptoms/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const cityRoutes: MetadataRoute.Sitemap = ACTIVE_CITIES.map((city) => ({
    url: `${base}/${city}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const citySpecialistRoutes: MetadataRoute.Sitemap = ACTIVE_CITIES.flatMap((city) =>
    Object.keys(specialists).map((slug) => ({
      url: `${base}/${city}/specialists/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.84,
    }))
  );

  const citySymptomRoutes: MetadataRoute.Sitemap = ACTIVE_CITIES.flatMap((city) =>
    Object.keys(symptoms).map((slug) => ({
      url: `${base}/${city}/symptoms/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.82,
    }))
  );

  return [
    ...staticRoutes,
    ...specialistRoutes,
    ...symptomRoutes,
    ...cityRoutes,
    ...citySpecialistRoutes,
    ...citySymptomRoutes,
    ...clinicRoutes,
  ];
}
