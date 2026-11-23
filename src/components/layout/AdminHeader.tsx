"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faBolt,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { PushNotificationsToggle } from "@/components/pwa/PushNotificationsToggle";

interface AdminHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const AdminHeader = ({
  onMenuClick,
  sidebarCollapsed = false,
  onToggleSidebar
}: AdminHeaderProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead } = useAdminNotifications();

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleNotificationClick = (n: { id: number; is_read: boolean; admin_task: number | null }) => {
    if (!n.is_read) markRead(n.id);
    setNotifOpen(false);
    if (n.admin_task) router.push("/admin/tasks");
  };

  const formatNotifTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!user) return null;

  return (
    <header className="flex justify-between items-center bg-gradient-to-r from-white via-[#F7F9FF] to-white backdrop-blur-lg border-b border-[#E3E9FB] rounded-b-2xl p-4 shadow-[0_4px_24px_-6px_rgba(41,53,143,0.18)] sticky top-0 z-30 transition-all duration-300">
      {/* Left - Mobile Menu Button & Desktop Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile & Tablet Menu Button - Now Active */}
        <button
          onClick={onMenuClick}
          className="xl:hidden group relative overflow-hidden text-white min-w-[48px] min-h-[48px] p-3 rounded-xl xs:rounded-2xl shadow-2xl border-0 outline-none backdrop-blur-lg transform hover:scale-110 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:rotate-3 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0"
          style={{
            background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          aria-label="Открыть меню навигации администратора"
          title="Открыть меню"
        >
          <FontAwesomeIcon
            icon={faBars}
            className="group-hover:rotate-180 transition-transform duration-500 text-sm xs:text-base"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl xs:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* Desktop Sidebar Toggle - Only visible on XL screens */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="hidden xl:flex items-center gap-2 group relative overflow-hidden px-4 py-2.5 rounded-xl shadow-md border transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: sidebarCollapsed
                ? 'linear-gradient(135deg, rgba(55, 114, 255, 0.15) 0%, rgba(41, 53, 143, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(41, 53, 143, 0.1) 100%)',
              borderColor: 'rgba(55, 114, 255, 0.2)'
            }}
          >
            {/* Icon Container */}
            <div className="relative flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300"
                 style={{
                   background: sidebarCollapsed
                     ? 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)'
                     : 'linear-gradient(135deg, rgba(55, 114, 255, 0.3) 0%, rgba(41, 53, 143, 0.3) 100%)'
                 }}>
              <FontAwesomeIcon
                icon={sidebarCollapsed ? faChevronRight : faChevronLeft}
                className={`text-xs transition-all duration-300 ${
                  sidebarCollapsed ? 'text-white' : 'text-blue-700'
                } group-hover:scale-110`}
              />
            </div>

            {/* Text Label */}
            <span className={`text-sm font-semibold transition-all duration-300 ${
              sidebarCollapsed ? 'text-blue-700' : 'text-gray-700'
            } group-hover:text-blue-800`}>
              {sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
            </span>

            {/* Animated Background */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.15) 0%, rgba(41, 53, 143, 0.15) 100%)' }}></div>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>
        )}

        {/* Admin Panel Title */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>
          <span className="text-lg font-bold text-gray-800">
            Панель администратора
          </span>
        </div>
      </div>

      {/* Right - Notifications & User Info */}
      <div className="flex items-center gap-4">
        {/* Premium Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen((v) => !v)}
                  className="relative group p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200/50 backdrop-blur-sm"
                  style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(41, 53, 143, 0.05) 100%)' }}>
            <FontAwesomeIcon
              icon={faBell}
              className={`text-lg text-gray-600 group-hover:text-blue-600 transition-colors duration-300 ${unreadCount > 0 ? 'group-hover:animate-pulse' : ''}`}
            />

            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                   style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(41, 53, 143, 0.1) 100%)' }}></div>
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-40">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">Уведомления</p>
              </div>
              <PushNotificationsToggle />
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8 px-4">Пока нет уведомлений</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <button key={n.id} onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">{formatNotifTime(n.created_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Quick Info */}
        {user && (
          <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200/50 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-blue-200"
               style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(41, 53, 143, 0.03) 100%)' }}>
            {/* Mini Avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md"
                   style={{ background: 'linear-gradient(135deg, #3267e6 0%, #1e4099 100%)' }}>
                {user.first_name.charAt(0)}
              </div>
              {/* Admin Badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center shadow-lg border-2 border-white bg-purple-500">
                <FontAwesomeIcon icon={faBolt} className="text-[6px] text-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800 leading-tight">
                {user.first_name} {user.last_name}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-medium text-gray-600 leading-tight capitalize">
                  Администратор
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
