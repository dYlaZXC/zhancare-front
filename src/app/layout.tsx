import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Sans } from "next/font/google";
import { twMerge } from "tailwind-merge";
import "./globals.css";
import "@/lib/fontawesome"; // FontAwesome configuration
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { OptimizedConsultationProvider } from "@/context/OptimizedConsultationContext";
import AuthPopup from "@/components/AuthPopup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://zhan.care"),
  title: "ZhanCare.AI - Будущее телемедицины",
  description:
    "ZhanCare.AI — инновационная платформа для дистанционных медицинских консультаций...",
  keywords: ["телемедицина", "медицинские консультации", "ИИ в медицине", "здоровье"],
  authors: [
    {
      name: "Adilan Akhramovich",
      url: "https://www.linkedin.com/in/adilan-akhramovich-914132158/",
    },
  ],
  creator: "Adilan Akhramovich",
  publisher: "ТОО iTry, Алматы",
  openGraph: {
    title: "ZhanCare.AI - Будущее телемедицины",
    description: "ZhanCare.AI предоставляет современные технологии...",
    images: [
      {
        url: "/opengraph-zhancare.png",
        width: 1200,
        height: 630,
        alt: "ZhanCare.AI - Телемедицина будущего",
      },
    ],
    locale: "ru_RU",
    type: "website",
    siteName: "ZhanCare.AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="relative">
      <head>
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
        <AuthProvider>
          <LanguageProvider>
            <OptimizedConsultationProvider>
              <main>{children}</main>
              <AuthPopup />
            </OptimizedConsultationProvider>
          </LanguageProvider>
        </AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
