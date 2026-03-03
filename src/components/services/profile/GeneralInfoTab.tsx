"use client";

import { User, TrendingUp, Mail, CheckCircle } from "lucide-react";
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
  const rating = loading ? '—' :
    consultations.length + appointments.length >= 20 ? 'A+' :
    consultations.length + appointments.length >= 10 ? 'A' :
    consultations.length + appointments.length >= 5 ? 'B+' : 'B';
  const yearsInSystem = user.date_joined
    ? Math.max(0, Math.floor((Date.now() - new Date(user.date_joined).getTime()) / (1000 * 60 * 60 * 24 * 365)))
    : 0;

  return (
    <div className="space-y-4">
      {/* Medical Activity Card — simplified */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Медицинская активность</h3>
            <p className="text-xs text-gray-400">Статистика за всё время</p>
          </div>
        </div>

        {/* Hero stat */}
        <div className="px-5 pt-6 pb-4 text-center">
          <p className="text-6xl font-extrabold text-blue-600 tabular-nums leading-none">
            {loading ? '—' : consultations.length}
          </p>
          <p className="text-sm text-gray-400 mt-2">Онлайн консультаций</p>
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <div className="py-3 text-center">
            <p className="text-xl font-bold text-gray-800">{loading ? '—' : appointments.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Визитов</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-xl font-bold text-gray-800">{rating}</p>
            <p className="text-xs text-gray-400 mt-0.5">Рейтинг</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-xl font-bold text-gray-800">{yearsInSystem}</p>
            <p className="text-xs text-gray-400 mt-0.5">Лет в системе</p>
          </div>
        </div>

        {/* Chart — always visible */}
        <div className="border-t border-gray-100 px-5 py-5">
          <ConsultationChart data={consultationTrendData} />
        </div>
      </div>

    </div>
  );
};