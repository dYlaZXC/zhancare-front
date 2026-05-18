import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/data-deletion", "/aigame", "/protocol-ai"],
        disallow: [
          "/admin",
          "/doctor",
          "/nurse",
          "/patient",
          "/profile",
          "/admin-profile",
          "/doctor-profile",
          "/nurse-profile",
          "/video-call",
          "/appointments",
          "/history",
          "/chat",
          "/documents",
          "/activity",
          "/login",
          "/questionnaire",
          "/smart-consultation",
          "/consultation/matching",
          "/consultation/payment",
          "/consultation/schedule",
          "/telegram-auth",
          "/sentry-example-page",
          "/test-loading",
          "/video",
        ],
      },
    ],
    sitemap: "https://zhan.care/sitemap.xml",
  };
}
