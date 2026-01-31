"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
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
  Heart,
  X,
  Lock
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
  is_deleted?: boolean;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
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
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<'all' | 'doctor' | 'nurse'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'offline' | 'break'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [clinics, setClinics] = useState<Array<{id: number; name: string}>>([]);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'doctor' as 'doctor' | 'nurse',
    specialization: '',
    clinic_id: '',
  });

  useEffect(() => {
    fetchStaff();
    checkAdminType();
  }, []);

  const checkAdminType = async () => {
    // Check if current admin is a global admin (no clinic_id and no clinic object)
    const isGlobal = !user.clinic_id && !user.clinic?.id;
    setIsGlobalAdmin(isGlobal);

    // If global admin, fetch list of clinics
    if (isGlobal) {
      try {
        const response = await api.get("/clinics/");
        setClinics(response.data);
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/staff/");
      setStaff(response.data);
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
      setInitialLoad(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const response = await api.post("/staff/", formData);
      const newStaff = response.data;

      // Add new staff to the list
      setStaff([newStaff, ...staff]);

      toast.success(`${formData.role === 'doctor' ? 'Доктор' : 'Медсестра'} успешно добавлен(а)!`);

      // Reset form and close modal
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'doctor',
        specialization: '',
        clinic_id: '',
      });
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Error adding staff:", err);
      toast.error(err.message || "Не удалось добавить сотрудника");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (memberId: number, currentStatus: string | undefined) => {
    try {
      // Toggle between 'available' and 'offline'
      const newStatus = currentStatus === 'available' ? 'offline' : 'available';

      const response = await api.patch(`/staff/${memberId}/`, { availability_status: newStatus });
      const updatedStaff = response.data;

      // Update staff in the list
      setStaff(staff.map(member =>
        member.id === memberId ? { ...member, availability_status: updatedStaff.availability_status } : member
      ));

      const statusText = updatedStaff.availability_status === 'available' ? 'Доступен' : 'Не работает';
      toast.success(`Статус изменен на: ${statusText}!`);
    } catch (err: any) {
      console.error("Error toggling staff status:", err);
      toast.error(err.message || "Не удалось изменить статус сотрудника");
    }
  };

  const handleEditClick = (member: StaffMember) => {
    setEditingMember(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      password: '',
      role: member.role,
      specialization: member.specialization || '',
      clinic_id: member.clinic?.id?.toString() || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setEditLoading(true);

    try {
      // Don't send password if it's empty
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        specialization: formData.specialization,
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Include clinic_id for global admins
      if (isGlobalAdmin && formData.clinic_id) {
        updateData.clinic_id = formData.clinic_id;
      }

      const response = await api.patch(`/staff/${editingMember.id}/`, updateData);
      const updatedStaff = response.data;

      // Update staff in the list
      setStaff(staff.map(member =>
        member.id === editingMember.id ? updatedStaff : member
      ));

      toast.success(`Данные сотрудника успешно обновлены!`);

      // Close modal and reset
      setShowEditModal(false);
      setEditingMember(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'doctor',
        specialization: '',
        clinic_id: '',
      });
    } catch (err: any) {
      console.error("Error updating staff:", err);
      toast.error(err.message || "Не удалось обновить данные сотрудника");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (member: StaffMember) => {
    setDeletingMember(member);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingMember) return;

    setDeleteLoading(true);

    try {
      await api.patch(`/staff/${deletingMember.id}/`, { is_deleted: true });

      // Remove deleted staff from the list
      setStaff(staff.filter(member => member.id !== deletingMember.id));

      toast.success(`${deletingMember.first_name} ${deletingMember.last_name} успешно удален(а)!`);

      // Close modal and reset
      setShowDeleteModal(false);
      setDeletingMember(null);
    } catch (err: any) {
      console.error("Error deleting staff:", err);
      toast.error(err.message || "Не удалось удалить сотрудника");
    } finally {
      setDeleteLoading(false);
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
      member.availability_status === filterStatus;

    // Filter by deleted status
    const matchesDeleted = showDeleted ? member.is_deleted === true : !member.is_deleted;

    return matchesSearch && matchesRole && matchesStatus && matchesDeleted;
  });

  const stats = {
    total: staff.filter(s => !s.is_deleted).length,
    doctors: staff.filter(s => s.role === 'doctor' && !s.is_deleted).length,
    nurses: staff.filter(s => s.role === 'nurse' && !s.is_deleted).length,
    available: staff.filter(s => s.availability_status === 'available' && !s.is_deleted).length,
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
            onClick={() => setShowAddModal(true)}
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
            { label: "Доступных", value: stats.available, icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
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
            <option value="available">Доступен</option>
            <option value="busy">Занят</option>
            <option value="break">На перерыве</option>
            <option value="offline">Не работает</option>
          </select>

          {/* Show Deleted Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${
              showDeleted
                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
            }`}
            title={showDeleted ? 'Показать активных сотрудников' : 'Показать удаленных сотрудников'}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden lg:inline">
              {showDeleted ? 'Удаленные' : 'Активные'}
            </span>
          </motion.button>
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
            <AnimatePresence mode="popLayout">
              {filteredStaff.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={initialLoad ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={initialLoad ? { delay: index * 0.05 } : { duration: 0.2 }}
                  layout
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
                          {member.availability_status === 'available' ? (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              Доступен
                            </span>
                          ) : member.availability_status === 'busy' ? (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              <AlertCircle className="w-3 h-3" />
                              Занят
                            </span>
                          ) : member.availability_status === 'break' ? (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              <AlertCircle className="w-3 h-3" />
                              На перерыве
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              <XCircle className="w-3 h-3" />
                              Не работает
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

                    {/* Actions - Improved Design */}
                    <div className="flex items-center gap-3">
                      {/* Status Toggle Button - Shows current status, click to toggle */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleStatus(member.id, member.availability_status)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
                          member.availability_status === 'available'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
                        }`}
                        title={member.availability_status === 'available' ? 'Доступен - нажмите чтобы отключить' : 'Не работает - нажмите чтобы включить'}
                      >
                        {member.availability_status === 'available' ? (
                          <>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                            <span className="hidden sm:inline">Онлайн</span>
                            <span className="sm:hidden">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <span className="hidden sm:inline">Офлайн</span>
                            <span className="sm:hidden">
                              <XCircle className="w-4 h-4" />
                            </span>
                          </>
                        )}
                      </motion.button>

                      {/* Action Buttons Group */}
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditClick(member)}
                          className="p-2.5 rounded-lg hover:bg-white transition-all group"
                          title="Редактировать профиль"
                        >
                          <Edit className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(member)}
                          className="p-2.5 rounded-lg hover:bg-white transition-all group"
                          title="Удалить сотрудника"
                        >
                          <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
                    Добавить Сотрудника
                  </h2>
                  <p className="text-gray-600 mt-1">Заполните форму для добавления нового доктора или медсестры</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddStaff} className="p-8">
                <div className="space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Роль <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'doctor' })}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          formData.role === 'doctor'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Stethoscope
                          className={`w-8 h-8 mx-auto mb-2 ${
                            formData.role === 'doctor' ? 'text-blue-500' : 'text-gray-400'
                          }`}
                        />
                        <p className="font-semibold text-gray-700">Доктор</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'nurse' })}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          formData.role === 'nurse'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Heart
                          className={`w-8 h-8 mx-auto mb-2 ${
                            formData.role === 'nurse' ? 'text-purple-500' : 'text-gray-400'
                          }`}
                        />
                        <p className="font-semibold text-gray-700">Медсестра</p>
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Имя <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Введите имя"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Фамилия <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Введите фамилию"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="example@clinic.kz"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="+7 (700) 123-45-67"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Пароль <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Минимум 8 символов"
                        minLength={8}
                      />
                    </div>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Специализация
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder={formData.role === 'doctor' ? 'Например: Кардиолог' : 'Например: Процедурная медсестра'}
                      />
                    </div>
                  </div>

                  {/* Clinic Selection/Display */}
                  {isGlobalAdmin ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника {clinics.length > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={formData.clinic_id}
                        onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        required={clinics.length > 0}
                      >
                        <option value="">Выберите клинику (опционально)</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        💡 Глобальные администраторы могут назначить сотрудника в любую клинику
                      </p>
                    </div>
                  ) : (user.clinic?.name || user.clinic_id) && (
                    <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-800">{user.clinic?.name || 'Ваша клиника'}</p>
                          <p className="text-sm text-gray-600">Администратор клиники</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-100 rounded-xl">
                        <p className="text-sm text-blue-800 font-medium">
                          ✓ Новый сотрудник будет автоматически назначен в вашу клинику
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={addLoading}
                    className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
                  >
                    {addLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Добавление...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Добавить
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {showEditModal && editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEditModal(false);
              setEditingMember(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
                    Редактировать Сотрудника
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Измените данные {editingMember.first_name} {editingMember.last_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditSubmit} className="p-8">
                <div className="space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Роль <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'doctor' })}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          formData.role === 'doctor'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Stethoscope
                          className={`w-8 h-8 mx-auto mb-2 ${
                            formData.role === 'doctor' ? 'text-blue-500' : 'text-gray-400'
                          }`}
                        />
                        <p className="font-semibold text-gray-700">Доктор</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'nurse' })}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          formData.role === 'nurse'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Heart
                          className={`w-8 h-8 mx-auto mb-2 ${
                            formData.role === 'nurse' ? 'text-purple-500' : 'text-gray-400'
                          }`}
                        />
                        <p className="font-semibold text-gray-700">Медсестра</p>
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Имя <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Введите имя"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Фамилия <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Введите фамилию"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="example@clinic.kz"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="+7 (700) 123-45-67"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Новый пароль <span className="text-gray-500 text-xs">(оставьте пустым, чтобы не менять)</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Оставьте пустым для сохранения текущего"
                        minLength={8}
                      />
                    </div>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Специализация
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder={formData.role === 'doctor' ? 'Например: Кардиолог' : 'Например: Процедурная медсестра'}
                      />
                    </div>
                  </div>

                  {/* Clinic Selection/Display */}
                  {isGlobalAdmin ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника {clinics.length > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={formData.clinic_id}
                        onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        required={clinics.length > 0}
                      >
                        <option value="">Выберите клинику (опционально)</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (editingMember.clinic?.name || user.clinic?.name) && (
                    <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-800">
                            {editingMember.clinic?.name || user.clinic?.name || 'Текущая клиника'}
                          </p>
                          <p className="text-sm text-gray-600">Клиника сотрудника</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                    }}
                    disabled={editLoading}
                    className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
                  >
                    {editLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Edit className="w-5 h-5" />
                        Сохранить
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingMember(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b-2 border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Подтверждение удаления
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Это действие можно отменить
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                <div className="rounded-2xl p-4 bg-red-50 border-2 border-red-100 mb-6">
                  <p className="text-gray-800 text-center">
                    Вы уверены, что хотите удалить{' '}
                    <span className="font-bold text-gray-900">
                      {deletingMember.first_name} {deletingMember.last_name}
                    </span>
                    ?
                  </p>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {deletingMember.role === 'doctor' ? 'Доктор' : 'Медсестра'} •{' '}
                    {deletingMember.specialization || 'Без специализации'}
                  </p>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Информация
                      </p>
                      <p className="text-sm text-amber-800">
                        Сотрудник будет помечен как удаленный и больше не будет отображаться в основном списке. Вы сможете просмотреть удаленных сотрудников отдельно.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingMember(null);
                    }}
                    disabled={deleteLoading}
                    className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={deleteLoading}
                    className="flex-1 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Удаление...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Удалить
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
