import type { Metadata } from "next";

interface Props {
  params: Promise<{ clinic_slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clinic_slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${apiUrl}/public/clinic-agent/${clinic_slug}/`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const clinicName = data.clinic?.name ?? clinic_slug;
      const agentName = data.agent_name ?? "ИИ-консультант";
      const city = data.clinic?.city ?? "Казахстан";

      return {
        title: `${clinicName} — онлайн-консультация`,
        description: `${agentName} — запишитесь на онлайн-консультацию в ${clinicName} (${city}) через ZhanCare.AI. Быстро, удобно, доступно.`,
        openGraph: {
          title: `${clinicName} — онлайн-консультация | ZhanCare.AI`,
          description: `Запишитесь онлайн в ${clinicName} через ИИ-ассистент ZhanCare.AI.`,
          images: [{ url: "/opengraph-zhancare.png", width: 1200, height: 630 }],
        },
      };
    }
  } catch {
    // fall through to default
  }

  return {
    title: "Онлайн-консультация клиники",
    description: "Запишитесь на онлайн-консультацию через ИИ-ассистент ZhanCare.AI.",
  };
}

export default function ClinicAgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
