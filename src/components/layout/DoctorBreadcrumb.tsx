"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHome, 
  faChevronRight, 
  faUserMd, 
  faCalendar,
  faNotesMedical,
  faVideo,
  faStethoscope,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";

interface DoctorBreadcrumbItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
}

interface DoctorBreadcrumbProps {
  activeTab: string;
  onNavigate?: (tab: string) => void;
  showHome?: boolean;
  customItems?: DoctorBreadcrumbItem[];
}

export const DoctorBreadcrumb = ({ 
  activeTab, 
  onNavigate, 
  showHome = true, 
  customItems 
}: DoctorBreadcrumbProps) => {
  const defaultItems: Record<string, DoctorBreadcrumbItem> = {
    appointments: {
      key: "appointments",
      title: "Мои Записи",
      icon: <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />,
    },
    patients: {
      key: "patients", 
      title: "История Пациентов",
      icon: <FontAwesomeIcon icon={faNotesMedical} className="w-4 h-4" />,
    },
    consultations: {
      key: "consultations",
      title: "Видео Консультация", 
      icon: <FontAwesomeIcon icon={faVideo} className="w-4 h-4" />,
    },
  };

  const items: Record<string, DoctorBreadcrumbItem> = customItems ? 
    customItems.reduce((acc, item) => ({ ...acc, [item.key]: item }), {} as Record<string, DoctorBreadcrumbItem>) : 
    defaultItems;

  const currentItem = items[activeTab];

  const handleHomeClick = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const handleItemClick = (itemKey: string) => {
    if (onNavigate) {
      onNavigate(itemKey);
    }
  };

  return (
    <nav 
      className="flex items-center space-x-2 mb-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
      role="navigation" 
      aria-label="Навигация по разделам доктора"
    >
      {showHome && (
        <>
          <button
            onClick={handleHomeClick}
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors duration-200 p-1.5 rounded-md hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Главная страница панели доктора"
            title="Панель доктора"
          >
            <FontAwesomeIcon icon={faStethoscope} className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Панель доктора</span>
          </button>
          
          <div className="text-gray-400">
            <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
          </div>
        </>
      )}

      {/* Current Section */}
      {currentItem && (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-blue-200">
            <div className="text-blue-600">
              {currentItem.icon}
            </div>
            <span className="font-semibold text-blue-800 text-sm">
              {currentItem.title}
            </span>
          </div>
        </div>
      )}

      {/* Quick Navigation Pills (Optional) */}
      {onNavigate && (
        <div className="hidden lg:flex items-center space-x-1 ml-4 pl-4 border-l border-gray-300">
          {Object.values(items)
            .filter(item => item.key !== activeTab)
            .slice(0, 2)
            .map((item) => (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-white/70 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                title={`Перейти к: ${item.title}`}
              >
                <div className="w-3 h-3">
                  {item.icon}
                </div>
                <span className="max-w-[100px] truncate">
                  {item.title}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* Mobile Menu Indicator */}
      <div className="flex lg:hidden ml-auto">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
        </div>
      </div>
    </nav>
  );
};
