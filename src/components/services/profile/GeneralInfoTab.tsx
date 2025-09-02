"use client";

import { User, Calendar, TrendingUp, Mail, Phone, MapPin, Users, CheckCircle } from "lucide-react";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { User as UserType } from "./types";
import { useProfileData } from "./useProfileData";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface ConsultationChartProps {
  data: ChartDataPoint[];
}

const ConsultationChart: React.FC<ConsultationChartProps> = ({ data }) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> Динамика консультаций
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface GeneralInfoTabProps {
  user: UserType;
  isEditing: boolean;
  editValues: UserType;
  errors: { email?: string };
  onEditValueChange: (field: keyof UserType, value: string) => void;
  consultationsCount: number;
  appointmentsCount: number;
}

export const GeneralInfoTab = ({ 
  user, 
  isEditing, 
  editValues, 
  errors, 
  onEditValueChange,
  consultationsCount,
  appointmentsCount
}: GeneralInfoTabProps) => {
  // Get real data from the hook
  const { consultations, appointments, consultationTrendData, loading } = useProfileData();

  // Show loading state if data is still being fetched
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-gray-200 h-48 rounded-xl"></div>
        <div className="bg-gray-200 h-96 rounded-xl"></div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Edit Form Header */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Редактирование профиля</h3>
          </div>
          <p className="text-sm text-blue-700 mt-1">Обновите вашу личную информацию</p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Имя <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={editValues.first_name}
                onChange={(e) => onEditValueChange('first_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm text-sm"
                placeholder="Введите имя"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Фамилия <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={editValues.last_name}
                onChange={(e) => onEditValueChange('last_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm text-sm"
                placeholder="Введите фамилию"
                required
              />
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email адрес <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={editValues.email}
                onChange={(e) => onEditValueChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white shadow-sm text-sm ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="example@email.com"
                required
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xs font-bold">!</span>
                </div>
                <p>{errors.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Save Reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm font-medium">Не забудьте сохранить изменения после редактирования</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate age for display
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 25;
    const birth = new Date(birthDate.split('.').reverse().join('-'));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user.birth_date || "03.08.1999");
  const roleDisplayName = user.role === "doctor" ? "Доктор" : user.role === "admin" ? "Администратор" : "Пациент";

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Личная информация</h3>
            <p className="text-sm text-blue-700">Основные данные профиля</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Полное имя</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-gray-500 mt-1">{age} лет • {user.gender || "Мужчина"}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Контактные данные</span>
            </div>
            <p className="text-sm font-medium text-gray-900 break-all">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {user.phone || "+77781203654"}
            </p>
          </div>
        </div>
        
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Местоположение и роль</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-900">
              {user.city || "Астана"}, {user.address || "Казахстан"}
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {roleDisplayName}
            </span>
          </div>
        </div>
      </div>
      
      {/* Statistics Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Медицинская активность</h3>
            <p className="text-sm text-gray-600">Статистика визитов и консультаций</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">Всего</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 mb-1">{loading ? '...' : consultations.length}</p>
            <p className="text-sm font-medium text-blue-700">Онлайн Консультаций</p>
            <p className="text-xs text-blue-600 mt-1">За все время</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">Записи</span>
            </div>
            <p className="text-3xl font-bold text-green-900 mb-1">{loading ? '...' : appointments.length}</p>
            <p className="text-sm font-medium text-green-700">Визитов на дом</p>
            <p className="text-xs text-green-600 mt-1">Включая запланированные</p>
          </div>
        </div>
        
        {/* Additional Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">
              {loading ? '...' : `${Math.min(100, Math.max(0, Math.round((consultations.length + appointments.length) * 10)))}%`}
            </p>
            <p className="text-xs text-gray-600">Активность</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">
              {user.date_joined 
                ? Math.max(0, Math.floor((Date.now() - new Date(user.date_joined).getTime()) / (1000 * 60 * 60 * 24 * 365)))
                : 0
              }
            </p>
            <p className="text-xs text-gray-600">Лет в системе</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">
              {loading ? '...' : 
                consultations.length + appointments.length >= 20 ? 'A+' :
                consultations.length + appointments.length >= 15 ? 'A' :
                consultations.length + appointments.length >= 10 ? 'B+' :
                consultations.length + appointments.length >= 5 ? 'B' :
                consultations.length + appointments.length >= 1 ? 'C' : 'New'
              }
            </p>
            <p className="text-xs text-gray-600">Рейтинг</p>
          </div>
        </div>

        {/* Consultation Chart */}
        <ConsultationChart data={consultationTrendData} />
      </div>
    </div>
  );
};