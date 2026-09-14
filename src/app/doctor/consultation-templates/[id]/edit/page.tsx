"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { TemplateEditor } from "@/components/services/admin/consultationTemplates/TemplateEditor";
import type { ConsultationFormTemplate } from "@/components/services/admin/consultationTemplates/types";

export default function EditDoctorConsultationTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<ConsultationFormTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/consultation-templates/${id}/`)
      .then((res) => setTemplate(res.data))
      .catch(() => {
        toast.error("Не удалось загрузить шаблон");
        router.push("/doctor/consultation-templates");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }
  if (!template) return null;

  return (
    <div className="w-full">
      <TemplateEditor
        mode="edit"
        initial={template}
        onCancel={() => router.push("/doctor/consultation-templates")}
        onSaved={() => router.push("/doctor/consultation-templates")}
      />
    </div>
  );
}
