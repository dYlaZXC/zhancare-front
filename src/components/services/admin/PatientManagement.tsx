"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, UserPlus, Mail, Phone, Lock, Calendar,
  MapPin, Building, Loader2, AlertCircle, Edit2, Trash2,
  CheckCircle, XCircle, Clock, Stethoscope, Home, FolderOpen,
  MessageCircle, ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, Eye, EyeOff, Copy,
} from "lucide-react";

const PAGE_SIZE = 50;
import PatientDocumentsDrawer from "./PatientDocumentsDrawer";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import PhoneInput from "@/components/ui/PhoneInput";

import bnClinicLogo from "@/assets/clinics_logos/bn-clinica.png";
import ayalaClinicLogo from "@/assets/clinics_logos/ayala_clinic.png";

/**
 * Patient interface.
 *
 * Note: The backend uses PatientProfile for personal information
 * (citizenship, marital_status, profession) and PatientMedicalProfile
 * for medical data. The API flattens this data for compatibility.
 */
interface Patient {
  // Basic user fields
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  is_active: boolean;
  created_at: string;

  // Profile fields (from PatientProfile)
  citizenship?: string;
  marital_status?: string;
  profession?: string;

  clinic?: { id: number; name: string } | null;
  clinic_created?: boolean;
  last_visit?: string | null;
  last_visit_type?: 'consultation' | 'appointment' | null;
  visits_count?: number;
}

interface PatientManagementProps {
  user: any;
}


// ─── ContactMenu ────────────────────────────────────────────────────────────

function ContactMenu({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const phone = patient.phone?.replace(/\D/g, "") ?? "";
  const hasPhone = !!phone;
  const hasEmail = !!patient.email;

  if (!hasPhone && !hasEmail) return null;

  const goWhatsApp = () => {
    setOpen(false);
    // Normalize to international format (+7XXXXXXXXXX for KZ/RU, +XXXXXXXXXXX otherwise)
    const normalized = phone
      ? `+${phone.startsWith("8") && phone.length === 11 ? "7" + phone.slice(1) : phone}`
      : "";
    router.push(`/admin/whatsapp${normalized ? `?phone=${encodeURIComponent(normalized)}` : ""}`);
  };

  const goTelegram = () => {
    setOpen(false);
    router.push(`/admin/telegram?patientId=${patient.id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
        title="Связаться"
      >
        <MessageCircle className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 min-w-[190px]"
          >
            {/* WhatsApp — переход во внутренний мессенджер */}
            {hasPhone && (
              <button onClick={goWhatsApp}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors text-left">
                <span className="w-7 h-7 rounded-lg bg-[#25D36620] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">WhatsApp</p>
                  <p className="text-[10px] text-gray-400">Открыть чат</p>
                </div>
              </button>
            )}

            {/* Telegram — переход во внутренний мессенджер */}
            <button onClick={goTelegram}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
              <span className="w-7 h-7 rounded-lg bg-[#0088cc20] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0088cc]">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Telegram</p>
                <p className="text-[10px] text-gray-400">Открыть мессенджер</p>
              </div>
            </button>

            {/* Divider */}
            {hasPhone && <div className="my-1 border-t border-gray-100" />}

            {/* Phone call */}
            {hasPhone && (
              <a href={`tel:${patient.phone}`} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-gray-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Позвонить</p>
                  <p className="text-[10px] text-gray-400">{patient.phone}</p>
                </div>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PatientManagement({ user }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'clinic_created'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [docsPatient, setDocsPatient] = useState<Patient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [clinics, setClinics] = useState<Array<{id: number; name: string}>>([]);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    birth_date: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: '',
    city: '',
    clinic_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);

  const generatePassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%&*';
    const all = lower + upper + digits + special;
    let pass = lower[Math.floor(Math.random() * lower.length)]
      + upper[Math.floor(Math.random() * upper.length)]
      + digits[Math.floor(Math.random() * digits.length)]
      + special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < 12; i++) pass += all[Math.floor(Math.random() * all.length)];
    pass = pass.split('').sort(() => Math.random() - 0.5).join('');
    setFormData(f => ({ ...f, password: pass }));
    setShowPassword(true);
  };

  const copyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    toast.success('Пароль скопирован');
  };

  useEffect(() => {
    fetchPatients();
    checkAdminType();
  }, []);

  const checkAdminType = async () => {
    // Check if current admin is a global admin (no clinic_id and no clinic object)
    const isGlobal = !user.clinic_id && !user.clinic?.id;
    setIsGlobalAdmin(isGlobal);

    // If global admin, fetch list of clinics
    if (isGlobal) {
      try {
        const response = await api.get('/clinics/');
        setClinics(response.data);
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/patients/');
      setPatients(response.data);
    } catch (err: any) {
      console.error("Error fetching patients:", err);
      setError(err.response?.data?.error || err.message || "Не удалось загрузить список пациентов");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const validatePatientForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) errors.first_name = 'Введите имя';
    if (!formData.last_name.trim()) errors.last_name = 'Введите фамилию';
    if (!formData.phone.trim()) errors.phone = 'Введите номер телефона';

    if (!showEditModal) {
      if (!formData.password.trim()) errors.password = 'Введите пароль';
      else if (formData.password.length < 8) errors.password = 'Минимум 8 символов';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Минимум 8 символов';
    }

    // ✅ Clinic is optional - global admins can choose to assign or not assign a clinic
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePatientForm()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setAddLoading(true);

    try {
      const response = await api.post('/patients/', { ...formData, require_password_change: requirePasswordChange });
      const newPatient = response.data;

      // Add new patient to the list
      setPatients([newPatient, ...patients]);

      toast.success("Пациент успешно добавлен!");

      // Reset form and close modal
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        birth_date: '',
        gender: 'male',
        address: '',
        city: '',
        clinic_id: '',
      });
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Error adding patient:", err);
      toast.error(err.response?.data?.error || err.message || "Не удалось добавить пациента");
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddClick = () => {
    // Reset form data before opening add modal
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      birth_date: '',
      gender: 'male',
      address: '',
      city: '',
      clinic_id: '',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      password: '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || 'male',
      address: patient.address || '',
      city: patient.city || '',
      clinic_id: patient.clinic?.id?.toString() || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    if (!validatePatientForm()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setEditLoading(true);

    try {
      // Remove password if empty (don't change password)
      const { password, ...updateData } = formData;
      const finalData = password ? { ...updateData, password } : updateData;

      const response = await api.patch(`/patients/${editingPatient.id}/`, finalData);
      const updatedPatient = response.data;

      // Update patient in the list
      setPatients(patients.map(p => p.id === editingPatient.id ? updatedPatient : p));

      toast.success("Данные пациента успешно обновлены!");

      // Close modal and reset
      setShowEditModal(false);
      setEditingPatient(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        birth_date: '',
        gender: 'male',
        address: '',
        city: '',
        clinic_id: '',
      });
    } catch (err: any) {
      console.error("Error updating patient:", err);
      toast.error(err.response?.data?.error || err.message || "Не удалось обновить данные пациента");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setDeletingPatient(patient);
    setShowDeleteModal(true);
  };

  const handleDeletePatient = async () => {
    if (!deletingPatient) return;

    setDeleteLoading(true);

    try {
      await api.patch(`/patients/${deletingPatient.id}/`, { is_active: false });

      // Mark as inactive — patient stays in list and appears in "Неактивные" tab
      setPatients(patients.map(p =>
        p.id === deletingPatient.id ? { ...p, is_active: false } : p
      ));

      toast.success("Пациент деактивирован и перемещён в Неактивные!");

      // Close modal and reset
      setShowDeleteModal(false);
      setDeletingPatient(null);
    } catch (err: any) {
      console.error("Error deleting patient:", err);
      toast.error(err.response?.data?.error || err.message || "Не удалось удалить пациента");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter and sort patients based on search and filters
  const filteredPatients = patients
    .filter((patient) => {
      const matchesSearch =
        patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.phone && patient.phone.includes(searchQuery));

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && patient.is_active) ||
        (filterStatus === 'inactive' && !patient.is_active) ||
        (filterStatus === 'clinic_created' && !!patient.clinic_created);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Patients with visits float to top; within each group sort by date desc
      const aDate = a.last_visit || a.created_at || '';
      const bDate = b.last_visit || b.created_at || '';
      const aHasVisit = !!a.last_visit;
      const bHasVisit = !!b.last_visit;
      if (aHasVisit !== bHasVisit) return aHasVisit ? -1 : 1;
      return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to first page when filters or search change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.is_active).length,
    inactive: patients.filter(p => !p.is_active).length,
    clinic_created: patients.filter(p => !!p.clinic_created).length,
  };

  return (

    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Управление Пациентами
            </h1>
            <p className="text-gray-600">
              Управляйте профилями пациентов клиники
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddClick}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <UserPlus className="w-5 h-5" />
            Добавить Пациента
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Всего", value: stats.total, icon: Users, color: "#10b981", bg: "#d1fae5" },
            { label: "Активных", value: stats.active, icon: CheckCircle, color: "#059669", bg: "#a7f3d0" },
            { label: "Неактивных", value: stats.inactive, icon: XCircle, color: "#6b7280", bg: "#e5e7eb" },
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
              placeholder="Поиск по имени, email или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Compact pagination in toolbar */}
          {filteredPatients.length > PAGE_SIZE && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-600 px-3 py-2.5 rounded-2xl border-2 border-gray-200 bg-white min-w-[72px] text-center tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Status Filter Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                filterStatus === 'all'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              <Users className="w-5 h-5" />
              Все
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Активные
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                filterStatus === 'inactive'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              <XCircle className="w-5 h-5" />
              Неактивные
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus('clinic_created')}
              className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                filterStatus === 'clinic_created'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              <Building className="w-5 h-5" />
              Созданные клиникой
              {stats.clinic_created > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  filterStatus === 'clinic_created' ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  {stats.clinic_created}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#10b981' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка пациентов...
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
            <h3 className="text-amber-900 font-bold text-base mb-1">Ошибка загрузки</h3>
            <p className="text-amber-800 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Patients List */}
      {!loading && (
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-600 mb-2">
                Пациенты не найдены
              </p>
              <p className="text-gray-500">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {paginatedPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={initialLoad ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={initialLoad ? { delay: index * 0.05 } : { duration: 0.2 }}
                  layout
                  className="rounded-3xl p-6 border-2 border-gray-100 hover:border-green-200 transition-all bg-white shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        }}
                      >
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {patient.email}
                          </span>
                          {patient.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {patient.city}
                            </span>
                          )}
                        </div>
                        {/* Last visit + visits count */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {patient.last_visit ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {patient.last_visit_type === 'consultation'
                                ? <Stethoscope className="w-3 h-3" />
                                : <Home className="w-3 h-3" />
                              }
                              Последний визит:{' '}
                              {new Date(patient.last_visit).toLocaleDateString('ru-RU', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-100">
                              <Clock className="w-3 h-3" />
                              Визитов нет
                            </span>
                          )}
                          {(patient.visits_count ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {patient.visits_count} {patient.visits_count === 1 ? 'визит' : 'визитов'}
                            </span>
                          )}
                        </div>

                        {patient.clinic && (
                          <div className="mt-2 flex items-center gap-2">
                            {(patient.clinic.id === 913 || patient.clinic.name?.toLowerCase().includes('ayala')) ? (
                              <div className="bg-white px-1.5 py-0.5 rounded border border-green-200">
                                <Image src={ayalaClinicLogo} alt="Ayala Clinic" width={40} height={14} className="object-contain" priority={false} />
                              </div>
                            ) : (patient.clinic.name?.toLowerCase().includes('bn') || patient.clinic.name?.toLowerCase().includes('бн')) ? (
                              <div className="bg-white px-1.5 py-0.5 rounded border border-green-200">
                                <Image src={bnClinicLogo} alt="BN Clinic" width={40} height={14} className="object-contain" priority={false} />
                              </div>
                            ) : (
                              <Building className="w-4 h-4 text-green-600" />
                            )}
                            <span className="text-sm font-medium text-green-700">
                              {patient.clinic.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      {patient.is_active ? (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          Активен
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
                          Неактивен
                        </span>
                      )}

                      {/* Contact Button */}
                      <ContactMenu patient={patient} />

                      {/* Documents Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDocsPatient(patient)}
                        className="p-2 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                        title="Документы пациента"
                      >
                        <FolderOpen className="w-5 h-5" />
                      </motion.button>

                      {/* Edit Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditClick(patient)}
                        className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-5 h-5" />
                      </motion.button>

                      {/* Delete Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(patient)}
                        className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Add Patient Modal */}
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
                    Добавить Пациента
                  </h2>
                  <p className="text-gray-600 mt-1">Заполните форму для регистрации нового пациента</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddPatient} className="p-8">
                <div className="space-y-6">
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
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                        placeholder="Введите фамилию"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(e164) => setFormData({ ...formData, phone: e164 })}
                      required
                      defaultCountry="KZ"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Пароль <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Сгенерировать
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-20 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors font-mono"
                        placeholder="Минимум 8 символов"
                        minLength={8}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title={showPassword ? "Скрыть" : "Показать"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={copyPassword}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Скопировать пароль"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Force password change checkbox */}
                    <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none group">
                      <div
                        onClick={() => setRequirePasswordChange(v => !v)}
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                          requirePasswordChange
                            ? 'bg-green-600 border-green-600'
                            : 'bg-white border-gray-300 group-hover:border-green-400'
                        }`}
                      >
                        {requirePasswordChange && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                        Потребовать смену пароля при первом входе
                      </span>
                    </label>
                  </div>

                  {/* Birth Date & Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Дата рождения
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Пол
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                      >
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>
                  </div>

                  {/* Address & City */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Адрес
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                        placeholder="Улица, дом"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Город
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                        placeholder="Название города"
                      />
                    </div>
                  </div>

                  {/* Clinic Selection/Display */}
                  {isGlobalAdmin ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника <span className="text-gray-500 text-xs">(опционально)</span>
                      </label>
                      <select
                        value={formData.clinic_id}
                        onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                      >
                        <option value="">Без клиники</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        💡 Глобальные администраторы могут назначить пациента в любую клинику или оставить без клиники
                      </p>
                    </div>
                  ) : (user.clinic?.name || user.clinic_id) && (
                    <div className="rounded-2xl p-4 border-2 border-green-100 bg-green-50">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {(user.clinic?.id === 913 || user.clinic?.name?.toLowerCase().includes('ayala')) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-green-200 shadow-md">
                            <Image src={ayalaClinicLogo} alt="Ayala Clinic" width={80} height={28} className="object-contain" priority={false} />
                          </div>
                        ) : (user.clinic?.name?.toLowerCase().includes('bn') || user.clinic?.name?.toLowerCase().includes('бн')) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-green-200 shadow-md">
                            <Image src={bnClinicLogo} alt="BN Clinic" width={80} height={28} className="object-contain" priority={false} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                            <Building className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-base font-bold text-gray-800">{user.clinic?.name || 'Ваша клиника'}</p>
                          <p className="text-sm text-gray-600">Администратор клиники</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-green-100 rounded-xl">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Новый пациент будет автоматически назначен в вашу клинику
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
                    className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
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

      {/* Edit Patient Modal */}
      <AnimatePresence>
        {showEditModal && editingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEditModal(false);
              setEditingPatient(null);
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
                    Редактировать Пациента
                  </h2>
                  <p className="text-gray-600 mt-1">Обновите данные пациента {editingPatient.first_name} {editingPatient.last_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPatient(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditPatient} className="p-8">
                <div className="space-y-6">
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
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(e164) => setFormData({ ...formData, phone: e164 })}
                      required
                      defaultCountry="KZ"
                    />
                  </div>

                  {/* Password (Optional for edit) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Новый пароль <span className="text-gray-400 text-xs font-normal">(оставьте пустым, чтобы не менять)</span>
                      </label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Сгенерировать
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-20 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors font-mono"
                        placeholder="Минимум 8 символов"
                        minLength={8}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title={showPassword ? "Скрыть" : "Показать"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={copyPassword}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Скопировать пароль"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Birth Date & Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Дата рождения
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Пол
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>
                  </div>

                  {/* Address & City */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Адрес
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Город
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPatient(null);
                    }}
                    disabled={editLoading}
                    className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                  >
                    {editLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
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
        {showDeleteModal && deletingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingPatient(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-3" style={{ color: '#1e263e' }}>
                Удалить пациента?
              </h2>

              {/* Description */}
              <p className="text-center text-gray-600 mb-6">
                Вы действительно хотите удалить пациента <span className="font-semibold">{deletingPatient.first_name} {deletingPatient.last_name}</span>?
                Это действие нельзя отменить.
              </p>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingPatient(null);
                  }}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeletePatient}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Documents Drawer */}
      {docsPatient && (
        <PatientDocumentsDrawer
          patientId={docsPatient.id}
          patientName={`${docsPatient.first_name} ${docsPatient.last_name}`.trim()}
          isOpen={!!docsPatient}
          onClose={() => setDocsPatient(null)}
        />
      )}
    </div>
  );
}
