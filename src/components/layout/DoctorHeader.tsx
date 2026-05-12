"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, 
  faBell,
  faUserMd,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faExpand,
  faCompress
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import DoctorAvailabilityToggle from "@/components/doctor/DoctorAvailabilityToggle";
import { api } from "@/utils/api";
import { websocketService } from "@/services/websocketService";

interface DoctorHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const DoctorHeader = ({ 
  onMenuClick, 
  sidebarCollapsed = false, 
  onToggleSidebar 
}: DoctorHeaderProps) => {
  const { user, isDoctor } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline' | 'break'>('offline');
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Fetch current doctor availability status on mount
  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (!user || !isDoctor) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const response = await api.get('/user-profile/profile/');
        const profileData = response.data;

        const status = profileData.profiles?.doctor?.availability_status
          || profileData.profiles?.nurse?.availability_status
          || profileData.availability_status
          || 'offline';
        setAvailabilityStatus(status as 'available' | 'busy' | 'offline' | 'break');
      } catch (error) {
        console.error('Failed to fetch current availability status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchCurrentStatus();
  }, [user]);

  // Connect WebSocket and listen for availability changes
  useEffect(() => {
    if (!user || !isDoctor) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) websocketService.connect(token).catch(() => {});

    const handleAvailabilityChange = (data: any) => {
      if (data.data && data.data.doctor_id === user.id) {
        setAvailabilityStatus(data.data.availability_status);
      }
    };

    websocketService.onDoctorAvailabilityChanged(handleAvailabilityChange);
    return () => websocketService.offDoctorAvailabilityChanged(handleAvailabilityChange);
  }, [user, isDoctor]);

  const getAvailabilityStatusInfo = (status: typeof availabilityStatus) => {
    switch (status) {
      case 'available':
        return { color: 'bg-green-500', text: 'Доступен', textColor: 'text-green-700' };
      case 'busy':
        return { color: 'bg-yellow-500', text: 'Занят', textColor: 'text-yellow-700' };
      case 'break':
        return { color: 'bg-blue-500', text: 'На перерыве', textColor: 'text-blue-700' };
      case 'offline':
      default:
        return { color: 'bg-red-500', text: 'Не работает', textColor: 'text-red-700' };
    }
  };

  if (!user) return null;

  return (
    <header className="flex justify-between items-center bg-white/95 backdrop-blur-lg border-b border-gray-200/50 p-4 shadow-lg sticky top-0 z-30 transition-all duration-300">
      {/* Left - Mobile Menu Button & Desktop Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile & Tablet Menu Button - Now Active */}
        <button
          onClick={onMenuClick}
          className="xl:hidden group relative overflow-hidden text-white min-w-[48px] min-h-[48px] p-3 rounded-xl xs:rounded-2xl shadow-2xl border-0 outline-none backdrop-blur-lg transform hover:scale-110 active:scale-95 transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; hover:rotate-3 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0"
          style={{ 
            background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          aria-label="Открыть меню навигации доктора"
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

        {/* Doctor Panel Title */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>
          <span className="text-lg font-bold text-gray-800">
            Панель доктора
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

        {/* User Quick Info with Availability Status */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowAvailabilityDropdown(!showAvailabilityDropdown)}
              className={`hidden md:flex items-center gap-3 px-3 py-2 rounded-xl border backdrop-blur-sm transition-all duration-200 cursor-pointer ${
                showAvailabilityDropdown
                  ? 'shadow-lg border-blue-300 scale-105'
                  : 'border-gray-200/50 hover:shadow-md hover:border-blue-200 hover:scale-102'
              }`}
              style={{
                background: showAvailabilityDropdown
                  ? 'linear-gradient(135deg, rgba(55, 114, 255, 0.08) 0%, rgba(41, 53, 143, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(41, 53, 143, 0.03) 100%)'
              }}
            >
              {/* Mini Avatar with Status Indicator */}
              <div className="relative">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                  {user.first_name.charAt(0)}
                </div>
                {/* Status Dot */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${getAvailabilityStatusInfo(availabilityStatus).color}`}>
                </div>
              </div>

              {/* User Info with Status */}
              <div className="text-right">
                <div className="text-sm font-bold text-gray-800 leading-tight">
                  {user.first_name} {user.last_name}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs font-medium text-gray-600 leading-tight capitalize">
                    Доктор
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isLoadingStatus ? 'bg-gray-100 text-gray-600' :
                    availabilityStatus === 'available' ? 'bg-green-100 text-green-700' :
                    availabilityStatus === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                    availabilityStatus === 'break' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {isLoadingStatus ? 'Загрузка...' : getAvailabilityStatusInfo(availabilityStatus).text}
                  </span>
                </div>
              </div>

              {/* Dropdown Arrow */}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-xs text-gray-500 transition-transform duration-200 ml-1 ${
                  showAvailabilityDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Enhanced Availability Dropdown */}
            {showAvailabilityDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAvailabilityDropdown(false)}
                />

                {/* Dropdown Content with Connection */}
                <div className="absolute top-full right-0 mt-1 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* Connection Triangle */}
                  <div className="relative">
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200 shadow-sm z-10"></div>
                  </div>

                  {/* Enhanced Dropdown Container */}
                  <div className="bg-white rounded-xl shadow-2xl border border-gray-200/50 backdrop-blur-lg p-1 min-w-[280px] transform transition-all duration-200 origin-top-right"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(55, 114, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                       }}>

                    {/* Header Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                             style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                          {user.first_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-xs text-gray-500">Статус доступности</p>
                        </div>
                      </div>
                    </div>

                    {/* Availability options — inline, no nested dropdown */}
                    <div className="p-2">
                      <DoctorAvailabilityToggle
                        inline
                        currentStatus={availabilityStatus}
                        doctorId={user?.id}
                        onStatusChange={(newStatus) => {
                          setAvailabilityStatus(newStatus as any);
                          setShowAvailabilityDropdown(false);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
