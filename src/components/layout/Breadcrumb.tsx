"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, ChevronRight, User, Video, Calendar, FileText, Plane, FolderOpen, Activity } from "lucide-react";

interface BreadcrumbItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  href: string;
}

interface BreadcrumbProps {
  showHome?: boolean;
  customItems?: BreadcrumbItem[];
}

export const Breadcrumb = ({
  showHome = true,
  customItems
}: BreadcrumbProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const defaultItems: Record<string, BreadcrumbItem> = {
    profile: {
      key: "profile",
      title: "Профиль",
      icon: <User className="w-4 h-4" />,
      href: "/patient/profile",
    },
    video: {
      key: "video",
      title: "Видео консультация",
      icon: <Video className="w-4 h-4" />,
      href: "/patient/video",
    },
    appointments: {
      key: "appointments",
      title: "Вызов врача на дом",
      icon: <Calendar className="w-4 h-4" />,
      href: "/patient/appointments",
    },
    history: {
      key: "history",
      title: "Медицинская история",
      icon: <FileText className="w-4 h-4" />,
      href: "/patient/history",
    },
    chat: {
      key: "chat",
      title: "Мед Туризм",
      icon: <Plane className="w-4 h-4" />,
      href: "/patient/chat",
    },
    documents: {
      key: "documents",
      title: "Документы",
      icon: <FolderOpen className="w-4 h-4" />,
      href: "/patient/documents",
    },
    activity: {
      key: "activity",
      title: "Активность",
      icon: <Activity className="w-4 h-4" />,
      href: "/patient/activity",
    },
  };

  const items: Record<string, BreadcrumbItem> = customItems ?
    customItems.reduce((acc, item) => ({ ...acc, [item.key]: item }), {} as Record<string, BreadcrumbItem>) :
    defaultItems;

  // Detect active tab from pathname
  const activeTab = Object.values(items).find(item => pathname?.startsWith(item.href))?.key || "profile";
  const currentItem = items[activeTab];

  const handleHomeClick = () => {
    router.push('/patient/profile');
  };

  const handleItemClick = (item: BreadcrumbItem) => {
    router.push(item.href);
  };

  return (
    <nav 
      className="flex items-center space-x-2 mb-6 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200"
      role="navigation" 
      aria-label="Навигация по разделам"
    >
      {showHome && (
        <>
          <button
            onClick={handleHomeClick}
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors duration-200 p-1.5 rounded-md hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Главная страница"
            title="Главная"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Главная</span>
          </button>
          
          <div className="text-gray-400">
            <ChevronRight className="w-3 h-3" />
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
      <div className="hidden lg:flex items-center space-x-1 ml-4 pl-4 border-l border-gray-300">
        {Object.values(items)
          .filter(item => item.key !== activeTab)
          .slice(0, 3)
          .map((item) => (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
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

      {/* Mobile Menu Indicator */}
      <div className="flex lg:hidden ml-auto">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </nav>
  );
};

// Enhanced version with breadcrumb trail support
interface BreadcrumbTrailItem {
  key: string;
  title: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface AdvancedBreadcrumbProps {
  trail: BreadcrumbTrailItem[];
  maxItems?: number;
  showIcons?: boolean;
  className?: string;
}

export const AdvancedBreadcrumb = ({ 
  trail, 
  maxItems = 4, 
  showIcons = true,
  className = ""
}: AdvancedBreadcrumbProps) => {
  const ellipsisItem: BreadcrumbTrailItem = { 
    key: 'ellipsis', 
    title: '...', 
    icon: undefined 
  };
  
  const displayTrail: BreadcrumbTrailItem[] = trail.length > maxItems 
    ? [trail[0], ellipsisItem, ...trail.slice(-2)]
    : trail;

  return (
    <nav 
      className={`flex items-center space-x-1 mb-6 p-3 bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      role="navigation"
      aria-label="Путь навигации"
    >
      {displayTrail.map((item, index) => (
        <React.Fragment key={item.key}>
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-gray-400 mx-1" />
          )}
          
          {item.key === 'ellipsis' ? (
            <span className="text-gray-400 px-2">...</span>
          ) : (
            <button
              onClick={item.onClick}
              disabled={!item.onClick}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors duration-200 ${
                index === displayTrail.length - 1
                  ? 'bg-blue-100 text-blue-800 font-semibold cursor-default'
                  : item.onClick
                  ? 'text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                  : 'text-gray-600 cursor-default'
              }`}
              title={item.title}
            >
              {showIcons && item.icon && (
                <div className="w-4 h-4">
                  {item.icon}
                </div>
              )}
              <span className="max-w-[150px] truncate">
                {item.title}
              </span>
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};