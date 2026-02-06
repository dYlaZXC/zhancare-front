"use client";

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import Image from "next/image";
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
  Lock,
  Plus,
  Minus,
  MapPin,
  Globe,
  Award,
  RotateCcw
} from "lucide-react";

import bnClinicLogo from "@/assets/clinics_logos/bn-clinica.png";
import ayalaClinicLogo from "@/assets/clinics_logos/ayala_clinic.png";

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'nurse';
  specialization?: string;
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
  address?: string | null;
  city?: string | null;
  language?: 'kz' | 'ru' | 'en' | 'other' | null;
  years_of_experience?: number | null;
  is_active: boolean;
  is_deleted?: boolean;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
  created_at: string;
  clinic?: {
    id: number;
    name: string;
  };
  offline_consultation_price?: number;
  online_consultation_price?: number;
  preferred_consultation_duration?: number; // in minutes
  work_schedule?: {
    [key: string]: { // day name as key
      start: string; // HH:MM format
      end: string; // HH:MM format
      enabled: boolean;
    };
  };
}

// Phone number formatter utility
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters except '+'
  const cleaned = value.replace(/[^\d+]/g, '');

  // Extract only digits for formatting
  let digits = cleaned.replace(/\D/g, '');

  // If empty or just one digit, return as is with +
  if (!digits) return '';
  if (digits.length === 1) return '+' + digits;

  // Convert Kazakhstan 8 to 7 (8XXXXXXXXXX -> 7XXXXXXXXXX)
  // This handles cases like 87758249686 -> 77758249686
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.substring(1);
  }

  // Format: +X (XXX) XXX XX XX
  let formatted = '+' + digits[0];

  // Add area code in parentheses (only if we have at least 2 digits)
  if (digits.length >= 2) {
    formatted += ' (' + digits.substring(1, Math.min(4, digits.length));

    // Close parentheses only if we have 4+ digits
    if (digits.length >= 4) {
      formatted += ')';
    }
  }

  // Add first part (digits 5-7)
  if (digits.length >= 5) {
    formatted += ' ' + digits.substring(4, Math.min(7, digits.length));
  }

  // Add second part (digits 8-9)
  if (digits.length >= 8) {
    formatted += ' ' + digits.substring(7, Math.min(9, digits.length));
  }

  // Add third part (digits 10-11)
  if (digits.length >= 10) {
    formatted += ' ' + digits.substring(9, Math.min(11, digits.length));
  }

  return formatted;
};

// Memoized phone input component with automatic formatting
const PhoneInput = memo(({
  value,
  onChange,
  placeholder,
  required,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousDigitCount = useRef<number>(0);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value);
      previousDigitCount.current = value.replace(/\D/g, '').length;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (!inputRef.current) return;

      const cursorPos = inputRef.current.selectionStart || 0;
      const cursorEnd = inputRef.current.selectionEnd || 0;
      const value = inputRef.current.value;

      // If text is selected, let default behavior handle it
      if (cursorPos !== cursorEnd) {
        return;
      }

      // Prevent default and handle deletion manually
      e.preventDefault();

      const digits = value.replace(/\D/g, '');

      if (digits.length === 0) {
        return; // Nothing to delete
      }

      // Remove the last digit
      const newDigits = digits.slice(0, -1);
      const formatted = newDigits ? formatPhoneNumber(newDigits) : '';

      setLocalValue(formatted);
      previousDigitCount.current = newDigits.length;
      requestAnimationFrame(() => onChange(formatted));

      // Set cursor to end
      setTimeout(() => {
        if (inputRef.current) {
          const newLength = formatted.length;
          inputRef.current.setSelectionRange(newLength, newLength);
        }
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // If user cleared the input completely, allow it
    if (input === '' || input === '+') {
      setLocalValue('');
      previousDigitCount.current = 0;
      requestAnimationFrame(() => onChange(''));
      return;
    }

    // Get current digit count
    const currentDigits = input.replace(/\D/g, '');
    const currentDigitCount = currentDigits.length;

    // If user is deleting (digit count decreased), handle it properly
    if (currentDigitCount < previousDigitCount.current) {
      const formatted = formatPhoneNumber(currentDigits);
      setLocalValue(formatted);
      previousDigitCount.current = currentDigitCount;
      requestAnimationFrame(() => onChange(formatted));
      return;
    }

    // Otherwise, format normally
    const formatted = formatPhoneNumber(input);
    setLocalValue(formatted);
    previousDigitCount.current = formatted.replace(/\D/g, '').length;
    requestAnimationFrame(() => onChange(formatted));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatPhoneNumber(pastedText);
    setLocalValue(formatted);
    previousDigitCount.current = formatted.replace(/\D/g, '').length;
    requestAnimationFrame(() => onChange(formatted));
  };

  return (
    <div className="relative">
      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        ref={inputRef}
        type="tel"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={className || "w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"}
        placeholder={placeholder}
        required={required}
        maxLength={18} // +X (XXX) XXX XX XX = 18 characters
      />
    </div>
  );
});
PhoneInput.displayName = 'PhoneInput';

// Generic memoized input component for smooth typing
const FormInput = memo(({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  minLength,
  className,
  icon: Icon
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    requestAnimationFrame(() => onChange(newValue));
  };

  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
      <input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={handleChange}
        className={className || `w-full ${Icon ? 'pl-12' : 'px-4'} pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors`}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
    </div>
  );
});
FormInput.displayName = 'FormInput';

// Memoized input component that uses local state for instant typing
// Parent state updates happen in background without blocking UI
const SpecializationInput = memo(({
  value,
  index,
  onChange,
  placeholder,
  showRemove,
  onRemove
}: {
  value: string;
  index: number;
  onChange: (index: number, value: string) => void;
  placeholder: string;
  showRemove: boolean;
  onRemove: (index: number) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop changes (e.g., when editing different staff)
  useEffect(() => {
    // Only sync if input is not focused to avoid overwriting while typing
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Handle input change - update local immediately, parent async
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Update parent in next tick to not block typing
    requestAnimationFrame(() => {
      onChange(index, newValue);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          placeholder={placeholder}
        />
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          title="Удалить специализацию"
        >
          <Minus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});
SpecializationInput.displayName = 'SpecializationInput';

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
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'doctor' as 'doctor' | 'nurse',
    clinic_id: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    birth_date: '',
    address: '',
    city: '',
    language: 'ru' as 'kz' | 'ru' | 'en' | 'other',
    years_of_experience: '',
    offline_consultation_price: '',
    online_consultation_price: '',
    preferred_consultation_duration: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationKey, setValidationKey] = useState(0);

  // Work schedule state - each day can have its own time range
  const [workSchedule, setWorkSchedule] = useState<{
    [key: string]: { start: string; end: string; enabled: boolean };
  }>({
    monday: { start: '09:00', end: '18:00', enabled: false },
    tuesday: { start: '09:00', end: '18:00', enabled: false },
    wednesday: { start: '09:00', end: '18:00', enabled: false },
    thursday: { start: '09:00', end: '18:00', enabled: false },
    friday: { start: '09:00', end: '18:00', enabled: false },
    saturday: { start: '10:00', end: '14:00', enabled: false },
    sunday: { start: '10:00', end: '14:00', enabled: false },
  });

  // Separate state for specializations to avoid re-rendering entire form on each keystroke
  const [specializations, setSpecializations] = useState<string[]>(['']);

  // Days of the week
  const daysOfWeek = [
    { value: 'monday', labelRu: 'Понедельник', labelShort: 'Пн' },
    { value: 'tuesday', labelRu: 'Вторник', labelShort: 'Вт' },
    { value: 'wednesday', labelRu: 'Среда', labelShort: 'Ср' },
    { value: 'thursday', labelRu: 'Четверг', labelShort: 'Чт' },
    { value: 'friday', labelRu: 'Пятница', labelShort: 'Пт' },
    { value: 'saturday', labelRu: 'Суббота', labelShort: 'Сб' },
    { value: 'sunday', labelRu: 'Воскресенье', labelShort: 'Вс' },
  ];

  // Toggle day selection
  const toggleDay = useCallback((day: string) => {
    setWorkSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      }
    }));
  }, []);

  // Update time for a specific day
  const updateDayTime = useCallback((day: string, field: 'start' | 'end', value: string) => {
    setWorkSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  }, []);

  // Helper functions for managing specializations array - using useCallback to prevent re-renders
  const handleSpecializationChange = useCallback((index: number, value: string) => {
    setSpecializations(prev => {
      const newSpecializations = [...prev];
      newSpecializations[index] = value;
      return newSpecializations;
    });
  }, []);

  const addSpecialization = useCallback(() => {
    setSpecializations(prev => [...prev, '']);
  }, []);

  const removeSpecialization = useCallback((index: number) => {
    setSpecializations(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

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

  const fetchStaff = async (deleted = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = deleted ? "/staff/?show_deleted=true" : "/staff/";
      const response = await api.get(url);
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

  useEffect(() => {
    if (validationKey === 0) return;
    const firstError = document.querySelector('.animate-shake');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [validationKey]);

  const clearError = (field: string) => {
    if (formErrors[field]) setFormErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.first_name.trim()) errors.first_name = 'Введите имя';
    if (!formData.last_name.trim()) errors.last_name = 'Введите фамилию';
    if (!formData.email.trim()) errors.email = 'Введите email';
    if (!formData.phone.trim()) errors.phone = 'Введите номер телефона';
    if (!showEditModal) {
      if (!formData.password.trim()) errors.password = 'Введите пароль';
      else if (formData.password.length < 8) errors.password = 'Минимум 8 символов';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Минимум 8 символов';
    }
    if (isGlobalAdmin && clinics.length > 0 && !formData.clinic_id) errors.clinic_id = 'Выберите клинику';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) setValidationKey(k => k + 1);
    return Object.keys(errors).length === 0;
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAddLoading(true);

    try {
      // Convert specializations array to comma-separated string (filter out empty values)
      const specializationString = specializations
        .map(s => s.trim())
        .filter(s => s)
        .join(', ');

      const payload = {
        ...formData,
        specialization: specializationString,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        city: formData.city || null,
        language: formData.language || 'ru',
        years_of_experience: formData.years_of_experience ? Number(formData.years_of_experience) : null,
        offline_consultation_price: formData.offline_consultation_price ? Number(formData.offline_consultation_price) : null,
        online_consultation_price: formData.online_consultation_price ? Number(formData.online_consultation_price) : null,
        preferred_consultation_duration: formData.preferred_consultation_duration ? Number(formData.preferred_consultation_duration) : null,
        work_schedule: workSchedule,
      };

      const response = await api.post("/staff/", payload);
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
        clinic_id: '',
        gender: '',
        birth_date: '',
        address: '',
        city: '',
        language: 'ru',
        years_of_experience: '',
        offline_consultation_price: '',
        online_consultation_price: '',
        preferred_consultation_duration: '',
      });
      setSpecializations(['']);
      setWorkSchedule({
        monday: { start: '09:00', end: '18:00', enabled: false },
        tuesday: { start: '09:00', end: '18:00', enabled: false },
        wednesday: { start: '09:00', end: '18:00', enabled: false },
        thursday: { start: '09:00', end: '18:00', enabled: false },
        friday: { start: '09:00', end: '18:00', enabled: false },
        saturday: { start: '10:00', end: '14:00', enabled: false },
        sunday: { start: '10:00', end: '14:00', enabled: false },
      });
      setFormErrors({});
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Error adding staff:", err);
      // Extract error message from backend response
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось добавить сотрудника";
      toast.error(errorMessage);
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
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось изменить статус сотрудника";
      toast.error(errorMessage);
    }
  };

  const handleEditClick = (member: StaffMember) => {
    setEditingMember(member);
    // Convert comma-separated specialization string to array
    const specializationsArray = member.specialization
      ? member.specialization.split(',').map(s => s.trim()).filter(s => s)
      : [''];
    // Ensure at least one empty input if no specializations
    if (specializationsArray.length === 0) {
      specializationsArray.push('');
    }
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: formatPhoneNumber(member.phone), // Format existing phone number
      password: '',
      role: member.role,
      clinic_id: member.clinic?.id?.toString() || '',
      gender: (member.gender || '') as '' | 'male' | 'female' | 'other',
      birth_date: member.birth_date || '',
      address: member.address || '',
      city: member.city || '',
      language: (member.language || 'ru') as 'kz' | 'ru' | 'en' | 'other',
      years_of_experience: member.years_of_experience?.toString() || '',
      offline_consultation_price: member.offline_consultation_price?.toString() || '',
      online_consultation_price: member.online_consultation_price?.toString() || '',
      preferred_consultation_duration: member.preferred_consultation_duration?.toString() || '',
    });
    setSpecializations(specializationsArray);
    setWorkSchedule(member.work_schedule || {
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!validateForm()) return;

    setEditLoading(true);

    try {
      // Convert specializations array to comma-separated string (filter out empty values)
      const specializationString = specializations
        .map(s => s.trim())
        .filter(s => s)
        .join(', ');

      // Don't send password if it's empty
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        specialization: specializationString,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        city: formData.city || null,
        language: formData.language || 'ru',
        years_of_experience: formData.years_of_experience ? Number(formData.years_of_experience) : null,
        offline_consultation_price: formData.offline_consultation_price ? Number(formData.offline_consultation_price) : null,
        online_consultation_price: formData.online_consultation_price ? Number(formData.online_consultation_price) : null,
        preferred_consultation_duration: formData.preferred_consultation_duration ? Number(formData.preferred_consultation_duration) : null,
        work_schedule: workSchedule,
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
      setFormErrors({});
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'doctor',
        clinic_id: '',
        gender: '',
        birth_date: '',
        address: '',
        city: '',
        language: 'ru',
        years_of_experience: '',
        offline_consultation_price: '',
        online_consultation_price: '',
        preferred_consultation_duration: '',
      });
      setSpecializations(['']);
      setWorkSchedule({
        monday: { start: '09:00', end: '18:00', enabled: false },
        tuesday: { start: '09:00', end: '18:00', enabled: false },
        wednesday: { start: '09:00', end: '18:00', enabled: false },
        thursday: { start: '09:00', end: '18:00', enabled: false },
        friday: { start: '09:00', end: '18:00', enabled: false },
        saturday: { start: '10:00', end: '14:00', enabled: false },
        sunday: { start: '10:00', end: '14:00', enabled: false },
      });
    } catch (err: any) {
      console.error("Error updating staff:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось обновить данные сотрудника";
      toast.error(errorMessage);
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

      // Refetch active staff so the deleted member disappears
      await fetchStaff(showDeleted);

      toast.success(`${deletingMember.first_name} ${deletingMember.last_name} успешно удален(а)!`);

      // Close modal and reset
      setShowDeleteModal(false);
      setDeletingMember(null);
    } catch (err: any) {
      console.error("Error deleting staff:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось удалить сотрудника";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async (member: StaffMember) => {
    try {
      await api.patch(`/staff/${member.id}/`, { is_deleted: false });
      await fetchStaff(true);
      toast.success(`${member.first_name} ${member.last_name} успешно восстановлен(а)!`);
    } catch (err: any) {
      console.error("Error restoring staff:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось восстановить сотрудника";
      toast.error(errorMessage);
    }
  };

  // Handle overlay click - only close if it's a real click, not text selection
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownTarget(e.target);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if mousedown and mouseup happened on the same overlay element
    // This prevents closing when user is selecting text and drags outside
    if (e.target === e.currentTarget && mouseDownTarget === e.target) {
      setShowAddModal(false);
      setShowEditModal(false);
      setShowDeleteModal(false);
      setEditingMember(null);
      setFormErrors({});
      setDeletingMember(null);
    }
    setMouseDownTarget(null);
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
            onClick={() => { const next = !showDeleted; setShowDeleted(next); fetchStaff(next); }}
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

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {showDeleted ? (
                        /* Restore button only for deleted staff */
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRestore(member)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300"
                          title="Восстановить сотрудника"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">Восстановить</span>
                        </motion.button>
                      ) : (
                        <>
                          {/* Status Toggle Button */}
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
                        </>
                      )}
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
            onMouseDown={handleOverlayMouseDown}
            onClick={handleOverlayClick}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
                    Добавить Сотрудника
                  </h2>
                  <p className="text-gray-600 mt-1">Заполните форму для добавления нового доктора или медсестры</p>
                </div>
                <button
                  onClick={() => { setShowAddModal(false); setFormErrors({}); }}
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
                        value={formData.first_name}
                        onChange={(e) => { setFormData({ ...formData, first_name: e.target.value }); clearError('first_name'); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.first_name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="Введите имя"
                      />
                      {formErrors.first_name && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Фамилия <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => { setFormData({ ...formData, last_name: e.target.value }); clearError('last_name'); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.last_name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="Введите фамилию"
                      />
                      {formErrors.last_name && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
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
                        value={formData.email}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearError('email'); }}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${formErrors.email ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="example@clinic.kz"
                      />
                    </div>
                    {formErrors.email && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => { setFormData({ ...formData, phone: value }); clearError('phone'); }}
                      placeholder="+7 (700) 123 45 67"
                      className={formErrors.phone ? 'w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red-500 focus:border-blue-500 focus:outline-none transition-colors' : undefined}
                    />
                    {formErrors.phone && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.phone}</p>}
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
                        value={formData.password}
                        onChange={(e) => { setFormData({ ...formData, password: e.target.value }); clearError('password'); }}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${formErrors.password ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="Минимум 8 символов"
                        minLength={8}
                      />
                    </div>
                    {formErrors.password && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.password}</p>}
                  </div>

                  {/* Gender and Birth Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Пол
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as '' | 'male' | 'female' | 'other' })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                      >
                        <option value="">Не указан</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="other">Другой</option>
                      </select>
                    </div>
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
                  </div>

                  {/* Address and City */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Адрес
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="Улица, дом"
                        />
                      </div>
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
                        placeholder="Например: Алматы"
                      />
                    </div>
                  </div>

                  {/* Language and Experience */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Язык
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value as 'kz' | 'ru' | 'en' | 'other' })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                        >
                          <option value="ru">Русский</option>
                          <option value="kz">Казахский</option>
                          <option value="en">Английский</option>
                          <option value="other">Другой</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Опыт работы (лет)
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="70"
                          value={formData.years_of_experience}
                          onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Consultation Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Цена оффлайн консультации
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.offline_consultation_price}
                          onChange={(e) => setFormData({ ...formData, offline_consultation_price: e.target.value })}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₸</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Цена онлайн консультации
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.online_consultation_price}
                          onChange={(e) => setFormData({ ...formData, online_consultation_price: e.target.value })}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₸</span>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Consultation Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Длительность консультации
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        value={formData.preferred_consultation_duration}
                        onChange={(e) => setFormData({ ...formData, preferred_consultation_duration: e.target.value })}
                        className="w-full pl-4 pr-16 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="30"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">минут</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Рекомендуемая длительность одной консультации (5-180 минут)
                    </p>
                  </div>

                  {/* Work Schedule - Days and Times */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      График работы (дни и время приема)
                    </label>
                    <div className="space-y-3">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.value}
                          className={`rounded-xl border-2 p-4 transition-all ${
                            workSchedule[day.value]?.enabled
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Day Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all font-semibold text-sm ${
                                workSchedule[day.value]?.enabled
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                              }`}
                              title={day.labelRu}
                            >
                              {day.labelShort}
                            </button>

                            {/* Day Name */}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-700">{day.labelRu}</p>
                            </div>

                            {/* Time Inputs (only shown when enabled) */}
                            {workSchedule[day.value]?.enabled && (
                              <div className="flex items-center gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">С</label>
                                  <input
                                    type="time"
                                    value={workSchedule[day.value]?.start || '09:00'}
                                    onChange={(e) => updateDayTime(day.value, 'start', e.target.value)}
                                    className="w-32 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                  />
                                </div>
                                <div className="text-gray-400 pt-5">—</div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">До</label>
                                  <input
                                    type="time"
                                    value={workSchedule[day.value]?.end || '18:00'}
                                    onChange={(e) => updateDayTime(day.value, 'end', e.target.value)}
                                    className="w-32 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      💡 Нажмите на день недели, чтобы включить/выключить. Укажите время работы для каждого активного дня.
                    </p>
                    {Object.values(workSchedule).filter(d => d.enabled).length > 0 && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        ✓ Рабочих дней: {Object.values(workSchedule).filter(d => d.enabled).length}
                      </p>
                    )}
                  </div>

                  {/* Specialization - Multiple inputs with + and - buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Специализация
                      </label>
                      <button
                        type="button"
                        onClick={addSpecialization}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-3">
                      {specializations.map((spec, index) => (
                        <SpecializationInput
                          key={index}
                          value={spec}
                          index={index}
                          onChange={handleSpecializationChange}
                          placeholder={formData.role === 'doctor' ? 'Например: Кардиолог' : 'Например: Процедурная медсестра'}
                          showRemove={specializations.length > 1}
                          onRemove={removeSpecialization}
                        />
                      ))}
                    </div>
                    {specializations.length > 0 && specializations.some(s => s.trim()) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Добавлено специализаций: {specializations.filter(s => s.trim()).length}
                      </p>
                    )}
                  </div>

                  {/* Clinic Selection/Display */}
                  {isGlobalAdmin ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника {clinics.length > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={formData.clinic_id}
                        onChange={(e) => { setFormData({ ...formData, clinic_id: e.target.value }); clearError('clinic_id'); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.clinic_id ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                      >
                        <option value="">Выберите клинику</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.clinic_id && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.clinic_id}</p>}
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
                        {(user.clinic?.id === 913 || user.clinic?.name?.toLowerCase().includes('ayala')) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-blue-200 shadow-md">
                            <Image src={ayalaClinicLogo} alt="Ayala Clinic" width={80} height={28} className="object-contain" priority={false} />
                          </div>
                        ) : (user.clinic?.name?.toLowerCase().includes('bn') || user.clinic?.name?.toLowerCase().includes('бн')) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-blue-200 shadow-md">
                            <Image src={bnClinicLogo} alt="BN Clinic" width={80} height={28} className="object-contain" priority={false} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
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
                    onClick={() => { setShowAddModal(false); setFormErrors({}); }}
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
            onMouseDown={handleOverlayMouseDown}
            onClick={handleOverlayClick}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
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
                    setFormErrors({});
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
                        value={formData.first_name}
                        onChange={(e) => { setFormData({ ...formData, first_name: e.target.value }); clearError('first_name'); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.first_name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="Введите имя"
                      />
                      {formErrors.first_name && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Фамилия <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => { setFormData({ ...formData, last_name: e.target.value }); clearError('last_name'); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.last_name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="Введите фамилию"
                      />
                      {formErrors.last_name && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
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
                        value={formData.email}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearError('email'); }}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${formErrors.email ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="example@clinic.kz"
                      />
                    </div>
                    {formErrors.email && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => { setFormData({ ...formData, phone: value }); clearError('phone'); }}
                      placeholder="+7 (700) 123 45 67"
                      className={formErrors.phone ? 'w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red-500 focus:border-blue-500 focus:outline-none transition-colors' : undefined}
                    />
                    {formErrors.phone && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.phone}</p>}
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

                  {/* Gender and Birth Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Пол
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as '' | 'male' | 'female' | 'other' })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                      >
                        <option value="">Не указан</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="other">Другой</option>
                      </select>
                    </div>
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
                  </div>

                  {/* Address and City */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Адрес
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="Улица, дом"
                        />
                      </div>
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
                        placeholder="Например: Алматы"
                      />
                    </div>
                  </div>

                  {/* Language and Experience */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Язык
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value as 'kz' | 'ru' | 'en' | 'other' })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                        >
                          <option value="ru">Русский</option>
                          <option value="kz">Казахский</option>
                          <option value="en">Английский</option>
                          <option value="other">Другой</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Опыт работы (лет)
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="70"
                          value={formData.years_of_experience}
                          onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Consultation Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Цена оффлайн консультации
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.offline_consultation_price}
                          onChange={(e) => setFormData({ ...formData, offline_consultation_price: e.target.value })}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₸</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Цена онлайн консультации
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.online_consultation_price}
                          onChange={(e) => setFormData({ ...formData, online_consultation_price: e.target.value })}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₸</span>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Consultation Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Длительность консультации
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        value={formData.preferred_consultation_duration}
                        onChange={(e) => setFormData({ ...formData, preferred_consultation_duration: e.target.value })}
                        className="w-full pl-4 pr-16 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="30"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">минут</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Рекомендуемая длительность одной консультации (5-180 минут)
                    </p>
                  </div>

                  {/* Work Schedule - Days and Times */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      График работы (дни и время приема)
                    </label>
                    <div className="space-y-3">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.value}
                          className={`rounded-xl border-2 p-4 transition-all ${
                            workSchedule[day.value]?.enabled
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Day Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all font-semibold text-sm ${
                                workSchedule[day.value]?.enabled
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                              }`}
                              title={day.labelRu}
                            >
                              {day.labelShort}
                            </button>

                            {/* Day Name */}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-700">{day.labelRu}</p>
                            </div>

                            {/* Time Inputs (only shown when enabled) */}
                            {workSchedule[day.value]?.enabled && (
                              <div className="flex items-center gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">С</label>
                                  <input
                                    type="time"
                                    value={workSchedule[day.value]?.start || '09:00'}
                                    onChange={(e) => updateDayTime(day.value, 'start', e.target.value)}
                                    className="w-32 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                  />
                                </div>
                                <div className="text-gray-400 pt-5">—</div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">До</label>
                                  <input
                                    type="time"
                                    value={workSchedule[day.value]?.end || '18:00'}
                                    onChange={(e) => updateDayTime(day.value, 'end', e.target.value)}
                                    className="w-32 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      💡 Нажмите на день недели, чтобы включить/выключить. Укажите время работы для каждого активного дня.
                    </p>
                    {Object.values(workSchedule).filter(d => d.enabled).length > 0 && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        ✓ Рабочих дней: {Object.values(workSchedule).filter(d => d.enabled).length}
                      </p>
                    )}
                  </div>

                  {/* Specialization - Multiple inputs with + and - buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Специализация
                      </label>
                      <button
                        type="button"
                        onClick={addSpecialization}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-3">
                      {specializations.map((spec, index) => (
                        <SpecializationInput
                          key={index}
                          value={spec}
                          index={index}
                          onChange={handleSpecializationChange}
                          placeholder={formData.role === 'doctor' ? 'Например: Кардиолог' : 'Например: Процедурная медсестра'}
                          showRemove={specializations.length > 1}
                          onRemove={removeSpecialization}
                        />
                      ))}
                    </div>
                    {specializations.length > 0 && specializations.some(s => s.trim()) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Добавлено специализаций: {specializations.filter(s => s.trim()).length}
                      </p>
                    )}
                  </div>

                  {/* Clinic Selection/Display */}
                  {isGlobalAdmin ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Клиника {clinics.length > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={formData.clinic_id}
                        onChange={(e) => { setFormData({ ...formData, clinic_id: e.target.value }); clearError('clinic_id'); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.clinic_id ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                      >
                        <option value="">Выберите клинику</option>
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
                        {((editingMember.clinic?.id === 913 || editingMember.clinic?.name?.toLowerCase().includes('ayala')) ||
                          (!editingMember.clinic && (user.clinic?.id === 913 || user.clinic?.name?.toLowerCase().includes('ayala')))) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-blue-200 shadow-md">
                            <Image src={ayalaClinicLogo} alt="Ayala Clinic" width={80} height={28} className="object-contain" priority={false} />
                          </div>
                        ) : ((editingMember.clinic?.name?.toLowerCase().includes('bn') || editingMember.clinic?.name?.toLowerCase().includes('бн')) ||
                          (!editingMember.clinic && (user.clinic?.name?.toLowerCase().includes('bn') || user.clinic?.name?.toLowerCase().includes('бн')))) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-blue-200 shadow-md">
                            <Image src={bnClinicLogo} alt="BN Clinic" width={80} height={28} className="object-contain" priority={false} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
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
            onMouseDown={handleOverlayMouseDown}
            onClick={handleOverlayClick}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
