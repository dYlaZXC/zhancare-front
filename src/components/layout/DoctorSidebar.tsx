"use client";
import { createPortal } from "react-dom";

import Image from "next/image";
import { motion } from "framer-motion";
import { useClinicCurrency } from "@/context/BrandContext";
import LogoIcon from "../../../public/logo_icon.png";
import { CollapsibleSubmenu } from "./CollapsibleSubmenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faNotesMedical,
  faVideo,
  faSignOutAlt,
  faTimes,
  faBolt,
  faGem,
  faUser,
  faChartLine,
  faChevronRight,
  faBriefcaseMedical,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

import { useState, useEffect, useRef } from "react";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://127.0.0.1:8000";
const resolveAvatar = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND}${url}`;
};
import { useAuth, computeRole } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

type SubMenuItem = { id: string; icon: any; title: string; color: string; href: string };
type MenuItem = { id: string; icon: any; title: string; color: string; href?: string; children?: SubMenuItem[] };

const doctorMenu: MenuItem[] = [
  { id: "profile", icon: faUser, title: "Профиль", color: "#1e40af", href: "/doctor/profile" },
  {
    id: "services-group",
    icon: faBriefcaseMedical,
    title: "Мои услуги",
    color: "#3267e6",
    children: [
      { id: "consultations", icon: faVideo, title: "Консультации", color: "#295bbf", href: "/doctor/consultations" },
      { id: "patients", icon: faNotesMedical, title: "История пациентов", color: "#3267e6", href: "/doctor/patients" },
      { id: "consultation-templates", icon: faFileLines, title: "Мои шаблоны", color: "#3267e6", href: "/doctor/consultation-templates" },
    ],
  },
  { id: "schedule", icon: faCalendarAlt, title: "Расписание", color: "#059669", href: "/doctor/schedule" },
  { id: "analytics", icon: faChartLine, title: "Аналитика", color: "#8b5cf6", href: "/doctor/analytics" },
];

export interface DoctorSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed?: boolean;
  }

export const DoctorSidebar = ({
  isOpen,
  onClose,
  isCollapsed = false,
}: DoctorSidebarProps) => {
  const { user, logoutUser } = useAuth();
  const { appLogo, brand } = useClinicCurrency();
  const userRole = computeRole(user?.roles);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [flyoutAnchor, setFlyoutAnchor] = useState({ top: 0, left: 0 });
  const [avatarBroken, setAvatarBroken] = useState(false);
  const flyoutTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileSidebarRef = useRef<HTMLElement>(null);
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const onSidebarMouseMove = (ref: React.RefObject<HTMLElement>) => (e: React.MouseEvent<HTMLElement>) => {
    if (ref.current) ref.current.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, ${brand.sidebarGlow} 0%, transparent 50%), url('/zhancare_sidebar_background.svg') center/100% 100% no-repeat, ${brand.sidebarGradient}`;
  };
  const enterFlyout = (id: string, e?: React.MouseEvent<HTMLElement>) => {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
    if (e) { const r = e.currentTarget.getBoundingClientRect(); setFlyoutAnchor({ top: r.top + r.height / 2, left: r.right }); }
    setOpenFlyout(id);
  };
  const leaveFlyout = () => { flyoutTimeout.current = setTimeout(() => setOpenFlyout(null), 150); };

  useEffect(() => {
    const toExpand = new Set<string>();
    doctorMenu.forEach(item => {
      if (item.children?.some(child => pathname?.startsWith(child.href))) {
        toExpand.add(item.id);
      }
    });
    if (toExpand.size > 0) setExpandedGroups(toExpand);
  }, [pathname]);

  if (!user) return null;

  const activeTab = (() => {
    for (const item of doctorMenu) {
      if (item.children) {
        const match = item.children.find(child => pathname?.startsWith(child.href));
        if (match) return match.id;
      } else if (item.href && pathname?.startsWith(item.href)) {
        return item.id;
      }
    }
    return "consultations";
  })();

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleLogout = () => {
    toast.success("Вы успешно вышли!", { position: "top-right", autoClose: 1000 });
    setTimeout(() => {
      logoutUser();
      window.location.href = "/";
    }, 1200);
  };

  const handleTabChange = () => {
    onClose();
    setSidebarOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor": return faGem;
      case "admin": return faBolt;
      default: return faUser;
    }
  };

  const getRoleGradient = (_role: string) => ({
    bg: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
    border: brand.sidebarGlow,
  });

  const renderSubItem = (child: SubMenuItem, variant: 'mobile' | 'desktop') => (
    <div key={child.id} className="relative">
      <Link
        href={child.href}
        onClick={handleTabChange}
        onMouseEnter={() => setHoveredItem(child.id)}
        onMouseLeave={() => setHoveredItem(null)}
        className={`w-full group relative transition-all duration-300 min-h-[40px] border-0 outline-none focus:outline-none will-change-transform block ${
          activeTab === child.id ? "transform scale-105" : "hover:scale-102"
        }`}
        aria-label={child.title}
      >
        <div
          className={`relative flex items-center gap-3 ${variant === 'mobile' ? 'px-3 py-2 xs:px-4 xs:py-2.5' : 'px-3 py-2'} rounded-xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${
            activeTab === child.id ? 'text-white font-semibold shadow-lg' : 'backdrop-blur-sm'
          }`}
          style={activeTab === child.id ? {
            background: 'rgba(55, 114, 255, 0.2)',
            border: '1px solid rgba(55, 114, 255, 0.5)',
          } : {
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== child.id) {
              e.currentTarget.style.background = 'rgba(55, 114, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== child.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
            }
          }}
        >
          <div
            className="relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300"
            style={activeTab === child.id ? { background: 'rgba(255,255,255,0.2)' } : { background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)' }}
          >
            <FontAwesomeIcon icon={child.icon} className={`text-sm transition-all duration-300 ${activeTab === child.id ? 'scale-110 text-white' : 'group-hover:scale-110'}`} />
          </div>
          <span className={`text-sm transition-all duration-300 ${activeTab === child.id ? 'font-semibold text-white' : 'font-medium text-white/70 group-hover:text-white'}`}>
            {child.title}
          </span>
          {activeTab === child.id && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {(sidebarOpen || isOpen) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer motion-reduce:transition-none"
          onClick={() => { setSidebarOpen(false); onClose(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setSidebarOpen(false); onClose(); } }}
          aria-label="Закрыть меню навигации"
          role="button"
          tabIndex={0}
        />
      )}

      {/* Mobile / Tablet Sidebar */}
      <aside
        className={`${
          sidebarOpen || isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed top-0 left-0 h-screen w-72 xs:w-76 text-white flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform z-50 shadow-2xl border-r border-white/10 backdrop-blur-xl will-change-transform overflow-x-hidden xl:hidden`}
        style={{ background: `url('/zhancare_sidebar_background.svg') center/100% 100% no-repeat, ${brand.sidebarGradient}` }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-24 h-24 xs:w-32 xs:h-32 rounded-full blur-xl animate-pulse" style={{ background: `radial-gradient(circle, ${brand.accentRgba}0.15) 0%, ${brand.accentRgba}0.1) 100%)`, animationDuration: '4s' }}></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 xs:w-24 xs:h-24 rounded-full blur-lg animate-bounce" style={{ background: `radial-gradient(circle, ${brand.accentRgba}0.16) 0%, rgba(30,38,62,0.08) 100%)`, animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 xs:w-16 xs:h-16 rounded-full blur-md animate-ping" style={{ background: `radial-gradient(circle, ${brand.accentRgba}0.25) 0%, transparent 70%)`, animationDuration: '2s' }}></div>
        </div>

        <div className="flex justify-between items-center px-3 py-5 xs:px-4 xs:py-6 sm:px-6 sm:py-7 xl:hidden relative z-10 border-b border-white/10">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="block outline-none focus:outline-none">
            <Image src={appLogo} alt="Logo" width={220} height={55} priority className="w-full max-w-[144px] h-auto hover:opacity-90 transition-opacity duration-300 drop-shadow-lg" />
          </Link>
          <div className="relative group">
            <button
              onClick={() => { setSidebarOpen(false); onClose(); }}
              className="relative min-w-[48px] min-h-[48px] p-3 xs:p-3.5 sm:p-4 rounded-xl xs:rounded-2xl backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 border-0 outline-none overflow-hidden flex items-center justify-center focus:outline-none"
              aria-label="Закрыть меню навигации"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.15) 50%, rgba(185,28,28,0.1) 100%)', border: '1px solid rgba(255,255,255,0.2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.25) 50%, rgba(185,28,28,0.2) 100%)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.15) 50%, rgba(185,28,28,0.1) 100%)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg xs:text-xl text-red-400 group-hover:text-red-300 transition-all duration-300 drop-shadow-sm relative z-10" aria-hidden="true" />
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.2) 0%, transparent 70%)' }}></div>
            </button>
          </div>
        </div>

        <div className="px-3 py-4 xs:px-4 xs:py-5 sm:px-6 sm:py-6 text-center relative z-10">
          <div className="relative group mb-4 flex justify-center">
            <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-xl xs:rounded-2xl flex items-center justify-center text-lg xs:text-xl sm:text-xl font-bold shadow-2xl transform group-hover:scale-110 transition-all duration-300 border-2 border-white backdrop-blur-sm"
                 style={{ background: getRoleGradient(userRole).bg }}>
              <span className="relative z-10 text-white drop-shadow-lg">{user.first_name.charAt(0)}</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="absolute -bottom-0.5 -right-0.5 xs:-bottom-1 xs:-right-1 w-5 h-5 xs:w-6 xs:h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="block xl:hidden">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2 py-1 xs:px-3 xs:py-1.5 rounded-lg xs:rounded-xl shadow-lg border backdrop-blur-sm mb-2 xs:mb-3 text-xs font-bold uppercase tracking-wide"
                 style={{ background: getRoleGradient(userRole).bg, borderColor: getRoleGradient(userRole).border }}>
              <FontAwesomeIcon icon={getRoleIcon(userRole)} className="text-xs" />
              <span>Доктор</span>
            </div>
            <h2 className="text-base xs:text-lg font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">{user.first_name} {user.last_name}</h2>
            <p className="text-xs text-gray-300 break-words opacity-80 leading-relaxed px-2 xs:px-0">{user.email}</p>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="mt-2 space-y-2 xs:space-y-2.5 px-3 xs:px-4 sm:px-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 sidebar-scroll">
          {doctorMenu.map((item) => {
            if (!item.children) {
              return (
                <div key={item.id} className="relative">
                  <Link
                    href={item.href!}
                    onClick={handleTabChange}
                    onMouseEnter={(e) => { setHoveredItem(item.id); if (isCollapsed) enterFlyout(item.id, e); }}
                    onMouseLeave={() => { setHoveredItem(null); if (isCollapsed) leaveFlyout(); }}
                    className={`w-full group relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[48px] border-0 outline-none focus:outline-none will-change-transform block ${activeTab === item.id ? "transform scale-105" : "hover:scale-102"}`}
                    aria-label={item.title}
                  >
                    <div
                      className={`relative flex items-center gap-3 xs:gap-4 px-3 py-3 xs:px-4 xs:py-4 rounded-xl xs:rounded-2xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${activeTab === item.id ? 'text-white shadow-2xl font-semibold' : 'backdrop-blur-sm'}`}
                      style={activeTab === item.id ? { background: 'rgba(55,114,255,0.15)', border: '1px solid rgba(55,114,255,0.4)', boxShadow: '0 0 20px rgba(55,114,255,0.2)' } : { background: 'rgba(55,114,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onMouseEnter={(e) => { if (activeTab !== item.id) { e.currentTarget.style.background = 'rgba(55,114,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                      onMouseLeave={(e) => { if (activeTab !== item.id) { e.currentTarget.style.background = 'rgba(55,114,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                    >
                      {activeTab === item.id && <div className="absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-[0_0_6px_rgba(96,165,250,0.5)]"></div>}
                      <div className="relative flex items-center justify-center w-8 h-8 xs:w-10 xs:h-10 rounded-lg xs:rounded-xl transition-all duration-300"
                           style={activeTab === item.id ? { background: 'rgba(255,255,255,0.2)' } : { background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                        <FontAwesomeIcon icon={item.icon} className={`text-base xs:text-lg transition-all duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        {hoveredItem === item.id && <div className="absolute inset-0 rounded-xl opacity-30 blur-sm animate-pulse" style={{ background: `${item.color}33` }}></div>}
                      </div>
                      <span className={`text-sm xs:text-base transition-all duration-300 ${activeTab === item.id ? 'font-semibold text-white' : 'font-medium group-hover:text-white'}`}>{item.title}</span>
                      {activeTab === item.id && <div className="absolute right-2 xs:right-4 top-1/2 -translate-y-1/2"><div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-white rounded-full animate-pulse"></div></div>}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    </div>
                  </Link>
                </div>
              );
            }

            const isExpanded = expandedGroups.has(item.id);
            const hasActiveChild = item.children.some(c => activeTab === c.id);

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full group relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[48px] border-0 outline-none focus:outline-none will-change-transform ${hasActiveChild ? "transform scale-105" : "hover:scale-102"}`}
                  aria-label={item.title}
                  aria-expanded={isExpanded}
                >
                  <div
                    className={`relative flex items-center gap-3 xs:gap-4 px-3 py-3 xs:px-4 xs:py-4 rounded-xl xs:rounded-2xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${hasActiveChild ? 'text-white shadow-2xl font-semibold' : 'backdrop-blur-sm'}`}
                    style={hasActiveChild ? { background: 'rgba(55,114,255,0.15)', border: '1px solid rgba(55,114,255,0.4)', boxShadow: '0 0 20px rgba(55,114,255,0.2)' } : { background: 'rgba(55,114,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onMouseEnter={(e) => { if (!hasActiveChild) { e.currentTarget.style.background = 'rgba(55,114,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                    onMouseLeave={(e) => { if (!hasActiveChild) { e.currentTarget.style.background = 'rgba(55,114,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                  >
                    {hasActiveChild && <div className="absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-[0_0_6px_rgba(96,165,250,0.5)]"></div>}
                    <div className="relative flex items-center justify-center w-8 h-8 xs:w-10 xs:h-10 rounded-lg xs:rounded-xl transition-all duration-300"
                         style={hasActiveChild ? { background: 'rgba(255,255,255,0.2)' } : { background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                      <FontAwesomeIcon icon={item.icon} className={`text-base xs:text-lg transition-all duration-300 ${hasActiveChild ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {hoveredItem === item.id && <div className="absolute inset-0 rounded-xl opacity-30 blur-sm animate-pulse" style={{ background: `${item.color}33` }}></div>}
                    </div>
                    <span className={`flex-1 text-left text-sm xs:text-base transition-all duration-300 ${hasActiveChild ? 'font-semibold text-white' : 'font-medium group-hover:text-white'}`}>{item.title}</span>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <FontAwesomeIcon icon={faChevronRight} className={`text-xs mr-1 ${hasActiveChild ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  </div>
                </button>
                <CollapsibleSubmenu isOpen={isExpanded}>
                  {item.children.map(child => renderSubItem(child, 'mobile'))}
                </CollapsibleSubmenu>
              </div>
            );
          })}
        </nav>

        <div className="px-3 xs:px-4 sm:px-6 py-4 xs:py-6 relative z-10">
          <button
            onClick={handleLogout}
            className="w-full group relative overflow-hidden min-h-[48px] px-3 py-3 xs:px-4 xs:py-4 sm:px-5 sm:py-4 rounded-xl xs:rounded-2xl text-white font-semibold flex items-center justify-center gap-2 xs:gap-3 transition-all duration-300 shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-95 border-0 outline-none focus:outline-none will-change-transform"
            aria-label="Выйти из системы"
            style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)', border: '1px solid rgba(220,38,38,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)'; }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-base xs:text-lg group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
            <span className="text-sm xs:text-base">Выйти</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.2) 100%)' }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        ref={desktopSidebarRef as any}
        onMouseMove={onSidebarMouseMove(desktopSidebarRef)}
        className={`hidden xl:flex fixed top-0 left-0 h-screen ${isCollapsed ? "w-20" : "w-80"} text-white flex-col justify-between overflow-y-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 shadow-2xl border-r border-white/10 backdrop-blur-xl will-change-transform overflow-x-hidden`}
        style={{ background: `url('/zhancare_sidebar_background.svg') center/100% 100% no-repeat, ${brand.sidebarGradient}` }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full blur-xl animate-pulse" style={{ background: `radial-gradient(circle, ${brand.accentRgba}0.15) 0%, ${brand.accentRgba}0.1) 100%)`, animationDuration: '4s' }}></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 rounded-full blur-lg animate-bounce" style={{ background: `radial-gradient(circle, ${brand.accentRgba}0.16) 0%, rgba(30,38,62,0.08) 100%)`, animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full blur-md animate-ping" style={{ background: `radial-gradient(circle, ${brand.accentRgba}0.25) 0%, transparent 70%)`, animationDuration: '2s' }}></div>
        </div>

        <div className="flex flex-col flex-shrink-0 relative z-10">
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-5' : 'px-6 py-5'} relative z-10`}>
            <Link href="/" className="outline-none focus:outline-none w-full">
              {isCollapsed ? (
                <Image src={LogoIcon} alt="ZhanCare" width={40} height={40} priority className="w-10 h-10 object-contain drop-shadow-md mx-auto" />
              ) : (
                <Image src={appLogo} alt="Logo" width={280} height={55} priority className="w-full max-w-[88%] mx-auto h-auto hover:opacity-90 transition-opacity duration-300 drop-shadow-lg" />
              )}
            </Link>
          </div>

          <div className={`${isCollapsed ? 'px-2 py-3' : 'px-6 py-3'} text-center relative z-10`}>
            <div className="group mb-2">
              {isCollapsed ? (
                <div className="relative inline-block mx-auto">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold shadow-2xl border-2 border-white"
                       style={{ background: (user.avatar && !avatarBroken) ? 'transparent' : getRoleGradient(userRole).bg }}>
                    {user.avatar && !avatarBroken
                      ? <img src={resolveAvatar(user.avatar)!} alt="" className="w-full h-full object-cover rounded-[inherit]" onError={() => setAvatarBroken(true)} />
                      : <FontAwesomeIcon icon={faUser} className="text-white text-base" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow border-2 border-white">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto w-full max-w-[120px] 2xl:max-w-[152px] aspect-square">
                  <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center text-4xl font-bold shadow-2xl border-2 border-white"
                       style={{ background: (user.avatar && !avatarBroken) ? 'transparent' : getRoleGradient(userRole).bg }}>
                    {user.avatar && !avatarBroken
                      ? <img src={resolveAvatar(user.avatar)!} alt="" className="w-full h-full object-cover rounded-[inherit]" onError={() => setAvatarBroken(true)} />
                      : <>
                          <FontAwesomeIcon icon={faUser} className="text-white/90 drop-shadow-lg" style={{ fontSize: '2.6rem' }} />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                        </>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl shadow-lg border backdrop-blur-sm mb-2 text-xs font-bold uppercase tracking-wide"
                     style={{ background: getRoleGradient(userRole).bg, borderColor: getRoleGradient(userRole).border }}>
                  <FontAwesomeIcon icon={getRoleIcon(userRole)} className="text-xs" />
                  <span>Доктор</span>
                </div>
                <h2 className="text-base font-bold mb-0.5 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">{user.first_name} {user.last_name}</h2>
                <p className="text-xs text-gray-300 break-words opacity-80 leading-relaxed">{user.email}</p>
              </>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className={`flex-1 min-h-0 flex flex-col justify-start gap-2 ${isCollapsed ? 'px-2 py-3' : 'px-6 py-3'} overflow-x-hidden overflow-y-auto relative z-10 sidebar-scroll`}>
          {doctorMenu.map((item) => {
            if (!item.children) {
              return (
                <div key={`desktop-${item.id}`} className="relative group">
                  <Link
                    href={item.href!}
                    onClick={handleTabChange}
                    onMouseEnter={(e) => { setHoveredItem(item.id); if (isCollapsed) enterFlyout(item.id, e); }}
                    onMouseLeave={() => { setHoveredItem(null); if (isCollapsed) leaveFlyout(); }}
                    className={`w-full relative transition-all duration-300 min-h-[48px] border-0 outline-none focus:outline-none will-change-transform block ${activeTab === item.id ? "transform scale-105" : "hover:scale-102"}`}
                    aria-label={item.title}
                  >
                    <div
                      className={`relative flex items-center gap-4 ${isCollapsed ? 'justify-center px-3 py-2' : 'px-4 py-2.5 2xl:py-4'} rounded-2xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${activeTab === item.id ? 'text-white shadow-2xl font-semibold' : 'backdrop-blur-sm'}`}
                      style={activeTab === item.id ? { background: 'rgba(55,114,255,0.15)', border: '1px solid rgba(55,114,255,0.4)', boxShadow: '0 0 20px rgba(55,114,255,0.2)' } : { background: 'rgba(55,114,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onMouseEnter={(e) => { if (activeTab !== item.id) { e.currentTarget.style.background = 'rgba(55,114,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                      onMouseLeave={(e) => { if (activeTab !== item.id) { e.currentTarget.style.background = 'rgba(55,114,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                    >
                      {activeTab === item.id && <div className="absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-[0_0_6px_rgba(96,165,250,0.5)]"></div>}
                      <div className={`relative flex items-center justify-center ${isCollapsed ? 'w-6 h-6' : 'w-9 h-9'} rounded-xl transition-all duration-300`}
                           style={activeTab === item.id ? { background: 'rgba(255,255,255,0.2)' } : { background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                        <FontAwesomeIcon icon={item.icon} className={`${isCollapsed ? 'text-sm' : 'text-lg'} transition-all duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        {hoveredItem === item.id && <div className="absolute inset-0 rounded-xl opacity-30 blur-sm animate-pulse" style={{ background: `${item.color}33` }}></div>}
                      </div>
                      {!isCollapsed && <span className={`text-base transition-all duration-300 ${activeTab === item.id ? 'font-semibold text-white' : 'font-medium group-hover:text-white'}`}>{item.title}</span>}
                      {!isCollapsed && activeTab === item.id && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div></div>}
                      {isCollapsed && activeTab === item.id && <div className="absolute -right-1 top-1/2 -translate-y-1/2"><div className="w-[3px] h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.5)]"></div></div>}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    </div>
                  </Link>
                  {isCollapsed && openFlyout === item.id && typeof document !== "undefined" && createPortal(
                    <div onMouseEnter={() => enterFlyout(item.id)} onMouseLeave={leaveFlyout}
                         style={{ position: "fixed", top: flyoutAnchor.top, left: flyoutAnchor.left + 8, transform: "translateY(-50%)", zIndex: 9999 }}>
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 flex items-center gap-2.5 pl-1 pr-4 py-2.5 whitespace-nowrap">
                        <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              );
            }

            const isExpanded = expandedGroups.has(item.id);
            const hasActiveChild = item.children.some(c => activeTab === c.id);

            if (isCollapsed) {
              return (
                <div key={`desktop-${item.id}`} className="relative">
                  <Link
                    href={item.children[0].href}
                    onClick={handleTabChange}
                    onMouseEnter={(e) => enterFlyout(item.id, e)}
                    onMouseLeave={leaveFlyout}
                    className={`w-full relative transition-all duration-300 min-h-[48px] block will-change-transform ${hasActiveChild ? 'transform scale-105' : ''}`}
                    aria-label={item.title}
                  >
                    <div className="relative flex items-center justify-center px-3 py-2 rounded-2xl transition-all duration-300 overflow-hidden"
                      style={hasActiveChild ? { background: 'rgba(55,114,255,0.15)', border: '1px solid rgba(55,114,255,0.4)', boxShadow: '0 0 20px rgba(55,114,255,0.2)' } : { background: 'rgba(55,114,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onMouseEnter={(e) => { if (!hasActiveChild) { e.currentTarget.style.background = 'rgba(55,114,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                      onMouseLeave={(e) => { if (!hasActiveChild) { e.currentTarget.style.background = 'rgba(55,114,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                    >
                      <div className="relative flex items-center justify-center w-6 h-6 rounded-xl"
                           style={hasActiveChild ? { background: 'rgba(255,255,255,0.2)' } : { background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                        <FontAwesomeIcon icon={item.icon} className="text-sm" />
                      </div>
                      {hasActiveChild && <div className="absolute -right-1 top-1/2 -translate-y-1/2"><div className="w-[3px] h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.5)]"></div></div>}
                    </div>
                  </Link>
                  {openFlyout === item.id && typeof document !== "undefined" && createPortal(
                    <div onMouseEnter={() => enterFlyout(item.id)} onMouseLeave={leaveFlyout}
                         style={{ position: "fixed", top: flyoutAnchor.top, left: flyoutAnchor.left + 8, transform: "translateY(-50%)", zIndex: 9999 }}>
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[170px]">
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{item.title}</span>
                        </div>
                        {item.children.map(child => (
                          <Link key={child.id} href={child.href} onClick={() => { handleTabChange(); setOpenFlyout(null); }}
                                className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === child.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                 style={{ background: activeTab === child.id ? `${child.color}20` : '#f3f4f6' }}>
                              <FontAwesomeIcon icon={child.icon} className="text-xs" style={{ color: child.color }} />
                            </div>
                            <span className="text-sm">{child.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>, document.body
                  )}
                </div>
              );
            }

            return (
              <div key={`desktop-${item.id}`} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full group relative transition-all duration-300 min-h-[48px] border-0 outline-none focus:outline-none will-change-transform ${hasActiveChild ? 'transform scale-105' : 'hover:scale-102'}`}
                  aria-label={item.title}
                  aria-expanded={isExpanded}
                >
                  <div
                    className={`relative flex items-center gap-4 px-4 py-2.5 2xl:py-4 rounded-2xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${hasActiveChild ? 'text-white shadow-2xl font-semibold' : 'backdrop-blur-sm'}`}
                    style={hasActiveChild ? { background: 'rgba(55,114,255,0.15)', border: '1px solid rgba(55,114,255,0.4)', boxShadow: '0 0 20px rgba(55,114,255,0.2)' } : { background: 'rgba(55,114,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onMouseEnter={(e) => { if (!hasActiveChild) { e.currentTarget.style.background = 'rgba(55,114,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                    onMouseLeave={(e) => { if (!hasActiveChild) { e.currentTarget.style.background = 'rgba(55,114,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                  >
                    {hasActiveChild && <div className="absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-[0_0_6px_rgba(96,165,250,0.5)]"></div>}
                    <div className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300"
                         style={hasActiveChild ? { background: 'rgba(255,255,255,0.2)' } : { background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                      <FontAwesomeIcon icon={item.icon} className={`text-lg transition-all duration-300 ${hasActiveChild ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {hoveredItem === item.id && <div className="absolute inset-0 rounded-xl opacity-30 blur-sm animate-pulse" style={{ background: `${item.color}33` }}></div>}
                    </div>
                    <span className={`flex-1 text-left text-base transition-all duration-300 ${hasActiveChild ? 'font-semibold text-white' : 'font-medium group-hover:text-white'}`}>{item.title}</span>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <FontAwesomeIcon icon={faChevronRight} className={`text-xs ${hasActiveChild ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  </div>
                </button>
                <CollapsibleSubmenu isOpen={isExpanded}>
                  {item.children.map(child => renderSubItem(child, 'desktop'))}
                </CollapsibleSubmenu>
              </div>
            );
          })}
        </nav>

        <div className={`${isCollapsed ? 'px-2' : 'px-6'} py-4 2xl:py-6 relative z-10 flex-shrink-0`}>
          <button
            onClick={handleLogout}
            className={`w-full group relative overflow-hidden min-h-[48px] ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-5 py-4 justify-center gap-3'} rounded-2xl text-white font-semibold flex items-center transition-all duration-300 shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-95 border-0 outline-none focus:outline-none will-change-transform`}
            aria-label="Выйти из системы"
            style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)', border: '1px solid rgba(220,38,38,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)'; }}
            title={isCollapsed ? "Выйти" : undefined}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-lg group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
            {!isCollapsed && <span className="text-base">Выйти</span>}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.2) 100%)' }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
      </aside>
    </>
  );
};
