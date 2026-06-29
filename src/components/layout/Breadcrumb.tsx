"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, ChevronRight, User, Video, Calendar, FileText, Plane, FolderOpen, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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

const BREADCRUMB_TEXT = {
  ru: {
    nav: "Навигация по разделам", home: "Главная", homeAria: "Главная страница", goTo: "Перейти к:",
    profile: "Профиль", video: "Консультация", appointments: "Вызов врача на дом",
    history: "Медицинская история", chat: "Мед Туризм", documents: "Документы", activity: "Активность",
  },
  kz: {
    nav: "Бөлімдер бойынша навигация", home: "Басты бет", homeAria: "Басты бет", goTo: "Өту:",
    profile: "Профиль", video: "Кеңес", appointments: "Дәрігерді үйге шақыру",
    history: "Медициналық тарих", chat: "Медициналық туризм", documents: "Құжаттар", activity: "Белсенділік",
  },
  en: {
    nav: "Section navigation", home: "Home", homeAria: "Home page", goTo: "Go to:",
    profile: "Profile", video: "Consultation", appointments: "Doctor home visit",
    history: "Medical history", chat: "Medical Tourism", documents: "Documents", activity: "Activity",
  },
  uz: {
    nav: "Bo'limlar bo'yicha navigatsiya", home: "Bosh sahifa", homeAria: "Bosh sahifa", goTo: "O'tish:",
    profile: "Profil", video: "Konsultatsiya", appointments: "Shifokorni uyga chaqirish",
    history: "Tibbiy tarix", chat: "Tibbiy turizm", documents: "Hujjatlar", activity: "Faollik",
  },
};

export const Breadcrumb = ({
  showHome = true,
  customItems
}: BreadcrumbProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const t = BREADCRUMB_TEXT[language as keyof typeof BREADCRUMB_TEXT] ?? BREADCRUMB_TEXT.ru;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const defaultItems: Record<string, BreadcrumbItem> = {
    profile: {
      key: "profile",
      title: t.profile,
      icon: <User className="w-4 h-4" />,
      href: "/patient/profile",
    },
    video: {
      key: "video",
      title: t.video,
      icon: <Video className="w-4 h-4" />,
      href: "/patient/video",
    },
    appointments: {
      key: "appointments",
      title: t.appointments,
      icon: <Calendar className="w-4 h-4" />,
      href: "/patient/appointments",
    },
    history: {
      key: "history",
      title: t.history,
      icon: <FileText className="w-4 h-4" />,
      href: "/patient/history",
    },
    chat: {
      key: "chat",
      title: t.chat,
      icon: <Plane className="w-4 h-4" />,
      href: "/patient/chat",
    },
    documents: {
      key: "documents",
      title: t.documents,
      icon: <FolderOpen className="w-4 h-4" />,
      href: "/patient/documents",
    },
    activity: {
      key: "activity",
      title: t.activity,
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
      className="flex items-center px-6 py-2 relative overflow-hidden border-b border-white/10 shadow-xl"
      role="navigation"
      aria-label={t.nav}
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
              aria-label={t.homeAria}
              title={t.home}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Home className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold tracking-wide">{t.home}</span>
            </button>

            <div className="flex items-center justify-center text-white/40">
              <ChevronRight className="w-4 h-4" />
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
                title={`${t.goTo} ${item.title}`}
              >
                <div className="flex items-center justify-center w-4 h-4">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold max-w-[120px] truncate tracking-wide">
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
      className={`flex items-center space-x-1 mb-6 p-3 bg-white rounded-lg shadow-sm ${className}`}
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