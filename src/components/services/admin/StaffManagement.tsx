"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Stethoscope,
  Heart
} from "lucide-react";

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'nurse';
  specialization?: string;
  is_active: boolean;
  created_at: string;
  clinic?: {
    id: number;
    name: string;
  };
}

interface StaffManagementProps {
  user: any;
}

export default function StaffManagement({ user }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<'all' | 'doctor' | 'nurse'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить список персонала");
      }

      const data = await response.json();
      setStaff(data);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError(err.message || "Не удалось загрузить список персонала");

      // Mock data for development
      const mockStaff: StaffMember[] = [
        {
          id: 1,
          first_name: "Айгуль",
          last_name: "Нурсултанова",
          email: "aigul.nursultanova@clinic.kz",
          phone: "+7 (701) 234-56-78",
          role: "doctor",
          specialization: "Кардиолог",
          is_active: true,
          created_at: "2024-01-15T10:00:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 2,
          first_name: "Даурен",
          last_name: "Абаев",
          email: "dauren.abaev@clinic.kz",
          phone: "+7 (702) 345-67-89",
          role: "doctor",
          specialization: "Терапевт",
          is_active: true,
          created_at: "2024-02-20T11:30:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 3,
          first_name: "Малика",
          last_name: "Сагындыкова",
          email: "malika.sagyndykova@clinic.kz",
          phone: "+7 (777) 456-78-90",
          role: "nurse",
          specialization: "Процедурная медсестра",
          is_active: true,
          created_at: "2024-03-10T09:15:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 4,
          first_name: "Асель",
          last_name: "Токтарова",
          email: "asel.toktarova@clinic.kz",
          phone: "+7 (705) 567-89-01",
          role: "nurse",
          specialization: "Медсестра палатная",
          is_active: true,
          created_at: "2024-04-05T14:20:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 5,
          first_name: "Ерлан",
          last_name: "Касымов",
          email: "erlan.kasymov@clinic.kz",
          phone: "+7 (708) 678-90-12",
          role: "doctor",
          specialization: "Хирург",
          is_active: false,
          created_at: "2023-11-12T16:45:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
      ];
      setStaff(mockStaff);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff based on search and filters
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && member.is_active) ||
      (filterStatus === 'inactive' && !member.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: staff.length,
    doctors: staff.filter(s => s.role === 'doctor').length,
    nurses: staff.filter(s => s.role === 'nurse').length,
    active: staff.filter(s => s.is_active).length,
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Управление Персоналом
            </h1>
            <p className="text-gray-600">
              Управляйте врачами, медсестрами и другим медицинским персоналом
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
          >
            <UserPlus className="w-5 h-5" />
            Добавить Сотрудника
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Всего", value: stats.total, icon: Users, color: "#3772ff", bg: "#ebf1ff" },
            { label: "Докторов", value: stats.doctors, icon: Stethoscope, color: "#3267e6", bg: "#e1eaff" },
            { label: "Медсестер", value: stats.nurses, icon: Heart, color: "#8b5cf6", bg: "#f3e8ff" },
            { label: "Активных", value: stats.active, icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl p-4 border border-gray-100 shadow-sm"
              style={{ backgroundColor: stat.bg }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все роли</option>
            <option value="doctor">Доктора</option>
            <option value="nurse">Медсестры</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#3772ff' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка персонала...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderColor: '#fbbf24'
          }}
        >
          <AlertCircle className="w-7 h-7 text-amber-700 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 font-bold text-base mb-1">Демонстрационный режим</h3>
            <p className="text-amber-800 text-sm">{error}</p>
            <p className="text-amber-700 text-sm mt-1">Отображаются демонстрационные данные.</p>
          </div>
        </motion.div>
      )}

      {/* Staff List */}
      {!loading && (
        <div className="space-y-4">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-600 mb-2">
                Персонал не найден
              </p>
              <p className="text-gray-500">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredStaff.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                        style={{
                          background: member.role === 'doctor'
                            ? 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)'
                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                        }}
                      >
                        {member.first_name[0]}{member.last_name[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold" style={{ color: '#1e263e' }}>
                            {member.first_name} {member.last_name}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: member.role === 'doctor' ? '#ebf1ff' : '#f3e8ff',
                              color: member.role === 'doctor' ? '#3772ff' : '#8b5cf6'
                            }}
                          >
                            {member.role === 'doctor' ? 'Доктор' : 'Медсестра'}
                          </span>
                          {member.is_active ? (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              Активен
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              <XCircle className="w-3 h-3" />
                              Неактивен
                            </span>
                          )}
                        </div>

                        {member.specialization && (
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {member.specialization}
                          </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {member.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(member.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 rounded-xl hover:bg-blue-50 transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-5 h-5 text-blue-600" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 rounded-xl hover:bg-red-50 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
