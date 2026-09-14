"use client";

import { ConsultationTemplatesView } from "@/components/services/admin/ConsultationTemplatesView";

export default function DoctorConsultationTemplatesPage() {
  return (
    <ConsultationTemplatesView
      basePath="/doctor/consultation-templates"
      title="Мои шаблоны консультационных листов"
      subtitle="Свой набор секций для ваших видеоконсультаций и приёмов в клинике"
      emptyStateHint="Без своего шаблона используется шаблон клиники (если есть) или стандартный набор секций"
    />
  );
}
