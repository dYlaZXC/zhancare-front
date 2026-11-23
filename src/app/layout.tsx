import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Sans } from "next/font/google";
import { twMerge } from "tailwind-merge";
import "./globals.css";
import "@/lib/fontawesome"; // FontAwesome configuration
import { headers } from "next/headers";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { OptimizedConsultationProvider } from "@/context/OptimizedConsultationContext";
import { BrandProvider } from "@/context/BrandContext";
import { BRAND_STYLES } from "@/config/brandConfig";
import type { BrandId } from "@/config/brandConfig";
import ServiceWorkerProvider from "@/components/pwa/ServiceWorkerProvider";
import { PushPermissionPrompt } from "@/components/pwa/PushPermissionPrompt";
import BottomNavBar from "@/components/layout/BottomNavBar";
import AuthPopup from "@/components/AuthPopup";
import ForceChangePasswordModal from "@/components/ForceChangePasswordModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://zhan.care"),
  title: {
    default: "Консультация врача онлайн за 5 минут | ZhanCare.AI",
    template: "%s | ZhanCare.AI",
  },
  description:
    "AI-анализ симптомов, подбор врача и онлайн-консультация через ZhanCare.AI. Найдите нужного специалиста за несколько минут.",
  keywords: [
    "телемедицина", "медицинские консультации онлайн", "ИИ в медицине",
    "врач онлайн", "вызов медсестры", "медицина казахстан", "здоровье",
    "telemedicine", "онлайн дәрігер", "медициналық консультация",
  ],
  authors: [{ name: "Adilan Akhramovich", url: "https://www.linkedin.com/in/adilan-akhramovich-914132158/" }],
  creator: "Adilan Akhramovich",
  publisher: "ТОО iTry, Алматы",
  alternates: {
    canonical: "https://zhan.care/",
    languages: {
      "ru": "https://zhan.care/",
      "x-default": "https://zhan.care/",
    },
  },
  openGraph: {
    title: "Консультация врача онлайн за 5 минут | ZhanCare.AI",
    description:
      "Онлайн-консультации врачей, ИИ-анализ симптомов и вызов медсестры на дом. Здоровье в один клик — ZhanCare.AI.",
    url: "https://zhan.care",
    siteName: "ZhanCare.AI",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/opengraph-zhancare.png",
        width: 1200,
        height: 630,
        alt: "ZhanCare.AI — Телемедицина будущего",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Консультация врача онлайн за 5 минут | ZhanCare.AI",
    description:
      "AI-анализ симптомов, подбор врача и онлайн-консультация через ZhanCare.AI. Найдите нужного специалиста за несколько минут.",
    images: ["/opengraph-zhancare.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "ZhanCare.AI",
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3772ff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const rawBrand = headersList.get("x-brand");
  const brandId: BrandId = rawBrand === "uz" ? "uz" : "kz";
  const brand = BRAND_STYLES[brandId] ?? BRAND_STYLES.kz;

  return (
    <html lang={brandId === "uz" ? "uz" : "ru"} className="relative">
      <head>
        {/* suppressHydrationWarning: browser extensions (Polymer/Lit) may inject a <style>
            before this one, shifting node positions and triggering a false mismatch. */}
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
          :root {
            --brand-primary: ${brand.primary};
            --brand-secondary: ${brand.secondary};
            --brand-sidebar-gradient: ${brand.sidebarGradient};
            --brand-glow: ${brand.sidebarGlow};
          }
        ` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://zhan.care/#website",
                  url: "https://zhan.care",
                  name: "ZhanCare.AI",
                  description: "Платформа для дистанционных медицинских консультаций с ИИ-ассистентом",
                  inLanguage: ["ru-KZ", "uz-UZ"],
                  potentialAction: {
                    "@type": "SearchAction",
                    target: { "@type": "EntryPoint", urlTemplate: "https://zhan.care/?q={search_term_string}" },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "MedicalOrganization",
                  "@id": "https://zhan.care/#organization",
                  name: "ZhanCare.AI",
                  url: "https://zhan.care",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://zhan.care/logosaas.png",
                    width: 600,
                    height: 200,
                  },
                  description: "Инновационная платформа телемедицины в Казахстане. Онлайн-консультации, ИИ-анализ симптомов, вызов медсестры на дом.",
                  medicalSpecialty: "GeneralPractice",
                  availableService: [
                    { "@type": "MedicalTherapy", name: "Онлайн-консультация врача" },
                    { "@type": "MedicalTherapy", name: "ИИ-анализ симптомов" },
                    { "@type": "HomeHealthCareService", name: "Вызов медсестры на дом" },
                  ],
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "KZ",
                    addressLocality: "Алматы",
                  },
                  sameAs: ["https://t.me/zhancareai", "https://www.instagram.com/zhancare_official/", "https://www.facebook.com/profile.php?id=61589492107256", "https://www.linkedin.com/company/zhancare-ai/"],
                },
              ],
            }),
          }}
        />
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-2ZF4XS6G3Y"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2ZF4XS6G3Y');
          `}
        </Script>
      </head>
      <body className={twMerge(dmSans.className, "antialiased bg-[#F8FAFF]")}>
        <ServiceWorkerProvider>
          <AuthProvider>
            <LanguageProvider>
              <BrandProvider initialBrand={brandId}>
                <OptimizedConsultationProvider>
                  <main>{children}</main>
                  <BottomNavBar />
                  <AuthPopup />
                  <ForceChangePasswordModal />
                  <PushPermissionPrompt />
                </OptimizedConsultationProvider>
              </BrandProvider>
            </LanguageProvider>
          </AuthProvider>
        </ServiceWorkerProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
