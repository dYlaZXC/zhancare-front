"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSignOutAlt, 
  faUser, 
  faChevronDown,
  faCog,
  faChartLine,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  user: {
    first_name: string;
    last_name?: string;
    role: string;
    email?: string;
    avatar?: string;
  };
  onLogout: () => void;
  disableClickOutside?: boolean;
  isMobile?: boolean;
};

export default function UserDropdown({ user, onLogout, disableClickOutside = false, isMobile = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { language } = useLanguage();

  // Multi-language translations
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return {
          profile: "Личный кабинет",
          dashboard: "Панель управления", 
          appointments: "Записи",
          settings: "Настройки",
          logout: "Выйти",
          online: "В сети",
          doctor: "Врач",
          patient: "Пациент",
          doctorProfileDesc: "Управление профилем врача",
          personalInfoDesc: "Личная информация",
          statisticsDesc: "Статистика и аналитика",
          doctorScheduleDesc: "Управление расписанием",
          patientAppointmentsDesc: "Мои записи к врачам",
          accountSettingsDesc: "Настройки аккаунта",
          endSessionDesc: "Завершить сеанс"
        };
      case "kz":
        return {
          profile: "Жеке кабинет",
          dashboard: "Басқару панелі",
          appointments: "Жазылулар",
          settings: "Баптаулар", 
          logout: "Шығу",
          online: "Желіде",
          doctor: "Дәрігер",
          patient: "Пациент",
          doctorProfileDesc: "Дәрігер профилін басқару",
          personalInfoDesc: "Жеке ақпарат",
          statisticsDesc: "Статистика және аналитика",
          doctorScheduleDesc: "Кесте басқару",
          patientAppointmentsDesc: "Дәрігерге жазылуларым",
          accountSettingsDesc: "Аккаунт баптаулары",
          endSessionDesc: "Сеансты аяқтау"
        };
      case "en":
        return {
          profile: "Profile",
          dashboard: "Dashboard",
          appointments: "Appointments", 
          settings: "Settings",
          logout: "Sign Out",
          online: "Online",
          doctor: "Doctor",
          patient: "Patient",
          doctorProfileDesc: "Manage doctor profile",
          personalInfoDesc: "Personal information",
          statisticsDesc: "Statistics and analytics",
          doctorScheduleDesc: "Schedule management",
          patientAppointmentsDesc: "My doctor appointments",
          accountSettingsDesc: "Account settings",
          endSessionDesc: "End session"
        };
      default:
        return {
          profile: "Profile",
          dashboard: "Dashboard",
          appointments: "Appointments", 
          settings: "Settings",
          logout: "Sign Out",
          online: "Online",
          doctor: "Doctor",
          patient: "Patient",
          doctorProfileDesc: "Manage doctor profile",
          personalInfoDesc: "Personal information",
          statisticsDesc: "Statistics and analytics",
          doctorScheduleDesc: "Schedule management",
          patientAppointmentsDesc: "My doctor appointments",
          accountSettingsDesc: "Account settings",
          endSessionDesc: "End session"
        };
    }
  };

  const t = getTranslations();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen && !disableClickOutside) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    } else if (isOpen) {
      // Only add escape key listener when click outside is disabled
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, disableClickOutside]);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const firstName = user.first_name?.[0] || '';
    const lastName = user.last_name?.[0] || '';
    return (firstName + lastName).toUpperCase() || user.first_name?.[0]?.toUpperCase() || 'U';
  };

  // Get profile path based on role
  const getProfilePath = () => {
    return user.role === "doctor" ? "/doctor-profile" : "/profile";
  };

  // Menu items configuration with dynamic translations
  const getMenuItems = () => [
    {
      icon: faUser,
      label: t.profile,
      href: getProfilePath(),
      description: user.role === "doctor" ? t.doctorProfileDesc : t.personalInfoDesc
    },
    ...(user.role === "doctor" ? [{
      icon: faChartLine,
      label: t.dashboard,
      href: "/doctor-dashboard", 
      description: t.statisticsDesc
    }] : []),
    {
      icon: faCalendarAlt,
      label: t.appointments,
      href: user.role === "doctor" ? "/doctor-appointments" : "/my-appointments",
      description: user.role === "doctor" ? t.doctorScheduleDesc : t.patientAppointmentsDesc
    },
    {
      icon: faCog,
      label: t.settings,
      href: "/settings",
      description: t.accountSettingsDesc
    }
  ];

  const menuItems = getMenuItems();

  // Animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15 }
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2
      }
    })
  };

  return (
    <div className="relative" ref={dropdownRef} data-user-dropdown="container" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* User Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`group bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-lg px-4 py-2 flex items-center gap-3 hover:from-[#0029A3] hover:to-[#4A5DFF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 relative overflow-hidden ${isMobile ? 'min-w-0 w-full' : 'min-w-[140px]'}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear"
          }}
        />

        {/* Avatar */}
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.first_name} avatar`}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-semibold">
              {getUserInitials()}
            </div>
          )}
          
          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
        </div>

        {/* User info */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-sm font-medium truncate max-w-[80px]">
            {user.first_name}
          </span>
          <span className="text-xs text-white/70 truncate">
            {user.role === "doctor" ? t.doctor : t.patient}
          </span>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className="text-xs text-white/80" 
          />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute ${isMobile ? 'left-0 right-0 mt-2' : 'right-0 mt-2'} ${isMobile ? 'w-full max-w-[calc(100vw-2rem)]' : 'w-72'} bg-white/95 backdrop-blur-xl text-gray-800 shadow-2xl rounded-xl overflow-hidden border border-white/20 ${isMobile ? 'z-[10001]' : 'z-50'}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001E80]/10 to-[#3A50FF]/10 p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.first_name} avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] flex items-center justify-center text-white font-semibold">
                    {getUserInitials()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.first_name} {user.last_name || ''}
                  </h3>
                  {user.email && (
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">{t.online}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="group block px-4 py-3 hover:bg-gray-50 transition-colors duration-150 border-l-4 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors duration-150">
                      <FontAwesomeIcon 
                        icon={item.icon} 
                        className="text-gray-600 group-hover:text-blue-600 transition-colors duration-150"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 group-hover:text-blue-900">
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-100 p-2">
              <motion.button
                onClick={onLogout}
                custom={menuItems.length}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="group w-full text-left px-4 py-3 hover:bg-red-50 transition-colors duration-150 rounded-lg flex items-center gap-3"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors duration-150">
                  <FontAwesomeIcon 
                    icon={faSignOutAlt} 
                    className="text-red-500 group-hover:text-red-600 transition-colors duration-150"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-red-600 group-hover:text-red-700">
                    {t.logout}
                  </div>
                  <div className="text-sm text-red-400">
                    {t.endSessionDesc}
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}