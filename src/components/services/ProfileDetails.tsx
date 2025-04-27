"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

interface User {
  first_name: string;
  last_name: string;
  email: string;
}

interface ProfileDetailsProps {
  user: User;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user }) => {
  return (
    <section className="max-w-4xl mx-auto p-6 sm:p-10 bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#001E80]">Карточка пациента</h2>
        <p className="text-gray-500 mt-2">Информация о вашем профиле</p>
      </div>

      {/* Profile Info */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {/* Name */}
        <div className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition">
          <FontAwesomeIcon icon={faUser} className="text-[#001E80] text-xl" />
          <div>
            <p className="text-sm text-gray-500">ФИО</p>
            <p className="font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition">
          <FontAwesomeIcon icon={faEnvelope} className="text-[#001E80] text-xl" />
          <div>
            <p className="text-sm text-gray-500">Электронная почта</p>
            <p className="font-semibold text-gray-800">{user.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Appointments */}
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-[#001E80] flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faClipboardList} />
          Последние консультации
        </h3>
        <ul className="space-y-3 text-gray-700 text-sm">
          <li className="flex items-center gap-2">
            📅 <span>20.02.2025 — <strong>Д-р Иванов (Терапевт)</strong></span>
          </li>
          <li className="flex items-center gap-2">
            📅 <span>15.02.2025 — <strong>Д-р Смирнова (Кардиолог)</strong></span>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default ProfileDetails;
