"use client";

import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBell, faUserMd } from "@fortawesome/free-solid-svg-icons";

export const DoctorHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="flex justify-between items-center bg-white border-b p-4 shadow-sm sticky top-0 z-30">
      {/* Left - Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="sm:hidden bg-[#001E80] text-white p-2 rounded-md shadow-md"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          {/* <Image src={Logo} alt="Logo" width={140} height={40} priority />
          <span className="text-[#001E80] font-semibold text-lg">
            Панель Доктора
          </span> */}
        </div>
      </div>

      {/* Right - Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative text-gray-500 hover:text-[#001E80] transition">
          <FontAwesomeIcon icon={faBell} className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Doctor Name */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {/* <FontAwesomeIcon icon={faUserMd} className="text-[#001E80]" /> */}
          {/* <span className="font-semibold">{user.first_name} {user.last_name}</span> */}
        </div>
      </div>
    </header>
  );
};
