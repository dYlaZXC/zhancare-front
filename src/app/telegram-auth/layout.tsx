import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Login - ZhanCare.AI via Telegram",
  description: "Secure authentication via Telegram for ZhanCare.AI telemedicine platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function TelegramAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
