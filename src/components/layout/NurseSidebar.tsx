"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faSignOutAlt,
  faTimes,
  faBolt,
  faGem,
  faUser,
  faUserNurse,
} from "@fortawesome/free-solid-svg-icons";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NurseSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed?: boolean;
  }

export const NurseSidebar = ({
  isOpen,
  onClose,
  isCollapsed = false,
}: NurseSidebarProps) => {
  const { user, logoutUser, setIsAuthOpen } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!user) return null;

  const nurseMenu = [
    { id: "home-visits", icon: faHome, title: "Мои вызовы на дом", color: "#295bbf", href: "/nurse/home-visits" },
    { id: "profile", icon: faUser, title: "Профиль", color: "#3772ff", href: "/nurse/profile" },
  ];

  const activeTab = nurseMenu.find(item => pathname?.startsWith(item.href))?.id || "home-visits";

  const handleLogout = () => {
    toast.success("Вы успешно вышли!", { position: "top-right", autoClose: 1000 });
    setTimeout(() => {
      logoutUser();
      // Use window.location.href for reliable redirect to homepage
      window.location.href = "/";
    }, 1200);
  };

  const handleTabChange = () => {
    onClose();
    setSidebarOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "nurse": return faUserNurse;
      case "doctor": return faGem;
      case "admin": return faBolt;
      default: return faUser;
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case "nurse": return { bg: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)', border: 'rgba(55, 114, 255, 0.3)' };
      case "doctor": return { bg: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)', border: 'rgba(55, 114, 255, 0.3)' };
      case "admin": return { bg: 'linear-gradient(135deg, #3267e6 0%, #1e4099 100%)', border: 'rgba(50, 103, 230, 0.3)' };
      default: return { bg: 'linear-gradient(135deg, #295bbf 0%, #173373 100%)', border: 'rgba(41, 91, 191, 0.3)' };
    }
  };


  return (
    <>
      {/* Accessible Mobile & Tablet Overlay with blur */}
      {(sidebarOpen || isOpen) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer motion-reduce:transition-none"
          onClick={() => {
            setSidebarOpen(false);
            onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSidebarOpen(false);
              onClose();
            }
          }}
          aria-label="Закрыть меню навигации"
          role="button"
          tabIndex={0}
        />
      )}

      <aside
        className={`${
          sidebarOpen || isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed top-0 left-0 h-screen w-72 xs:w-76 text-white flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform z-50 shadow-2xl border-r border-white/10 backdrop-blur-xl will-change-transform overflow-x-hidden xl:hidden`}
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)
          `
        }}
      >
        {/* Optimized Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-24 h-24 xs:w-32 xs:h-32 rounded-full blur-xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.15) 0%, rgba(41, 53, 143, 0.1) 100%)', animationDuration: '4s' }}></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 xs:w-24 xs:h-24 rounded-full blur-lg animate-bounce" style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.2) 0%, rgba(30, 38, 62, 0.1) 100%)', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 xs:w-16 xs:h-16 rounded-full blur-md animate-ping" style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.25) 0%, transparent 70%)', animationDuration: '2s' }}></div>
        </div>

        {/* Enhanced Responsive Mobile/Tablet Header with Close Button Only */}
        <div className="flex justify-between items-center px-3 py-4 xs:px-4 xs:py-5 sm:px-6 sm:py-6 xl:hidden relative z-10 border-b border-white/10">
          {/* Mobile Logo Container */}
          <div className="relative group">
            <Link href="/" onClick={() => setSidebarOpen(false)} className="block outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 rounded-2xl">
              <div className="relative overflow-hidden rounded-2xl p-3 backdrop-blur-md border border-white/20 transition-all duration-500 group-hover:scale-105 group-hover:-rotate-1"
                   style={{
                     background: `
                       linear-gradient(135deg,
                         rgba(6, 182, 212, 0.15) 0%,
                         rgba(20, 184, 166, 0.1) 50%,
                         rgba(8, 145, 178, 0.05) 100%
                       )
                     `
                   }}>

                {/* Logo Image */}
                <div className="relative">
                  <Image
                    src={Logo}
                    alt="Logo"
                    width={100}
                    height={32}
                    priority
                    className="w-20 h-6 xs:w-24 xs:h-7 sm:w-28 sm:h-8 transition-all duration-500 group-hover:scale-110 drop-shadow-lg"
                  />

                  {/* Animated glow behind logo */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-600/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                </div>

                {/* Shimmer overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1200 ease-out"></div>

                {/* Subtle border glow */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/30 transition-all duration-500"></div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/20 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </Link>

            {/* Floating particles effect */}
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute -bottom-2 -right-1 w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Enhanced Close Button */}
          <div className="relative group">
            <button
              onClick={() => {
                setSidebarOpen(false);
                onClose();
              }}
              className="relative min-w-[48px] min-h-[48px] p-3 xs:p-3.5 sm:p-4 rounded-xl xs:rounded-2xl backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 border-0 outline-none overflow-hidden flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              aria-label="Закрыть меню навигации"
              title="Закрыть меню"
              style={{
                background: `
                  linear-gradient(135deg,
                    rgba(239, 68, 68, 0.1) 0%,
                    rgba(220, 38, 38, 0.15) 50%,
                    rgba(185, 28, 28, 0.1) 100%
                  )
                `,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `
                  linear-gradient(135deg,
                    rgba(239, 68, 68, 0.2) 0%,
                    rgba(220, 38, 38, 0.25) 50%,
                    rgba(185, 28, 28, 0.2) 100%
                  )
                `;
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `
                  linear-gradient(135deg,
                    rgba(239, 68, 68, 0.1) 0%,
                    rgba(220, 38, 38, 0.15) 50%,
                    rgba(185, 28, 28, 0.1) 100%
                  )
                `;
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <FontAwesomeIcon
                icon={faTimes}
                className="text-lg xs:text-xl text-red-400 group-hover:text-red-300 transition-all duration-300 drop-shadow-sm relative z-10"
                aria-hidden="true"
              />

              {/* Ripple effect on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)' }}></div>

              {/* Cross animation lines */}
              <div className="absolute top-1/2 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-45 group-hover:w-8 transition-all duration-300"></div>
              <div className="absolute top-1/2 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent transform -translate-x-1/2 -translate-y-1/2 -rotate-45 group-hover:w-8 transition-all duration-300"></div>
            </button>

            {/* Button glow effect */}
            <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
          </div>
        </div>

        {/* Desktop Logo - Hidden on mobile/tablet, shown only on XL screens and above */}
        <div className={`hidden xl:flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'justify-center px-4 py-6 md:px-6 md:py-8'} relative z-10 overflow-hidden`}>
          <Link href="/" className="group relative outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 rounded-2xl">
            <div className={`relative overflow-hidden rounded-2xl ${isCollapsed ? 'p-2' : 'p-4'} backdrop-blur-sm border border-white/10`} style={{ background: 'rgba(55, 114, 255, 0.05)' }}>
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-md"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                  Z
                </div>
              ) : (
                <Image
                  src={Logo}
                  alt="Logo"
                  width={280}
                  height={55}
                  priority
                  className="w-auto h-12 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </div>
          </Link>
        </div>

        {/* Responsive User Info */}
        <div className={`${isCollapsed ? 'px-2 py-4' : 'px-3 py-4 xs:px-4 xs:py-5 sm:px-6 sm:py-6'} text-center relative z-10`}>
          <div className="relative group mb-4 flex justify-center">
            <div className={`relative ${isCollapsed ? 'w-10 h-10' : 'w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20'} rounded-xl xs:rounded-2xl flex items-center justify-center ${isCollapsed ? 'text-sm' : 'text-xl xs:text-2xl sm:text-2xl'} font-bold shadow-2xl transform group-hover:scale-110 transition-all duration-300 border-2 backdrop-blur-sm`}
                 style={{
                   background: getRoleGradient(user.role).bg,
                   borderColor: getRoleGradient(user.role).border
                 }}>
              <span className="relative z-10 text-white drop-shadow-lg">
                {user.first_name.charAt(0)}
              </span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="absolute -inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Status indicator - online/offline only */}
              <div className={`absolute -bottom-0.5 -right-0.5 xs:-bottom-1 xs:-right-1 ${isCollapsed ? 'w-3 h-3' : 'w-5 h-5 xs:w-6 xs:h-6 sm:w-6 sm:h-6'} bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                <div className={`${isCollapsed ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3 sm:h-3'} bg-emerald-400 rounded-full animate-pulse`}></div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet/iPad Pro view - always show full info */}
          <div className="block xl:hidden">
            <div className={`inline-flex items-center gap-1.5 xs:gap-2 px-2 py-1 xs:px-3 xs:py-1.5 rounded-lg xs:rounded-xl shadow-lg border backdrop-blur-sm mb-2 xs:mb-3 text-xs font-bold uppercase tracking-wide`}
                 style={{
                   background: getRoleGradient(user.role).bg,
                   borderColor: getRoleGradient(user.role).border
                 }}>
              <FontAwesomeIcon icon={getRoleIcon(user.role)} className="text-xs" />
              <span>Медсестра</span>
            </div>

            <h2 className="text-base xs:text-lg font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-xs text-gray-300 break-words opacity-80 leading-relaxed px-2 xs:px-0">{user.email}</p>
          </div>

          {/* XL screens and above - conditional based on collapsed state */}
          <div className="hidden xl:block">
            {!isCollapsed && (
              <>
                <div className={`inline-flex items-center gap-1.5 xs:gap-2 px-2 py-1 xs:px-3 xs:py-1.5 rounded-lg xs:rounded-xl shadow-lg border backdrop-blur-sm mb-2 xs:mb-3 text-xs font-bold uppercase tracking-wide`}
                     style={{
                       background: getRoleGradient(user.role).bg,
                       borderColor: getRoleGradient(user.role).border
                     }}>
                  <FontAwesomeIcon icon={getRoleIcon(user.role)} className="text-xs" />
                  <span>Медсестра</span>
                </div>

                <h2 className="text-base xs:text-lg font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-xs text-gray-300 break-words opacity-80 leading-relaxed px-2 xs:px-0">{user.email}</p>
              </>
            )}
          </div>
        </div>


        {/* Responsive Navigation */}
        <nav className={`mt-2 space-y-2 xs:space-y-3 ${isCollapsed ? 'px-2' : 'px-3 xs:px-4 sm:px-6'} flex-1 overflow-y-auto overflow-x-hidden relative z-10`}>
          {nurseMenu.map((item, index) => (
            <div key={item.id} className="relative">
              <Link
                href={item.href}
                onClick={handleTabChange}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full group relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[48px] border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform block ${
                  activeTab === item.id
                    ? "transform scale-105"
                    : "hover:scale-102"
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
                title={isCollapsed ? item.title : undefined}
                aria-label={item.title}
                role="tab"
                aria-selected={activeTab === item.id}
              >
                <div className={`relative flex items-center gap-3 px-3 py-3 xs:gap-4 xs:px-4 xs:py-4 ${isCollapsed ? 'sm:justify-center sm:gap-0 sm:px-3 sm:py-3' : 'sm:gap-4 sm:px-5 sm:py-4'} rounded-xl xs:rounded-2xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  activeTab === item.id
                    ? `text-white shadow-2xl font-semibold`
                    : "backdrop-blur-sm"
                }`}
                     style={activeTab === item.id
                       ? {
                           background: `rgba(55, 114, 255, 0.15)`,
                           border: '1px solid rgba(55, 114, 255, 0.4)',
                           boxShadow: '0 0 20px rgba(55, 114, 255, 0.2)',
                         }
                       : {
                           background: 'rgba(55, 114, 255, 0.05)',
                           border: '1px solid rgba(255, 255, 255, 0.1)'
                         }
                     }
                     onMouseEnter={(e) => {
                       if (activeTab !== item.id) {
                         e.currentTarget.style.background = 'rgba(55, 114, 255, 0.1)';
                         e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                       }
                     }}
                     onMouseLeave={(e) => {
                       if (activeTab !== item.id) {
                         e.currentTarget.style.background = 'rgba(55, 114, 255, 0.05)';
                         e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                       }
                     }}>

                  {/* Left accent border for active item */}
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-sm"></div>
                  )}

                  {/* Icon container */}
                  <div className={`relative flex items-center justify-center ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8 xs:w-10 xs:h-10 sm:w-10 sm:h-10'} rounded-lg xs:rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "text-white shadow-lg"
                      : ""
                  }`}
                       style={activeTab === item.id
                         ? { background: 'rgba(255, 255, 255, 0.2)' }
                         : { background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)' }
                       }>
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`${isCollapsed ? 'text-sm' : 'text-base xs:text-lg sm:text-lg'} transition-all duration-300 ${
                        activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />

                    {/* Glow effect - contained within icon */}
                    {hoveredItem === item.id && (
                      <div className={`absolute inset-0 rounded-xl opacity-30 blur-sm animate-pulse`}
                           style={{ background: `${item.color}33` }}></div>
                    )}
                  </div>

                  {/* Mobile/Tablet/iPad Pro text - always show up to XL */}
                  <div className="block xl:hidden">
                    <span className={`text-sm xs:text-base transition-all duration-300 ${
                      activeTab === item.id
                        ? "font-semibold text-white"
                        : "font-medium group-hover:text-white"
                    }`}>
                      {item.title}
                    </span>

                    {/* Active indicator */}
                    {activeTab === item.id && (
                      <div className="absolute right-2 xs:right-4 top-1/2 -translate-y-1/2">
                        <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>

                  {/* XL screens and above text - only show when not collapsed */}
                  {!isCollapsed && (
                    <div className="hidden xl:block">
                      <span className={`text-sm xs:text-base transition-all duration-300 ${
                        activeTab === item.id
                          ? "font-semibold text-white"
                          : "font-medium group-hover:text-white"
                      }`}>
                        {item.title}
                      </span>

                      {/* Active indicator */}
                      {activeTab === item.id && (
                        <div className="absolute right-2 xs:right-4 top-1/2 -translate-y-1/2">
                          <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active indicator for collapsed state */}
                  {isCollapsed && activeTab === item.id && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2">
                      <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg"></div>
                    </div>
                  )}

                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                </div>
              </Link>

              {/* Tooltip for collapsed state - only on XL screens and above */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] whitespace-nowrap hidden xl:block top-1/2 -translate-y-1/2">
                  {item.title}
                  {/* Tooltip arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Responsive Logout Button */}
        <div className={`${isCollapsed ? 'px-2' : 'px-3 xs:px-4 sm:px-6'} py-4 xs:py-6 relative z-10`}>
          <button
            onClick={handleLogout}
            className={`w-full group relative overflow-hidden min-h-[48px] ${isCollapsed ? 'px-3 py-3' : 'px-3 py-3 xs:px-4 xs:py-4 sm:px-5 sm:py-4'} rounded-xl xs:rounded-2xl text-white font-semibold flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2 xs:gap-3 sm:gap-3'} transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-95 border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0`}
            aria-label="Выйти из системы"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)';
            }}
            title={isCollapsed ? "Выйти" : undefined}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              className="text-base xs:text-lg group-hover:rotate-12 transition-transform duration-300"
              aria-hidden="true"
            />
            {!isCollapsed && (
              <span className="text-sm xs:text-base">Выйти</span>
            )}

            {/* Animated background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)' }}></div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>
        </div>

        {/* Premium Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
      </aside>

      {/* Desktop Sidebar - Always visible on XL screens (1280px+) and above */}
      <aside
        className={`hidden xl:flex fixed top-0 left-0 h-screen ${isCollapsed ? "w-20" : "w-80"} text-white flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 shadow-2xl border-r border-white/10 backdrop-blur-xl will-change-transform overflow-x-hidden`}
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)
          `
        }}
      >
        {/* Optimized Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-24 h-24 xs:w-32 xs:h-32 rounded-full blur-xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.15) 0%, rgba(41, 53, 143, 0.1) 100%)', animationDuration: '4s' }}></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 xs:w-24 xs:h-24 rounded-full blur-lg animate-bounce" style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.2) 0%, rgba(30, 38, 62, 0.1) 100%)', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 xs:w-16 xs:h-16 rounded-full blur-md animate-ping" style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.25) 0%, transparent 70%)', animationDuration: '2s' }}></div>
        </div>

        {/* Desktop Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'justify-center px-6 py-8'} relative z-10 overflow-hidden`}>
          <Link href="/" className="group relative outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 rounded-2xl">
            <div className={`relative overflow-hidden rounded-2xl ${isCollapsed ? 'p-2' : 'p-4'} backdrop-blur-sm border border-white/10`} style={{ background: 'rgba(55, 114, 255, 0.05)' }}>
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-md"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                  Z
                </div>
              ) : (
                <Image
                  src={Logo}
                  alt="Logo"
                  width={280}
                  height={55}
                  priority
                  className="w-auto h-12 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </div>
          </Link>
        </div>

        {/* Desktop User Info */}
        <div className={`${isCollapsed ? 'px-2 py-4' : 'px-6 py-6'} text-center relative z-10`}>
          <div className="relative group mb-4 flex justify-center">
            <div className={`relative ${isCollapsed ? 'w-10 h-10' : 'w-20 h-20'} rounded-2xl flex items-center justify-center ${isCollapsed ? 'text-sm' : 'text-2xl'} font-bold shadow-2xl transform group-hover:scale-110 transition-all duration-300 border-2 backdrop-blur-sm`}
                 style={{
                   background: getRoleGradient(user.role).bg,
                   borderColor: getRoleGradient(user.role).border
                 }}>
              <span className="relative z-10 text-white drop-shadow-lg">
                {user.first_name.charAt(0)}
              </span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="absolute -inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Status indicator - online */}
              <div className={`absolute -bottom-1 -right-1 ${isCollapsed ? 'w-3 h-3' : 'w-6 h-6'} bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                <div className={`${isCollapsed ? 'w-1.5 h-1.5' : 'w-3 h-3'} bg-emerald-400 rounded-full animate-pulse`}></div>
              </div>
            </div>
          </div>

          {/* Desktop User Info - conditional based on collapsed state */}
          {!isCollapsed && (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-lg border backdrop-blur-sm mb-3 text-xs font-bold uppercase tracking-wide"
                   style={{
                     background: getRoleGradient(user.role).bg,
                     borderColor: getRoleGradient(user.role).border
                   }}>
                <FontAwesomeIcon icon={getRoleIcon(user.role)} className="text-xs" />
                <span>Медсестра</span>
              </div>

              <h2 className="text-lg font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-xs text-gray-300 break-words opacity-80 leading-relaxed">{user.email}</p>
            </>
          )}
        </div>


        {/* Desktop Navigation */}
        <nav className={`mt-2 space-y-3 ${isCollapsed ? 'px-2' : 'px-6'} flex-1 overflow-y-auto overflow-x-hidden relative z-10`}>
          {nurseMenu.map((item, index) => (
            <div key={`desktop-${item.id}`} className="relative">
              <Link
                href={item.href}
                onClick={handleTabChange}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full group relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[48px] border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform block ${
                  activeTab === item.id
                    ? "transform scale-105"
                    : "hover:scale-102"
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
                title={isCollapsed ? item.title : undefined}
                aria-label={item.title}
                role="tab"
                aria-selected={activeTab === item.id}
              >
                <div className={`relative flex items-center gap-4 ${isCollapsed ? 'justify-center px-3 py-3' : 'px-5 py-4'} rounded-2xl text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  activeTab === item.id
                    ? `text-white shadow-2xl font-semibold`
                    : "backdrop-blur-sm"
                }`}
                     style={activeTab === item.id
                       ? {
                           background: `rgba(55, 114, 255, 0.15)`,
                           border: '1px solid rgba(55, 114, 255, 0.4)',
                           boxShadow: '0 0 20px rgba(55, 114, 255, 0.2)',
                         }
                       : {
                           background: 'rgba(55, 114, 255, 0.05)',
                           border: '1px solid rgba(255, 255, 255, 0.1)'
                         }
                     }
                     onMouseEnter={(e) => {
                       if (activeTab !== item.id) {
                         e.currentTarget.style.background = 'rgba(55, 114, 255, 0.1)';
                         e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                       }
                     }}
                     onMouseLeave={(e) => {
                       if (activeTab !== item.id) {
                         e.currentTarget.style.background = 'rgba(55, 114, 255, 0.05)';
                         e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                       }
                     }}>

                  {/* Left accent border for active item */}
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-sm"></div>
                  )}

                  {/* Icon container */}
                  <div className={`relative flex items-center justify-center ${isCollapsed ? 'w-6 h-6' : 'w-10 h-10'} rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "text-white shadow-lg"
                      : ""
                  }`}
                       style={activeTab === item.id
                         ? { background: 'rgba(255, 255, 255, 0.2)' }
                         : { background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)' }
                       }>
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`${isCollapsed ? 'text-sm' : 'text-lg'} transition-all duration-300 ${
                        activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />

                    {/* Glow effect - contained within icon */}
                    {hoveredItem === item.id && (
                      <div className={`absolute inset-0 rounded-xl opacity-30 blur-sm animate-pulse`}
                           style={{ background: `${item.color}33` }}></div>
                    )}
                  </div>

                  {/* Desktop text - only show when not collapsed */}
                  {!isCollapsed && (
                    <span className={`text-base transition-all duration-300 ${
                      activeTab === item.id
                        ? "font-semibold text-white"
                        : "font-medium group-hover:text-white"
                    }`}>
                      {item.title}
                    </span>
                  )}

                  {/* Active indicator for collapsed state */}
                  {isCollapsed && activeTab === item.id && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2">
                      <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg"></div>
                    </div>
                  )}

                  {/* Active indicator for normal state */}
                  {!isCollapsed && activeTab === item.id && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}

                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                </div>
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] whitespace-nowrap top-1/2 -translate-y-1/2">
                  {item.title}
                  {/* Tooltip arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Desktop Logout Button */}
        <div className={`${isCollapsed ? 'px-2' : 'px-6'} py-6 relative z-10`}>
          <button
            onClick={handleLogout}
            className={`w-full group relative overflow-hidden min-h-[48px] ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-5 py-4 justify-center gap-3'} rounded-2xl text-white font-semibold flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-95 border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform`}
            aria-label="Выйти из системы"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)';
            }}
            title={isCollapsed ? "Выйти" : undefined}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              className="text-lg group-hover:rotate-12 transition-transform duration-300"
              aria-hidden="true"
            />
            {!isCollapsed && (
              <span className="text-base">Выйти</span>
            )}

            {/* Animated background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)' }}></div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>
        </div>

        {/* Premium Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
      </aside>
    </>
  );
};
