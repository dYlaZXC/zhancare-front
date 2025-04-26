"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faChevronRight, faUserMd } from "@fortawesome/free-solid-svg-icons";

export const DoctorBreadcrumb = ({ activeTab }: { activeTab: string }) => {
  const titles: Record<string, string> = {
    appointments: "Мои Записи",
    patients: "История Пациентов",
    consultations: "Видео Консультация",
  };

  return (
    <nav className="text-gray-600 text-sm flex items-center space-x-2 mb-6">
      <FontAwesomeIcon icon={faUserMd} className="text-[#001E80]" />
      <span className="text-gray-400">
        <FontAwesomeIcon icon={faChevronRight} />
      </span>
      <span className="font-medium text-[#001E80]">
        {titles[activeTab] || "Панель"}
      </span>
    </nav>
  );
};
