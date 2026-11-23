import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZhanCare.AI — Телемедицина",
    short_name: "ZhanCare.AI",
    description:
      "AI-анализ симптомов, подбор врача и онлайн-консультация через ZhanCare.AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFF",
    theme_color: "#3772ff",
    lang: "ru",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
