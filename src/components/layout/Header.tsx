"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, 
  faBell, 
  faChevronLeft, 
  faChevronRight,
  faExpand,
  faCompress
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header = ({ 
  onMenuClick, 
  sidebarCollapsed = false, 
  onToggleSidebar 
}: HeaderProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="flex justify-between items-center bg-white/95 backdrop-blur-lg p-4 shadow-lg sticky top-0 z-30 transition-all duration-300">
      {/* Left - Mobile Menu Button & Desktop Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile/Tablet/iPad Pro Menu Button - Active up to XL screens */}
        <button
          onClick={onMenuClick}
          className="xl:hidden group relative overflow-hidden text-white min-w-[48px] min-h-[48px] p-3 rounded-xl xs:rounded-2xl shadow-2xl border-0 outline-none backdrop-blur-lg transform hover:scale-110 active:scale-95 transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; hover:rotate-3 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0"
          style={{ 
            background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          aria-label="Открыть меню навигации"
          title="Открыть меню"
        >
          <FontAwesomeIcon 
            icon={faBars} 
            className="group-hover:rotate-180 transition-transform duration-500 text-sm xs:text-base" 
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl xs:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* Desktop Sidebar Toggle - Only visible on XL screens and above */}
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

        {/* Optional Logo/Title */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>
          <span className="text-lg font-bold text-gray-800">
            Личный кабинет
          </span>
        </div>
      </div>

      {/* Right - Notifications & User Info */}
      <div className="flex items-center gap-4">
        {/* Premium Notifications */}
        <button className="relative group p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200/50 backdrop-blur-sm"
                style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(41, 53, 143, 0.05) 100%)' }}>
          <FontAwesomeIcon 
            icon={faBell} 
            className="text-lg text-gray-600 group-hover:text-blue-600 transition-colors duration-300 group-hover:animate-pulse" 
          />
          
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg animate-pulse"
               style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            3
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(41, 53, 143, 0.1) 100%)' }}></div>
        </button>

        {/* User Quick Info */}
        {user && (
          <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200/50 backdrop-blur-sm"
               style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(41, 53, 143, 0.03) 100%)' }}>
            {/* Mini Avatar */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
              {user.first_name.charAt(0)}
            </div>
            
            {/* User Info */}
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800 leading-tight">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-xs font-medium text-gray-600 leading-tight capitalize">
                {user.role === "doctor" ? "Доктор" : user.role === "admin" ? "Администратор" : "Пациент"}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};