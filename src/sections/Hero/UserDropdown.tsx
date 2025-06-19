"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMd, faSignOutAlt, faUser } from "@fortawesome/free-solid-svg-icons";

type Props = {
  user: {
    first_name: string;
    role: string;
  };
  onLogout: () => void;
};

export default function UserDropdown({ user, onLogout }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-lg px-5 py-2 flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faUserMd} className="text-xl" />
        {user.first_name}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg overflow-hidden">
          <a
            href={user.role === "doctor" ? "/doctor-profile" : "/profile"}
            className="block px-4 py-3 hover:bg-gray-200 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faUser} />
            Личный кабинет
          </a>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-3 hover:bg-gray-200 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
