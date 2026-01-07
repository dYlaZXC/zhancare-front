"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faBriefcase,
  faGraduationCap,
  faMapMarkerAlt,
  faEdit,
  faSave,
  faTimes,
  faCalendar,
  faIdCard,
  faAward,
  faStethoscope,
  faHospital,
  faStar,
  faUserMd,
  faCheckCircle,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";

interface DoctorProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience?: number;
  clinic?: {
    name: string;
    city?: string;
    address?: string;
  };
  education?: string;
  bio?: string;
}

export default function DoctorProfileInfo() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<DoctorProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/user-profile/profile/");
      setProfile(response.data);
      setEditedProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await api.patch("/user-profile/profile/", editedProfile);
      setProfile(response.data);
      setIsEditing(false);
      toast.success("Профиль успешно обновлен!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Не удалось обновить профиль");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%, 50% 0%, 50% 50%)" }}
            />
          </div>
          <p className="text-lg font-semibold text-gray-700">Загрузка профиля...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-3xl text-red-600" />
          </div>
          <p className="text-red-600 font-semibold">Не удалось загрузить профиль</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full">
        {/* Hero Header with Cover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl shadow-2xl overflow-hidden mb-8"
          style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2956bf 100%)' }}
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="relative p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-5xl sm:text-6xl font-bold shadow-2xl ring-8 ring-white/50 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, white, #ebf1ff)', color: '#3772ff' }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(55, 114, 255, 0.1), rgba(50, 103, 230, 0.1))' }} />
                  <span className="relative z-10">
                    {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                  </span>
                </div>
                {isEditing && (
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors" style={{ color: '#3772ff' }}>
                    <FontAwesomeIcon icon={faCamera} />
                  </button>
                )}
              </motion.div>

              {/* Profile Header Info */}
              <div className="flex-1 text-center sm:text-left text-white">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                    <h1 className="text-3xl sm:text-4xl font-bold">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-100 text-lg mb-4 justify-center sm:justify-start">
                    <FontAwesomeIcon icon={faStethoscope} />
                    <span className="font-medium">{profile.specialization || "Врач"}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm justify-center sm:justify-start">
                    {profile.experience && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <FontAwesomeIcon icon={faAward} />
                        <span>{profile.experience} лет опыта</span>
                      </div>
                    )}
                    {profile.clinic && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <FontAwesomeIcon icon={faHospital} />
                        <span>{profile.clinic.name}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Edit Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                    style={{ color: '#3772ff' }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Редактировать</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#3772ff' }}
                      onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#3267e6')}
                      onMouseLeave={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#3772ff')}
                    >
                      <FontAwesomeIcon icon={faSave} className={isSaving ? "animate-pulse" : ""} />
                      <span>{isSaving ? "Сохранение..." : "Сохранить"}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold disabled:opacity-50"
                      style={{ backgroundColor: '#283353' }}
                      onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#1e263e')}
                      onMouseLeave={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#283353')}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Отмена</span>
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Experience */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Опыт работы</p>
                <p className="text-3xl font-bold text-blue-600">{profile.experience || 0}</p>
                <p className="text-gray-500 text-xs mt-1">лет практики</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faCalendar} className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-yellow-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Рейтинг</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-yellow-600">4.9</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-xs" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-1">на основе отзывов</p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faStar} className="text-yellow-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Verified Badge */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Статус</p>
                <p className="text-3xl font-bold text-green-600">✓</p>
                <p className="text-gray-500 text-xs mt-1">Верифицирован</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Личная информация</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <motion.div
                  whileHover={{ scale: isEditing ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                    Имя
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.first_name || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl font-medium text-gray-800 border border-gray-200">
                      {profile.first_name}
                    </div>
                  )}
                </motion.div>

                {/* Last Name */}
                <motion.div
                  whileHover={{ scale: isEditing ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faIdCard} className="text-blue-600" />
                    Фамилия
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.last_name || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl font-medium text-gray-800 border border-gray-200">
                      {profile.last_name}
                    </div>
                  )}
                </motion.div>

                {/* Email */}
                <motion.div
                  whileHover={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faEnvelope} className="text-blue-600" />
                    Email
                  </label>
                  <div className="px-4 py-3 bg-gray-100 rounded-xl font-medium text-gray-600 border border-gray-200 flex items-center gap-2">
                    {profile.email}
                    <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      Не изменяется
                    </span>
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div
                  whileHover={{ scale: isEditing ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faPhone} className="text-blue-600" />
                    Телефон
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white"
                      placeholder="+7 (___) ___-__-__"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl font-medium text-gray-800 border border-gray-200">
                      {profile.phone || "Не указан"}
                    </div>
                  )}
                </motion.div>

                {/* Specialization */}
                <motion.div
                  whileHover={{ scale: isEditing ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faBriefcase} className="text-blue-600" />
                    Специализация
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.specialization || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, specialization: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl font-medium text-gray-800 border border-gray-200">
                      {profile.specialization || "Не указана"}
                    </div>
                  )}
                </motion.div>

                {/* Experience */}
                <motion.div
                  whileHover={{ scale: isEditing ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faCalendar} className="text-blue-600" />
                    Опыт работы (лет)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedProfile.experience || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, experience: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white"
                      min="0"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl font-medium text-gray-800 border border-gray-200">
                      {profile.experience || 0} лет
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Education */}
              <motion.div
                className="mt-6"
                whileHover={{ scale: isEditing ? 1.01 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                  Образование
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.education || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, education: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white resize-none"
                    rows={3}
                    placeholder="Укажите ваше образование..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl text-gray-800 border border-gray-200 min-h-[80px]">
                    {profile.education || "Не указано"}
                  </div>
                )}
              </motion.div>

              {/* Bio */}
              <motion.div
                className="mt-6"
                whileHover={{ scale: isEditing ? 1.01 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faUserMd} className="text-blue-600" />
                  О себе
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 hover:bg-white resize-none"
                    rows={4}
                    placeholder="Расскажите о себе..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl text-gray-800 border border-gray-200 min-h-[100px]">
                    {profile.bio || "Не указано"}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Clinic & Additional Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Clinic Information */}
            {profile.clinic && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faHospital} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Клиника</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-sm text-blue-100 mb-1">Название</p>
                    <p className="font-semibold text-lg">{profile.clinic.name}</p>
                  </div>
                  {profile.clinic.city && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm text-blue-100 mb-1 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        Город
                      </p>
                      <p className="font-semibold">{profile.clinic.city}</p>
                    </div>
                  )}
                  {profile.clinic.address && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm text-blue-100 mb-1">Адрес</p>
                      <p className="font-medium text-sm">{profile.clinic.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Быстрая статистика</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-gray-600">Консультаций</span>
                  <span className="font-bold text-blue-600">0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-gray-600">Пациентов</span>
                  <span className="font-bold text-green-600">0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm text-gray-600">Отзывов</span>
                  <span className="font-bold text-purple-600">0</span>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Профессиональная информация</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Специализация</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faStethoscope} className="text-blue-600 text-sm" />
                    </div>
                    <p className="font-semibold text-gray-900">{profile.specialization || "Не указана"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Опыт работы</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faAward} className="text-green-600 text-sm" />
                    </div>
                    <p className="font-semibold text-gray-900">{profile.experience || 0} лет</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
    </div>
  );
}
