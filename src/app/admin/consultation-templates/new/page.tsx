"use client";

import { useRouter } from "next/navigation";
import { TemplateEditor } from "@/components/services/admin/consultationTemplates/TemplateEditor";

export default function NewConsultationTemplatePage() {
  const router = useRouter();

  return (
    <div className="w-full">
      <TemplateEditor
        mode="create"
        initial={null}
        onCancel={() => router.push("/admin/consultation-templates")}
        onSaved={() => router.push("/admin/consultation-templates")}
      />
    </div>
  );
}
