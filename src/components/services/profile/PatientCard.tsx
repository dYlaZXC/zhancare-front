"use client";
import { motion } from "framer-motion";
import { User } from "./types";

interface PatientCardProps {
  user: User;
}

export const PatientCard = ({ user }: PatientCardProps) => {
  // Calculate age from birth_date
  const calculateAge = (birthDate: string) => {
    if (!birthDate || birthDate === "Не указано") return "Не указано";
    const birth = new Date(birthDate.split('.').reverse().join('-')); // Convert DD.MM.YYYY to YYYY-MM-DD
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user.birth_date || "Не указано");
  const initials = `${user.first_name?.charAt(0) || 'Н'}${user.last_name?.charAt(0) || 'У'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-md">
            {initials}
          </div>
        </div>
        
        {/* Patient Information */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 uppercase truncate sm:break-words">
            <span className="block sm:inline">{user.last_name || "НЕ УКАЗАНО"}</span>
            <span className="block sm:inline sm:ml-2">{user.first_name || "НЕ УКАЗАНО"}</span>
          </h2>
          
          {/* Details */}
          <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-0">
            {/* Birth date and age - always on one line if possible */}
            <p className="text-xs sm:text-sm text-gray-600">
              <span className="font-medium">{user.birth_date || "Не указано"}</span>
              <span className="mx-1">•</span>
              <span>{typeof age === 'string' ? age : `${age}л`}</span>
              <span className="mx-1">•</span>
              <span>{user.gender || "Не указано"}</span>
            </p>
            
            {/* ID - separate line on mobile for better readability */}
            <p className="text-xs sm:text-sm text-gray-500 font-mono">
              ID: {user.id || "Не указано"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Optional: Status indicator */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs sm:text-sm text-gray-600">Активный пациент</span>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          Обновлено сегодня
        </div>
      </div>
    </motion.div>
  );
};