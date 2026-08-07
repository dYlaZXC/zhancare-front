"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import {
  faSignOutAlt,
  faUser,
  faChevronDown,
  faCog,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { computeRole } from "@/context/AuthContext";

type Props = {
  user: {
    first_name: string;
    last_name?: string;
    role?: string;
    roles?: string[];
    email?: string;
    avatar?: string | null;
  };
  onLogout: () => void;
  disableClickOutside?: boolean;
  isMobile?: boolean;
};

export default function UserDropdown({ user, onLogout, disableClickOutside = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
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
          nurse: "Медсестра",
          admin: "Администратор",
          academyAdmin: "Администратор академии",
          teacher: "Преподаватель",
          student: "Студент",
          doctorProfileDesc: "Личная информация",
          personalInfoDesc: "Личная информация",
          nurseProfileDesc: "Личная информация",
          statisticsDesc: "Статистика и аналитика",
          doctorScheduleDesc: "Мои записи к врачам",
          patientAppointmentsDesc: "Мои записи к врачам",
          nurseScheduleDesc: "Мои вызовы на дом",
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
          nurse: "Медбике",
          admin: "Әкімші",
          academyAdmin: "Академия әкімшісі",
          teacher: "Оқытушы",
          student: "Студент",
          doctorProfileDesc: "Жеке ақпарат",
          personalInfoDesc: "Жеке ақпарат",
          nurseProfileDesc: "Жеке ақпарат",
          statisticsDesc: "Статистика және аналитика",
          doctorScheduleDesc: "Дәрігерге жазылуларым",
          patientAppointmentsDesc: "Дәрігерге жазылуларым",
          nurseScheduleDesc: "Үйге шақырулар",
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
          nurse: "Nurse",
          admin: "Administrator",
          academyAdmin: "Academy Administrator",
          teacher: "Teacher",
          student: "Student",
          doctorProfileDesc: "Personal information",
          personalInfoDesc: "Personal information",
          nurseProfileDesc: "Personal information",
          statisticsDesc: "Statistics and analytics",
          doctorScheduleDesc: "My doctor appointments",
          patientAppointmentsDesc: "My doctor appointments",
          nurseScheduleDesc: "My home visits",
          accountSettingsDesc: "Account settings",
          endSessionDesc: "End session"
        };
      case "uz":
        return {
          profile: "Shaxsiy kabinet",
          dashboard: "Boshqaruv paneli",
          appointments: "Yozilishlar",
          settings: "Sozlamalar",
          logout: "Chiqish",
          online: "Onlayn",
          doctor: "Shifokor",
          patient: "Bemor",
          nurse: "Hamshira",
          admin: "Administrator",
          academyAdmin: "Akademiya administratori",
          teacher: "O'qituvchi",
          student: "Talaba",
          doctorProfileDesc: "Shaxsiy ma'lumotlar",
          personalInfoDesc: "Shaxsiy ma'lumotlar",
          nurseProfileDesc: "Shaxsiy ma'lumotlar",
          statisticsDesc: "Statistika va tahlil",
          doctorScheduleDesc: "Shifokorga yozilishlarim",
          patientAppointmentsDesc: "Shifokorga yozilishlarim",
          nurseScheduleDesc: "Uyga chaqiruvlarim",
          accountSettingsDesc: "Hisob sozlamalari",
          endSessionDesc: "Seansni yakunlash"
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
          nurse: "Nurse",
          admin: "Administrator",
          academyAdmin: "Academy Administrator",
          teacher: "Teacher",
          student: "Student",
          doctorProfileDesc: "Personal information",
          personalInfoDesc: "Personal information",
          nurseProfileDesc: "Personal information",
          statisticsDesc: "Statistics and analytics",
          doctorScheduleDesc: "My doctor appointments",
          patientAppointmentsDesc: "My doctor appointments",
          nurseScheduleDesc: "My home visits",
          accountSettingsDesc: "Account settings",
          endSessionDesc: "End session"
        };
    }
  };

  const t = getTranslations();

  const roleLabels: Record<string, string> = {
    admin: t.admin,
    academy_admin: t.academyAdmin,
    doctor: t.doctor,
    nurse: t.nurse,
    teacher: t.teacher,
    patient: t.patient,
    student: t.student,
  };

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

  const hasRole = (r: string) => !!user.roles?.includes(r);

  // Get profile path based on role
  const getProfilePath = () => {
    if (hasRole("doctor")) return "/doctor-profile";
    if (hasRole("nurse")) return "/nurse-profile";
    return "/profile"; // default for patients
  };

  // Menu items configuration with dynamic translations
  const getMenuItems = () => {
    // Get description based on role
    const getProfileDescription = () => {
      if (hasRole("doctor")) return t.doctorProfileDesc;
      if (hasRole("nurse")) return t.nurseProfileDesc;
      return t.personalInfoDesc;
    };

    const getAppointmentsHref = () => {
      if (hasRole("doctor")) return "/doctor-appointments";
      if (hasRole("nurse")) return "/nurse-profile"; // nurse home visits are in their profile
      return "/video";
    };

    const getAppointmentsDescription = () => {
      if (hasRole("doctor")) return t.doctorScheduleDesc;
      if (hasRole("nurse")) return t.nurseScheduleDesc;
      return t.patientAppointmentsDesc;
    };

    return [
      {
        icon: faUser,
        label: t.profile,
        href: getProfilePath(),
        description: getProfileDescription()
      },
      {
        icon: faCalendarAlt,
        label: t.appointments,
        href: getAppointmentsHref(),
        description: getAppointmentsDescription()
      },
      {
        icon: faCog,
        label: t.settings,
        href: "/settings",
        description: t.accountSettingsDesc,
        disabled: true
      }
    ];
  };

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

  return (
    <div className="relative" ref={dropdownRef} data-user-dropdown="container">
      {/* User Button - Compact & Responsive */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="group bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white rounded-xl p-2 sm:px-3 sm:py-2 flex items-center gap-2 hover:from-[#2956bf] hover:to-[#1e3a8a] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3772ff]/30 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {user.avatar && !avatarBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={`${user.first_name} avatar`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/30"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-xs sm:text-sm font-bold">
              {getUserInitials() || <FontAwesomeIcon icon={faUser} className="text-white text-xs" />}
            </div>
          )}

          {/* Online status indicator */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full ring-2 ring-white shadow-sm"></div>
        </div>

        {/* User info - Always visible */}
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="text-xs sm:text-sm font-semibold truncate max-w-[60px] sm:max-w-[100px]">
            {user.first_name}
          </span>
          <span className="text-[10px] sm:text-xs text-white/80 truncate">
            {roleLabels[computeRole(user.roles ?? (user.role ? [user.role] : []))] ?? t.patient}
          </span>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className="text-[10px] sm:text-xs text-white/90"
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
            className="absolute right-0 mt-2 w-[280px] sm:w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 z-50"
          >
            {/* Header - Name Only */}
            <div className="bg-gradient-to-r from-[#3772ff]/5 to-[#2956bf]/5 p-3 sm:p-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {user.first_name} {user.last_name || ''}
                </h3>
                {user.email && (
                  <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] sm:text-xs text-green-600 font-medium">{t.online}</span>
                </div>
              </div>
            </div>

            {/* Menu Items - Simplified */}
            <div className="py-1">
              {menuItems.map((item) =>
                item.disabled ? (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 cursor-not-allowed opacity-45 select-none"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={item.icon} className="text-sm text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-400 text-sm">{item.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Скоро</span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{item.description}</div>
                    </div>
                  </div>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 group-hover:bg-[#3772ff]/10 flex items-center justify-center transition-colors duration-150 shrink-0">
                      <FontAwesomeIcon
                        icon={item.icon}
                        className="text-sm text-gray-600 group-hover:text-[#3772ff] transition-colors duration-150"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm group-hover:text-[#3772ff] transition-colors">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    </div>
                  </a>
                )
              )}
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-100 p-1.5">
              <button
                onClick={onLogout}
                className="group w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-red-50 transition-colors duration-150 rounded-xl"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors duration-150 shrink-0">
                  <FontAwesomeIcon
                    icon={faSignOutAlt}
                    className="text-sm text-red-500 group-hover:text-red-600 transition-colors duration-150"
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-red-600 text-sm group-hover:text-red-700 transition-colors">
                    {t.logout}
                  </div>
                  <div className="text-xs text-red-400 truncate">
                    {t.endSessionDesc}
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
