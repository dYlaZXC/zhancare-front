"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faChevronRight,
  faUsers,
  faCalendarCheck,
  faChartLine,
  faUserMd,
  faPlane,
  faFileMedical,
  faHistory,
  faBolt,
  faUser,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";

interface AdminBreadcrumbItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  href: string;
}

interface AdminBreadcrumbProps {
  showHome?: boolean;
  customItems?: AdminBreadcrumbItem[];
}

export const AdminBreadcrumb = ({
  showHome = true,
  customItems
}: AdminBreadcrumbProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const defaultItems: Record<string, AdminBreadcrumbItem> = {
    profile: {
      key: "profile",
      title: "Профиль",
      icon: <FontAwesomeIcon icon={faUser} className="w-4 h-4" />,
      href: "/admin/profile",
    },
    staff: {
      key: "staff",
      title: "Персонал",
      icon: <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />,
      href: "/admin/staff",
    },
    patients: {
      key: "patients",
      title: "Пациенты",
      icon: <FontAwesomeIcon icon={faUserMd} className="w-4 h-4" />,
      href: "/admin/patients",
    },
    schedule: {
      key: "schedule",
      title: "Расписание",
      icon: <FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4" />,
      href: "/admin/schedule",
    },
    reports: {
      key: "reports",
      title: "Аналитика",
      icon: <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />,
      href: "/admin/reports",
    },
    services: {
      key: "services",
      title: "Услуги",
      icon: <FontAwesomeIcon icon={faClipboardList} className="w-4 h-4" />,
      href: "/admin/services",
    },
    activity: {
      key: "activity",
      title: "Активность",
      icon: <FontAwesomeIcon icon={faHistory} className="w-4 h-4" />,
      href: "/admin/activity",
    },
  };

  const items: Record<string, AdminBreadcrumbItem> = customItems ?
    customItems.reduce((acc, item) => ({ ...acc, [item.key]: item }), {} as Record<string, AdminBreadcrumbItem>) :
    defaultItems;

  // Detect active tab from pathname
  const activeTab = Object.values(items).find(item => pathname?.startsWith(item.href))?.key || "profile";
  const currentItem = items[activeTab];

  const handleHomeClick = () => {
    router.push('/admin/profile');
  };

  const handleItemClick = (item: AdminBreadcrumbItem) => {
    router.push(item.href);
  };

  return (
    <nav
      className="flex items-center px-6 py-2 relative overflow-hidden border-b border-white/10 shadow-xl"
      role="navigation"
      aria-label="Навигация по разделам администратора"
      style={{
        background: `
          radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)
        `
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 left-10 w-16 h-16 rounded-full blur-xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.15) 0%, rgba(41, 53, 143, 0.1) 100%)', animationDuration: '4s' }}></div>
        <div className="absolute top-1 right-20 w-12 h-12 rounded-full blur-lg animate-bounce" style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.2) 0%, rgba(30, 38, 62, 0.1) 100%)', animationDuration: '3s' }}></div>
      </div>

      {/* Content - positioned above animated background */}
      <div className="relative z-10 flex items-center gap-3 flex-1">
        {showHome && (
          <>
            <button
              onClick={handleHomeClick}
              className="group flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 backdrop-blur-sm border border-white/0 hover:border-white/20"
              aria-label="Главная страница панели администратора"
              title="Панель администратора"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <FontAwesomeIcon icon={faBolt} className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold tracking-wide">Панель администратора</span>
            </button>

            <div className="flex items-center justify-center text-white/40">
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            </div>
          </>
        )}

        {/* Current Section - Premium Card */}
        {currentItem && (
          <div className="flex items-center">
            <div className="group relative flex items-center gap-2.5 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-white/30 hover:bg-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-105">
              {/* Icon with background */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                <div className="text-white flex items-center justify-center">
                  {currentItem.icon}
                </div>
              </div>
              {/* Text */}
              <span className="font-bold text-white text-sm tracking-wide drop-shadow-sm">
                {currentItem.title}
              </span>
              {/* Active indicator dot */}
              <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white/30 shadow-lg animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Quick Navigation Pills - Premium Style */}
        <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-white/30">
          {Object.values(items)
            .filter(item => item.key !== activeTab)
            .slice(0, 3)
            .map((item) => (
              <button
                key={item.key}
                onClick={() => handleItemClick(item)}
                className="group flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 backdrop-blur-sm border border-white/0 hover:border-white/20"
                title={`Перейти к: ${item.title}`}
              >
                <div className="flex items-center justify-center w-4 h-4">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold tracking-wide">
                  {item.title}
                </span>
              </button>
            ))}
        </div>

        {/* Mobile Menu Indicator - Premium */}
        <div className="flex lg:hidden ml-auto">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
            <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      {/* Premium Glass Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/0 to-white/5 pointer-events-none"></div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
    </nav>
  );
};
