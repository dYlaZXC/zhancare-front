"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AISymptomsChecker from "@/sections/MeetStyleConsultation/AISymptomsChecker";

interface AgentConfig {
  slug: string;
  agent_name: string;
  welcome_message: string;
  primary_color: string;
  logo_url?: string;
  clinic: {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    working_hours: string | null;
    phones: string[] | null;
    logo: string | null;
  };
}

export default function ClinicAgentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.clinic_slug as string;
  // ?q= can override the agent's stored auto_message (or be used standalone)
  const urlAutoMessage = searchParams?.get("q") ?? "";

  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not_found">("loading");

  useEffect(() => {
    if (!slug) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/clinic-agent/${slug}/`)
      .then((r) => {
        if (r.status === 404) { setStatus("not_found"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setConfig(data);
        setStatus("ready");
      })
      .catch(() => setStatus("not_found"));
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Загрузка агента...</p>
        </div>
      </div>
    );
  }

  if (status === "not_found" || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🏥</div>
          <h1 className="text-2xl font-bold text-gray-900">Агент не найден</h1>
          <p className="text-gray-500 max-w-sm">
            Ссылка устарела или агент временно отключён. Обратитесь в клинику.
          </p>
          <button
            onClick={() => router.push("/consultation/symptoms")}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Открыть общего ассистента
          </button>
        </div>
      </div>
    );
  }

  return (
    <AISymptomsChecker
      clinic={{
        clinicId: config.clinic.id,
        clinicSlug: config.slug,
        agentName: config.agent_name,
        welcomeMessage: config.welcome_message || undefined,
        autoMessage: urlAutoMessage || undefined,
        primaryColor: config.primary_color,
        logoUrl: config.logo_url || config.clinic.logo || undefined,
        clinicName: config.clinic.name,
      }}
    />
  );
}
