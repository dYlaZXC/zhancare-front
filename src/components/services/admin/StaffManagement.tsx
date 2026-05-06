"use client";

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
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
  RotateCcw,
  Video,
  Home,
  ChevronDown,
  Clock,
  Ban,
  History
} from "lucide-react";


import ScheduleTypeSelector from "./schedule/components/ScheduleTypeSelector";
import PhoneInputUI from "@/components/ui/PhoneInput";

/**
 * Staff member interface representing doctors and nurses.
 *
 * Note: The backend uses profile models (DoctorProfile/NurseProfile) to store
 * role-specific fields like availability_status, clinic, pricing, and schedules.
 * The API flattens this data for backward compatibility, so all fields appear
 * at the top level in the response.
 */
interface StaffMember {
  // Basic user fields
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'nurse';
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
  address?: string | null;
  city?: string | null;
  language?: string[] | null;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;

  // Profile fields (from DoctorProfile/NurseProfile)
  specialization?: string;
  years_of_experience?: number | null;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
  clinic?: {
    id: number;
    name: string;
    logo?: string | null;
  } | null;

  // Pricing and scheduling (from profile)
  offline_consultation_price?: number;
  online_consultation_price?: number;
  preferred_consultation_duration?: number; // in minutes
  room_number?: string | null;
  schedule_type?: 'weekly' | 'constant'; // Type of schedule: weekly (different each day) or constant (same every day)
  work_schedule?: {
    [key: string]: { // day name as key
      start: string; // HH:MM format
      end: string; // HH:MM format
      enabled: boolean;
    };
  };
  online_work_schedule?: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  offline_work_schedule?: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  weekly_schedules?: {
    [weekStartDate: string]: { // ISO date string (Monday of week)
      online: {
        [key: string]: {
          start: string;
          end: string;
          enabled: boolean;
        };
      };
      offline: {
        [key: string]: {
          start: string;
          end: string;
          enabled: boolean;
        };
      };
    };
  };
  schedules?: Array<{
    id?: number;
    consultation_type: 'online' | 'offline';
    weekday: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMember, setScheduleMember] = useState<StaffMember | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleModalTab, setScheduleModalTab] = useState<'schedule' | 'template' | 'history'>('schedule');
  const [scheduleHistory, setScheduleHistory] = useState<any[]>([]);
  // Week planner state
  const [plannerWeekStart, setPlannerWeekStart] = useState<string>(''); // ISO date of Monday
  const [plannerConsultationType, setPlannerConsultationType] = useState<'online' | 'offline'>('online');
  const [plannerDays, setPlannerDays] = useState<any[]>([]); // 7-day array from API
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerDirty, setPlannerDirty] = useState(false); // unsaved changes in current week
  // Overrides kept for legacy tab (renamed to template)
  const [overrides, setOverrides] = useState<any[]>([]);
  const [overrideForm, setOverrideForm] = useState({ date: '', consultation_type: 'online', is_day_off: false, start_time: '09:00', end_time: '18:00', note: '' });
  const [overrideSaving, setOverrideSaving] = useState(false);
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
    language: ['ru'] as string[],  // Changed to array
    years_of_experience: '',
    offline_consultation_price: '',
    online_consultation_price: '',
    preferred_consultation_duration: '',
    room_number: '',
    schedule_type: 'weekly' as 'weekly' | 'constant',  // Schedule type for doctors
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationKey, setValidationKey] = useState(0);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

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

  // Online work schedule - for online consultations
  const [onlineWorkSchedule, setOnlineWorkSchedule] = useState<{
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

  // Offline work schedule - for offline/home consultations
  const [offlineWorkSchedule, setOfflineWorkSchedule] = useState<{
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

  // Schedule type switcher state - 'online' or 'offline'
  const [scheduleType, setScheduleType] = useState<'online' | 'offline'>('online');

  // Weekly schedule navigation
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Weekly schedules - stores schedules by week start date (Monday)
  const [weeklySchedules, setWeeklySchedules] = useState<{
    [weekStartDate: string]: {
      online: { [key: string]: { start: string; end: string; enabled: boolean } };
      offline: { [key: string]: { start: string; end: string; enabled: boolean } };
    };
  }>({});

  // Days of the week
  const daysOfWeek = [
    { value: 'monday', labelRu: 'Понедельник', labelShort: 'Пн', dayIndex: 1 },
    { value: 'tuesday', labelRu: 'Вторник', labelShort: 'Вт', dayIndex: 2 },
    { value: 'wednesday', labelRu: 'Среда', labelShort: 'Ср', dayIndex: 3 },
    { value: 'thursday', labelRu: 'Четверг', labelShort: 'Чт', dayIndex: 4 },
    { value: 'friday', labelRu: 'Пятница', labelShort: 'Пт', dayIndex: 5 },
    { value: 'saturday', labelRu: 'Суббота', labelShort: 'Сб', dayIndex: 6 },
    { value: 'sunday', labelRu: 'Воскресенье', labelShort: 'Вс', dayIndex: 0 },
  ];

  // Get Monday of a week given an offset from current week
  const getWeekStartDate = useCallback((weekOffset: number): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get Monday of current week
    const currentWeekMonday = new Date(today);
    const dayOfWeek = currentWeekMonday.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeekMonday.setDate(currentWeekMonday.getDate() + daysToMonday);

    // Add week offset
    const targetMonday = new Date(currentWeekMonday);
    targetMonday.setDate(currentWeekMonday.getDate() + (weekOffset * 7));

    // Return ISO date string (YYYY-MM-DD)
    return targetMonday.toLocaleDateString('sv-SE');
  }, []);

  // Get date for a day in the displayed week
  const getDateForDay = useCallback((dayIndex: number) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the Monday of current week
    const currentWeekMonday = new Date(today);
    const dayOfWeek = currentWeekMonday.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeekMonday.setDate(currentWeekMonday.getDate() + daysToMonday);

    // Calculate displayed week: current week + offset
    const displayedWeekStart = new Date(currentWeekMonday);
    displayedWeekStart.setDate(currentWeekMonday.getDate() + (currentWeekIndex * 7));

    // dayIndex: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // displayedWeekStart is Monday, so we just add offsets
    const targetDate = new Date(displayedWeekStart);
    // Convert dayIndex to offset: Mon=1->0, Tue=2->1, Wed=3->2, Thu=4->3, Fri=5->4, Sat=6->5, Sun=0->6
    const offsetFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    targetDate.setDate(displayedWeekStart.getDate() + offsetFromMonday);

    const day = targetDate.getDate();
    const month = targetDate.toLocaleDateString('ru-RU', { month: 'long' });
    return `${day} ${month}`;
  }, [currentWeekIndex]);

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

  // Toggle day selection for online schedule
  const toggleOnlineDay = useCallback((day: string) => {
    // Update onlineWorkSchedule for saving
    setOnlineWorkSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      }
    }));

    // Also update weeklySchedules for multi-week support
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    setWeeklySchedules(prev => {
      const currentWeekSchedule = prev[weekStartDate] || {
        online: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        },
        offline: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        }
      };

      return {
        ...prev,
        [weekStartDate]: {
          ...currentWeekSchedule,
          online: {
            ...currentWeekSchedule.online,
            [day]: {
              ...currentWeekSchedule.online[day],
              enabled: !currentWeekSchedule.online[day].enabled,
            }
          }
        }
      };
    });
  }, [currentWeekIndex, getWeekStartDate]);

  // Update time for online schedule
  const updateOnlineDayTime = useCallback((day: string, field: 'start' | 'end', value: string) => {
    const adjustTime = (currentDay: any) => {
      let newStart = field === 'start' ? value : currentDay.start;
      let newEnd = field === 'end' ? value : currentDay.end;
      let startMinutes = parseInt(newStart.split(':')[0]) * 60 + parseInt(newStart.split(':')[1]);
      let endMinutes = parseInt(newEnd.split(':')[0]) * 60 + parseInt(newEnd.split(':')[1]);

      if (endMinutes < startMinutes && endMinutes > 360) {
        if (field === 'end') {
          const adjustedStartMinutes = endMinutes - 60;
          if (adjustedStartMinutes >= 0) {
            newStart = `${String(Math.floor(adjustedStartMinutes / 60)).padStart(2, '0')}:${String(adjustedStartMinutes % 60).padStart(2, '0')}`;
            toast.info(`⏰ Время начала автоматически изменено на ${newStart}`);
          } else {
            const adjustedEndMinutes = startMinutes + 60;
            newEnd = `${String(Math.floor(adjustedEndMinutes / 60) % 24).padStart(2, '0')}:${String(adjustedEndMinutes % 60).padStart(2, '0')}`;
            toast.info(`⏰ Время окончания автоматически изменено на ${newEnd}`);
          }
        } else {
          const adjustedEndMinutes = startMinutes + 60;
          newEnd = `${String(Math.floor(adjustedEndMinutes / 60) % 24).padStart(2, '0')}:${String(adjustedEndMinutes % 60).padStart(2, '0')}`;
          toast.info(`⏰ Время окончания автоматически изменено на ${newEnd}`);
        }
      }
      return { start: newStart, end: newEnd };
    };

    // Update onlineWorkSchedule for saving
    setOnlineWorkSchedule(prev => {
      const adjusted = adjustTime(prev[day]);
      return {
        ...prev,
        [day]: { ...prev[day], ...adjusted }
      };
    });

    // Also update weeklySchedules for multi-week support
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    setWeeklySchedules(prev => {
      const currentWeekSchedule = prev[weekStartDate] || {
        online: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        },
        offline: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        }
      };

      const adjusted = adjustTime(currentWeekSchedule.online[day]);
      return {
        ...prev,
        [weekStartDate]: {
          ...currentWeekSchedule,
          online: {
            ...currentWeekSchedule.online,
            [day]: { ...currentWeekSchedule.online[day], ...adjusted }
          }
        }
      };
    });
  }, [currentWeekIndex, getWeekStartDate]);

  // Toggle day selection for offline schedule
  const toggleOfflineDay = useCallback((day: string) => {
    // Update offlineWorkSchedule for saving
    setOfflineWorkSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      }
    }));

    // Also update weeklySchedules for multi-week support
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    setWeeklySchedules(prev => {
      const currentWeekSchedule = prev[weekStartDate] || {
        online: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        },
        offline: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        }
      };

      return {
        ...prev,
        [weekStartDate]: {
          ...currentWeekSchedule,
          offline: {
            ...currentWeekSchedule.offline,
            [day]: {
              ...currentWeekSchedule.offline[day],
              enabled: !currentWeekSchedule.offline[day].enabled,
            }
          }
        }
      };
    });
  }, [currentWeekIndex, getWeekStartDate]);

  // Update time for offline schedule
  const updateOfflineDayTime = useCallback((day: string, field: 'start' | 'end', value: string) => {
    const adjustTime = (currentDay: any) => {
      let newStart = field === 'start' ? value : currentDay.start;
      let newEnd = field === 'end' ? value : currentDay.end;
      let startMinutes = parseInt(newStart.split(':')[0]) * 60 + parseInt(newStart.split(':')[1]);
      let endMinutes = parseInt(newEnd.split(':')[0]) * 60 + parseInt(newEnd.split(':')[1]);

      if (endMinutes < startMinutes && endMinutes > 360) {
        if (field === 'end') {
          const adjustedStartMinutes = endMinutes - 60;
          if (adjustedStartMinutes >= 0) {
            newStart = `${String(Math.floor(adjustedStartMinutes / 60)).padStart(2, '0')}:${String(adjustedStartMinutes % 60).padStart(2, '0')}`;
            toast.info(`⏰ Время начала автоматически изменено на ${newStart}`);
          } else {
            const adjustedEndMinutes = startMinutes + 60;
            newEnd = `${String(Math.floor(adjustedEndMinutes / 60) % 24).padStart(2, '0')}:${String(adjustedEndMinutes % 60).padStart(2, '0')}`;
            toast.info(`⏰ Время окончания автоматически изменено на ${newEnd}`);
          }
        } else {
          const adjustedEndMinutes = startMinutes + 60;
          newEnd = `${String(Math.floor(adjustedEndMinutes / 60) % 24).padStart(2, '0')}:${String(adjustedEndMinutes % 60).padStart(2, '0')}`;
          toast.info(`⏰ Время окончания автоматически изменено на ${newEnd}`);
        }
      }
      return { start: newStart, end: newEnd };
    };

    // Update offlineWorkSchedule for saving
    setOfflineWorkSchedule(prev => {
      const adjusted = adjustTime(prev[day]);
      return {
        ...prev,
        [day]: { ...prev[day], ...adjusted }
      };
    });

    // Also update weeklySchedules for multi-week support
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    setWeeklySchedules(prev => {
      const currentWeekSchedule = prev[weekStartDate] || {
        online: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        },
        offline: {
          monday: { start: '09:00', end: '18:00', enabled: false },
          tuesday: { start: '09:00', end: '18:00', enabled: false },
          wednesday: { start: '09:00', end: '18:00', enabled: false },
          thursday: { start: '09:00', end: '18:00', enabled: false },
          friday: { start: '09:00', end: '18:00', enabled: false },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false },
        }
      };

      const adjusted = adjustTime(currentWeekSchedule.offline[day]);
      return {
        ...prev,
        [weekStartDate]: {
          ...currentWeekSchedule,
          offline: {
            ...currentWeekSchedule.offline,
            [day]: { ...currentWeekSchedule.offline[day], ...adjusted }
          }
        }
      };
    });
  }, [currentWeekIndex, getWeekStartDate]);

  // Helper function to check if two time ranges overlap
  const timeRangesOverlap = useCallback((start1: string, end1: string, start2: string, end2: string): boolean => {
    // Convert time strings to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);

    // Handle case where end time is past midnight (e.g., 22:00 - 02:00)
    const adjustedEnd1 = end1Minutes < start1Minutes ? end1Minutes + 1440 : end1Minutes;
    const adjustedEnd2 = end2Minutes < start2Minutes ? end2Minutes + 1440 : end2Minutes;
    const adjustedStart1 = start1Minutes;
    const adjustedStart2 = start2Minutes;

    // Check for overlap: ranges overlap if one starts before the other ends
    return (adjustedStart1 < adjustedEnd2) && (adjustedStart2 < adjustedEnd1);
  }, []);

  // Function to check for schedule conflicts on a specific day
  const getScheduleConflict = useCallback((day: string, scheduleType: 'online' | 'offline'): boolean => {
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    const weekSchedule = weeklySchedules[weekStartDate];

    if (!weekSchedule) return false;

    const onlineSchedule = weekSchedule.online[day];
    const offlineSchedule = weekSchedule.offline[day];

    // Check if both schedules are enabled for this day
    if (onlineSchedule?.enabled && offlineSchedule?.enabled) {
      // Check if time ranges overlap
      return timeRangesOverlap(
        onlineSchedule.start,
        onlineSchedule.end,
        offlineSchedule.start,
        offlineSchedule.end
      );
    }

    return false;
  }, [weeklySchedules, currentWeekIndex, getWeekStartDate, timeRangesOverlap]);

  // Get current online schedule for displayed week
  const getCurrentOnlineSchedule = useCallback(() => {
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    const weekSchedule = weeklySchedules[weekStartDate];

    if (weekSchedule?.online) {
      return weekSchedule.online;
    }

    // Return default schedule if no schedule exists for this week
    return {
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    };
  }, [weeklySchedules, currentWeekIndex, getWeekStartDate]);

  const getCurrentOfflineSchedule = useCallback(() => {
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    const weekSchedule = weeklySchedules[weekStartDate];

    if (weekSchedule?.offline) {
      return weekSchedule.offline;
    }

    // Return default schedule if no schedule exists for this week
    return {
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    };
  }, [weeklySchedules, currentWeekIndex, getWeekStartDate]);

  // Get all days with conflicts
  const getConflictDays = useCallback((): string[] => {
    const conflicts: string[] = [];
    daysOfWeek.forEach(day => {
      if (getScheduleConflict(day.value, 'online')) {
        conflicts.push(day.value);
      }
    });
    return conflicts;
  }, [daysOfWeek, getScheduleConflict]);

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

  const refreshStaffMember = async (memberId: number) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/`);
      setStaff(prev => prev.map(m => m.id === memberId ? { ...m, ...data } : m));
    } catch { /* silent */ }
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

  // Reset form to initial state
  const resetForm = () => {
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
      language: ['ru'],
      years_of_experience: '',
      offline_consultation_price: '',
      online_consultation_price: '',
      preferred_consultation_duration: '',
      room_number: '',
      schedule_type: 'weekly',
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
    setOnlineWorkSchedule({
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    });
    setOfflineWorkSchedule({
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    });

    // Reset weekly schedules and navigation
    setCurrentWeekIndex(0);
    setWeeklySchedules({});

    setFormErrors({});
    setScheduleType('online');
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

    // ✅ Validate consultation duration for doctors
    if (formData.role === 'doctor') {
      const duration = formData.preferred_consultation_duration;
      if (!duration || Number(duration) < 5 || Number(duration) > 180) {
        errors.preferredConsultationDuration = 'Укажите длительность консультации (5-180 минут)';
      }

    }

    // ✅ Clinic is optional - global admins can choose to assign or not assign a clinic
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) setValidationKey(k => k + 1);
    return Object.keys(errors).length === 0;
  };

  // Convert weeklySchedules (JSON per-week format) → DoctorSchedule rows array
  const buildSchedulesArray = () => {
    const DAY_TO_WEEKDAY: Record<string, number> = {
      monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
      friday: 4, saturday: 5, sunday: 6,
    };
    // Merge all configured weeks — sort by week start date so later weeks override earlier ones
    // for the SAME day when explicitly enabled. Disabled days in a later week never remove
    // a day that was enabled in an earlier week (additive merge).
    const merged = new Map<string, { consultation_type: string; weekday: number; start_time: string; end_time: string; is_active: boolean }>();
    const sortedEntries = Object.entries(weeklySchedules).sort(([a], [b]) => a.localeCompare(b));
    for (const [, weekEntry] of sortedEntries) {
      for (const type of ['online', 'offline'] as const) {
        const dayMap = weekEntry[type];
        if (!dayMap) continue;
        for (const [day, cfg] of Object.entries(dayMap)) {
          const weekday = DAY_TO_WEEKDAY[day] ?? 0;
          const key = `${type}-${weekday}`;
          if (cfg.enabled) {
            // Later weeks override time settings for the same day
            merged.set(key, { consultation_type: type, weekday, start_time: cfg.start, end_time: cfg.end, is_active: true });
          }
          // Disabled in a later week does NOT remove a day enabled in an earlier week
        }
      }
    }
    return Array.from(merged.values());
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check for schedule conflicts
    const conflictDays = getConflictDays();
    if (conflictDays.length > 0) {
      toast.error(`⛔ Невозможно сохранить! Обнаружены конфликты расписания на ${conflictDays.length} ${conflictDays.length === 1 ? 'день' : 'дней'}. Пожалуйста, исправьте конфликты времени перед сохранением.`);
      return;
    }

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
        room_number: formData.room_number || null,
        schedules: buildSchedulesArray(),
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
        language: ['ru'],
        years_of_experience: '',
        offline_consultation_price: '',
        online_consultation_price: '',
        preferred_consultation_duration: '',
        room_number: '',
        schedule_type: 'weekly',
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
      setOnlineWorkSchedule({
        monday: { start: '09:00', end: '18:00', enabled: false },
        tuesday: { start: '09:00', end: '18:00', enabled: false },
        wednesday: { start: '09:00', end: '18:00', enabled: false },
        thursday: { start: '09:00', end: '18:00', enabled: false },
        friday: { start: '09:00', end: '18:00', enabled: false },
        saturday: { start: '10:00', end: '14:00', enabled: false },
        sunday: { start: '10:00', end: '14:00', enabled: false },
      });
      setOfflineWorkSchedule({
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
      language: Array.isArray(member.language) ? member.language : (member.language ? [member.language as string] : ['ru']),  // Handle both old string and new array format
      years_of_experience: member.years_of_experience?.toString() || '',
      offline_consultation_price: member.offline_consultation_price?.toString() || '',
      online_consultation_price: member.online_consultation_price?.toString() || '',
      preferred_consultation_duration: member.preferred_consultation_duration?.toString() || '',
      room_number: member.room_number || '',
      schedule_type: (member.schedule_type || 'weekly') as 'weekly' | 'constant',
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
    setOnlineWorkSchedule(member.online_work_schedule || member.work_schedule || {
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    });
    const loadedOfflineSchedule = member.offline_work_schedule || {
      monday: { start: '09:00', end: '18:00', enabled: false },
      tuesday: { start: '09:00', end: '18:00', enabled: false },
      wednesday: { start: '09:00', end: '18:00', enabled: false },
      thursday: { start: '09:00', end: '18:00', enabled: false },
      friday: { start: '09:00', end: '18:00', enabled: false },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false },
    };
    setOfflineWorkSchedule(loadedOfflineSchedule);

    // Build weeklySchedules from DoctorSchedule rows (new normalized model)
    const WEEKDAY_TO_NAME: Record<number, string> = {
      0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday',
      4: 'friday', 5: 'saturday', 6: 'sunday',
    };
    const defaultDay = (start: string, end: string, enabled = false) => ({ start, end, enabled });
    const emptyWeek = () => ({
      online: {
        monday: defaultDay('09:00', '18:00'), tuesday: defaultDay('09:00', '18:00'),
        wednesday: defaultDay('09:00', '18:00'), thursday: defaultDay('09:00', '18:00'),
        friday: defaultDay('09:00', '18:00'), saturday: defaultDay('10:00', '14:00'),
        sunday: defaultDay('10:00', '14:00'),
      },
      offline: {
        monday: defaultDay('09:00', '18:00'), tuesday: defaultDay('09:00', '18:00'),
        wednesday: defaultDay('09:00', '18:00'), thursday: defaultDay('09:00', '18:00'),
        friday: defaultDay('09:00', '18:00'), saturday: defaultDay('10:00', '14:00'),
        sunday: defaultDay('10:00', '14:00'),
      },
    });

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toLocaleDateString('sv-SE');

    const weekEntry = emptyWeek();
    const scheduleRows: Array<{ consultation_type: 'online' | 'offline'; weekday: number; start_time: string; end_time: string; is_active: boolean }> = member.schedules || [];
    for (const row of scheduleRows) {
      const dayName = WEEKDAY_TO_NAME[row.weekday];
      if (dayName && (row.consultation_type === 'online' || row.consultation_type === 'offline')) {
        (weekEntry[row.consultation_type] as Record<string, { start: string; end: string; enabled: boolean }>)[dayName] = { start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5), enabled: row.is_active };
      }
    }
    setWeeklySchedules({ [weekStartDate]: weekEntry });

    // Reset to current week
    setCurrentWeekIndex(0);

    setShowEditModal(true);
  };

  const buildWeeklySchedulesFromMember = (member: StaffMember) => {
    const WEEKDAY_TO_NAME: Record<number, string> = {
      0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday',
      4: 'friday', 5: 'saturday', 6: 'sunday',
    };
    const d = (start: string, end: string, enabled = false) => ({ start, end, enabled });
    const emptyWeek = () => ({
      online: { monday: d('09:00','18:00'), tuesday: d('09:00','18:00'), wednesday: d('09:00','18:00'), thursday: d('09:00','18:00'), friday: d('09:00','18:00'), saturday: d('10:00','14:00'), sunday: d('10:00','14:00') },
      offline: { monday: d('09:00','18:00'), tuesday: d('09:00','18:00'), wednesday: d('09:00','18:00'), thursday: d('09:00','18:00'), friday: d('09:00','18:00'), saturday: d('10:00','14:00'), sunday: d('10:00','14:00') },
    });
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toLocaleDateString('sv-SE');
    const weekEntry = emptyWeek();
    const rows: Array<{ consultation_type: 'online' | 'offline'; weekday: number; start_time: string; end_time: string; is_active: boolean }> = member.schedules || [];
    for (const row of rows) {
      const dayName = WEEKDAY_TO_NAME[row.weekday];
      if (dayName && (row.consultation_type === 'online' || row.consultation_type === 'offline')) {
        (weekEntry[row.consultation_type] as Record<string, { start: string; end: string; enabled: boolean }>)[dayName] = { start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5), enabled: row.is_active };
      }
    }
    return { [weekStartDate]: weekEntry };
  };

  const buildEmptyWeeklySchedules = () => {
    const d = (start: string, end: string) => ({ start, end, enabled: false });
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toLocaleDateString('sv-SE');
    return {
      [weekStartDate]: {
        online: { monday: d('09:00','18:00'), tuesday: d('09:00','18:00'), wednesday: d('09:00','18:00'), thursday: d('09:00','18:00'), friday: d('09:00','18:00'), saturday: d('10:00','14:00'), sunday: d('10:00','14:00') },
        offline: { monday: d('09:00','18:00'), tuesday: d('09:00','18:00'), wednesday: d('09:00','18:00'), thursday: d('09:00','18:00'), friday: d('09:00','18:00'), saturday: d('10:00','14:00'), sunday: d('10:00','14:00') },
      },
    };
  };

  const openScheduleModal = async (member: StaffMember) => {
    setScheduleMember(member);
    setShowScheduleModal(true);
    setScheduleModalTab('schedule');
    setOverrides([]);
    setScheduleHistory([]);
    setOverrideForm({ date: '', consultation_type: 'online', is_day_off: false, start_time: '09:00', end_time: '18:00', note: '' });
    setScheduleLoading(true);
    try {
      const response = await api.get(`/staff/${member.id}/`);
      const fresh: StaffMember = response.data;
      setScheduleMember(fresh);
      setFormData(prev => ({ ...prev, schedule_type: (fresh.schedule_type || 'weekly') as 'weekly' | 'constant' }));
      setWeeklySchedules(buildWeeklySchedulesFromMember(fresh));
    } catch {
      setFormData(prev => ({ ...prev, schedule_type: (member.schedule_type || 'weekly') as 'weekly' | 'constant' }));
      setWeeklySchedules(buildWeeklySchedulesFromMember(member));
    } finally {
      setCurrentWeekIndex(0);
      setScheduleLoading(false);
      setScheduleModalTab('schedule');
      // Init planner at current week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      today.setDate(today.getDate() + diff);
      const monday = today.toLocaleDateString('sv-SE');
      setPlannerWeekStart(monday);
      setPlannerConsultationType('online');
      fetchPlannerWeek(member.id, monday, 'online');
      fetchOverrides(member.id);
      fetchScheduleHistory(member.id);
    }
  };

  const fetchOverrides = async (memberId: number) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/schedule-overrides/`);
      setOverrides(data);
    } catch { setOverrides([]); }
  };

  const fetchScheduleHistory = async (memberId: number) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/schedule-history/`);
      setScheduleHistory(data);
    } catch { setScheduleHistory([]); }
  };

  const handleSaveOverride = async () => {
    if (!scheduleMember) return;
    if (!overrideForm.date) { alert('Выберите дату'); return; }
    if (!overrideForm.is_day_off && (!overrideForm.start_time || !overrideForm.end_time)) { alert('Укажите время'); return; }
    setOverrideSaving(true);
    try {
      await api.post(`/staff/${scheduleMember.id}/schedule-overrides/`, {
        ...overrideForm,
        start_time: overrideForm.is_day_off ? null : overrideForm.start_time,
        end_time: overrideForm.is_day_off ? null : overrideForm.end_time,
      });
      await fetchOverrides(scheduleMember.id);
      await fetchScheduleHistory(scheduleMember.id);
      setOverrideForm({ date: '', consultation_type: 'online', is_day_off: false, start_time: '09:00', end_time: '18:00', note: '' });
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Ошибка сохранения');
    } finally { setOverrideSaving(false); }
  };

  const handleDeleteOverride = async (overrideId: number) => {
    if (!scheduleMember) return;
    try {
      await api.delete(`/staff/${scheduleMember.id}/schedule-overrides/${overrideId}/`);
      setOverrides(prev => prev.filter(o => o.id !== overrideId));
      await fetchScheduleHistory(scheduleMember.id);
    } catch { alert('Ошибка удаления'); }
  };

  // ---- Week planner helpers ----
  const getMondayOf = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('sv-SE');
  };

  const addDays = (dateStr: string, n: number): string => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString('sv-SE');
  };

  const formatWeekLabel = (mondayStr: string): string => {
    const start = new Date(mondayStr + 'T00:00:00');
    const end = new Date(mondayStr + 'T00:00:00');
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return `${fmt(start)} — ${fmt(end)}`;
  };

  const isCurrentWeekPlanner = (mondayStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(mondayStr + 'T00:00:00');
    const sunday = new Date(mondayStr + 'T00:00:00');
    sunday.setDate(sunday.getDate() + 6);
    return today >= monday && today <= sunday;
  };

  const buildDefaultWeek = (weekStart: string): any[] => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const dow = d.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;
      return {
        date: d.toLocaleDateString('sv-SE'),
        avail_id: null,
        is_day_off: isWeekend,
        start_time: isWeekend ? null : '09:00',
        end_time: isWeekend ? null : '18:00',
        note: '',
        source: 'empty',
      };
    });
  };

  const fetchPlannerWeek = async (memberId: number, weekStart: string, cType: string) => {
    setPlannerLoading(true);
    try {
      const { data } = await api.get(`/staff/${memberId}/availability/`, {
        params: { week_start: weekStart, consultation_type: cType },
      });
      setPlannerDays(data.length > 0 ? data : buildDefaultWeek(weekStart));
      setPlannerDirty(false);
    } catch { setPlannerDays(buildDefaultWeek(weekStart)); setPlannerDirty(false); }
    finally { setPlannerLoading(false); }
  };

  const handlePlannerWeekNav = async (offset: number) => {
    if (!scheduleMember) return;
    // Auto-save current week if it has unsaved changes
    if (plannerDirty && plannerDays.length > 0) {
      try {
        await Promise.all(plannerDays.map(day =>
          api.post(`/staff/${scheduleMember.id}/availability/`, {
            date: day.date,
            consultation_type: plannerConsultationType,
            is_day_off: day.is_day_off,
            start_time: day.is_day_off ? null : (day.start_time || '09:00'),
            end_time: day.is_day_off ? null : (day.end_time || '18:00'),
            note: day.note || '',
          })
        ));
        toast.success('Неделя сохранена автоматически');
      } catch { /* silent — user can retry on destination week */ }
    }
    const newWeek = addDays(plannerWeekStart, offset * 7);
    setPlannerWeekStart(newWeek);
    fetchPlannerWeek(scheduleMember.id, newWeek, plannerConsultationType);
  };

  const handlePlannerTypeChange = async (cType: 'online' | 'offline') => {
    if (!scheduleMember) return;
    if (plannerDirty && plannerDays.length > 0) {
      try {
        await Promise.all(plannerDays.map(day =>
          api.post(`/staff/${scheduleMember.id}/availability/`, {
            date: day.date,
            consultation_type: plannerConsultationType,
            is_day_off: day.is_day_off,
            start_time: day.is_day_off ? null : (day.start_time || '09:00'),
            end_time: day.is_day_off ? null : (day.end_time || '18:00'),
            note: day.note || '',
          })
        ));
      } catch { /* silent */ }
    }
    setPlannerConsultationType(cType);
    fetchPlannerWeek(scheduleMember.id, plannerWeekStart, cType);
  };

  const updatePlannerDay = (index: number, changes: Partial<any>) => {
    setPlannerDays(prev => prev.map((d, i) => i === index ? { ...d, ...changes } : d));
    setPlannerDirty(true);
  };

  const handleSavePlannerDay = async (day: any) => {
    if (!scheduleMember) return;
    try {
      if (day.is_day_off) {
        await api.post(`/staff/${scheduleMember.id}/availability/`, {
          date: day.date,
          consultation_type: plannerConsultationType,
          is_day_off: true,
          note: day.note || '',
        });
      } else {
        await api.post(`/staff/${scheduleMember.id}/availability/`, {
          date: day.date,
          consultation_type: plannerConsultationType,
          is_day_off: false,
          start_time: day.start_time || '09:00',
          end_time: day.end_time || '18:00',
          note: day.note || '',
        });
      }
      await fetchPlannerWeek(scheduleMember.id, plannerWeekStart, plannerConsultationType);
      await fetchScheduleHistory(scheduleMember.id);
      refreshStaffMember(scheduleMember.id);
      toast.success('Сохранено');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDeletePlannerDay = async (day: any) => {
    if (!scheduleMember || !day.avail_id) return;
    try {
      await api.delete(`/staff/${scheduleMember.id}/availability/${day.avail_id}/`);
      await fetchPlannerWeek(scheduleMember.id, plannerWeekStart, plannerConsultationType);
      toast.success('Сброшено к шаблону');
    } catch { toast.error('Ошибка'); }
  };

  const handleCopyWeek = async () => {
    if (!scheduleMember) return;
    const nextWeek = addDays(plannerWeekStart, 7);
    if (!confirm(`Скопировать расписание на неделю ${formatWeekLabel(nextWeek)}?`)) return;
    try {
      await api.post(`/staff/${scheduleMember.id}/availability/copy-week/`, {
        src_week_start: plannerWeekStart,
        dst_week_start: nextWeek,
        consultation_type: plannerConsultationType,
      });
      toast.success('Неделя скопирована');
    } catch { toast.error('Ошибка копирования'); }
  };

  const handleSaveEntireWeek = async () => {
    if (!scheduleMember) return;
    setPlannerSaving(true);
    try {
      await Promise.all(plannerDays.map(day =>
        api.post(`/staff/${scheduleMember.id}/availability/`, {
          date: day.date,
          consultation_type: plannerConsultationType,
          is_day_off: day.is_day_off,
          start_time: day.is_day_off ? null : (day.start_time || '09:00'),
          end_time: day.is_day_off ? null : (day.end_time || '18:00'),
          note: day.note || '',
        })
      ));
      await fetchPlannerWeek(scheduleMember.id, plannerWeekStart, plannerConsultationType);
      await fetchScheduleHistory(scheduleMember.id);
      setPlannerDirty(false);
      if (scheduleMember) refreshStaffMember(scheduleMember.id);
      toast.success('Неделя сохранена');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Ошибка сохранения');
    } finally { setPlannerSaving(false); }
  };

  const getPlannerWeekStatus = (): 'planned' | 'partial' | 'empty' => {
    if (plannerDays.length === 0) return 'empty';
    const withAvail = plannerDays.filter(d => d.source === 'availability');
    if (withAvail.length === 0) return 'empty';
    if (withAvail.length === plannerDays.length) return 'planned';
    return 'partial';
  };

  const handleSaveSchedule = async () => {
    if (!scheduleMember) return;

    const conflictDays = getConflictDays();
    if (conflictDays.length > 0) {
      toast.error(`⛔ Обнаружены конфликты расписания на ${conflictDays.length} ${conflictDays.length === 1 ? 'день' : 'дней'}. Исправьте конфликты перед сохранением.`);
      return;
    }

    setScheduleLoading(true);
    try {
      const response = await api.patch(`/staff/${scheduleMember.id}/`, {
        schedules: buildSchedulesArray(),
        schedule_type: formData.schedule_type,
      });
      const updatedStaff = response.data;
      setStaff(staff.map(m => m.id === scheduleMember.id ? updatedStaff : m));
      toast.success('Расписание успешно обновлено!');
      setShowScheduleModal(false);
      setScheduleMember(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Не удалось обновить расписание';
      toast.error(errorMessage);
    } finally {
      setScheduleLoading(false);
    }
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
        room_number: formData.room_number || null,
        schedules: buildSchedulesArray(),
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Include clinic_id for global admins
      if (isGlobalAdmin && formData.clinic_id) {
        updateData.clinic_id = formData.clinic_id;
      }

      // Debug: Log the schedule data being sent
      console.log('=== Sending schedule data to backend ===');
      console.log('Online schedule:', JSON.stringify(updateData.online_work_schedule, null, 2));
      console.log('Offline schedule:', JSON.stringify(updateData.offline_work_schedule, null, 2));
      console.log('Schedule type:', updateData.schedule_type);

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
      resetForm();
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
      setDeletingMember(null);
      resetForm();
    }
    setMouseDownTarget(null);
  };

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLanguageDropdownOpen]);

  // Helper function to check if a doctor/nurse has a configured schedule
  const hasConfiguredSchedule = (member: StaffMember): boolean => {
    if (member.role !== 'doctor' && member.role !== 'nurse') return false;

    // Check both online and offline schedules
    const onlineSchedule = member.online_work_schedule;
    const offlineSchedule = member.offline_work_schedule;

    // Check if at least one day is enabled in either schedule
    const hasOnlineSchedule = onlineSchedule && Object.values(onlineSchedule).some((day: any) =>
      typeof day === 'object' && day.enabled === true
    );

    const hasOfflineSchedule = offlineSchedule && Object.values(offlineSchedule).some((day: any) =>
      typeof day === 'object' && day.enabled === true
    );

    return !!(hasOnlineSchedule || hasOfflineSchedule);
  };

  // Filter and sort staff based on search and filters
  const filteredStaff = staff
    .filter((member) => {
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
    })
    .sort((a, b) => {
      // Sort by created_at descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
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
                          {/* Schedule status badges for doctors/nurses */}
                          {(member.role === 'doctor' || member.role === 'nurse') && (() => {
                            const activeSchedules = (member.schedules || []).filter((s: any) => s.is_active);
                            const hasOnline = activeSchedules.some((s: any) => s.consultation_type === 'online');
                            const hasOffline = activeSchedules.some((s: any) => s.consultation_type === 'offline');
                            const hasAvailability = (member as any).has_availability;
                            if (!hasOnline && !hasOffline && !hasAvailability) return (
                              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                <AlertCircle className="w-3 h-3" />
                                Нет расписания на эту неделю
                              </span>
                            );
                            return (<>
                              {hasOnline && (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Онлайн расписание
                                </span>
                              )}
                              {hasOffline && (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Офлайн расписание
                                </span>
                              )}
                            </>);
                          })()}
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
                              onClick={() => openScheduleModal(member)}
                              className="p-2.5 rounded-lg hover:bg-white transition-all group"
                              title="Расписание"
                            >
                              <Calendar className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
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
                    <PhoneInputUI
                      value={formData.phone}
                      onChange={(e164) => { setFormData({ ...formData, phone: e164 }); clearError('phone'); }}
                      placeholder="+7 (700) 123-45-67"
                      error={formErrors.phone || undefined}
                    />
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-600" />
                        Языки
                      </label>
                      <div className="relative" ref={languageDropdownRef}>
                        <div
                          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                          className="min-h-[3rem] px-4 py-2 border-2 border-gray-200 rounded-2xl bg-white flex flex-wrap items-center gap-2 cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          {formData.language.length > 0 ? (
                            formData.language.map((langValue) => {
                              const lang = [
                                { value: 'ru', label: 'Русский', emoji: '🇷🇺' },
                                { value: 'kz', label: 'Казахский', emoji: '🇰🇿' },
                                { value: 'en', label: 'Английский', emoji: '🇬🇧' },
                                { value: 'other', label: 'Другой', emoji: '🌍' },
                              ].find(l => l.value === langValue);
                              if (!lang) return null;
                              return (
                                <div
                                  key={lang.value}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{lang.emoji}</span>
                                  <span>{lang.label}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData({ ...formData, language: formData.language.filter(l => l !== lang.value) });
                                    }}
                                    className="ml-1 hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 text-sm">Выберите языки...</span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown */}
                        {isLanguageDropdownOpen && (
                          <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {[
                              { value: 'ru', label: 'Русский', emoji: '🇷🇺' },
                              { value: 'kz', label: 'Казахский', emoji: '🇰🇿' },
                              { value: 'en', label: 'Английский', emoji: '🇬🇧' },
                              { value: 'other', label: 'Другой', emoji: '🌍' },
                            ].map((lang) => {
                              const isSelected = formData.language.includes(lang.value);
                              return (
                                <button
                                  key={lang.value}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setFormData({ ...formData, language: formData.language.filter(l => l !== lang.value) });
                                    } else {
                                      setFormData({ ...formData, language: [...formData.language, lang.value] });
                                    }
                                  }}
                                  className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <span className="text-lg">{lang.emoji}</span>
                                  <span className="flex-1 text-sm font-medium">{lang.label}</span>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
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
                      Длительность консультации <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        value={formData.preferred_consultation_duration}
                        onChange={(e) => setFormData({ ...formData, preferred_consultation_duration: e.target.value })}
                        className={`w-full pl-4 pr-16 py-3 rounded-xl border-2 ${
                          formErrors.preferredConsultationDuration ? 'border-red-500' : 'border-gray-200'
                        } focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="30"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">минут</span>
                    </div>
                    {formErrors.preferredConsultationDuration && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.preferredConsultationDuration}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Рекомендуемая длительность одной консультации (5-180 минут)
                    </p>
                  </div>

                  {/* Room Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Номер кабинета
                    </label>
                    <input
                      type="text"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Например: 7B, 700, 7F-D"
                      maxLength={20}
                    />
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
                        {user.clinic?.logo ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-blue-200 shadow-md w-16 h-16 flex items-center justify-center">
                            <img src={user.clinic.logo} alt={user.clinic.name} className="w-full h-full object-contain" />
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
                    resetForm();
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
                    <PhoneInputUI
                      value={formData.phone}
                      onChange={(e164) => { setFormData({ ...formData, phone: e164 }); clearError('phone'); }}
                      placeholder="+7 (700) 123-45-67"
                      error={formErrors.phone || undefined}
                    />
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-600" />
                        Языки
                      </label>
                      <div className="relative" ref={languageDropdownRef}>
                        <div
                          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                          className="min-h-[3rem] px-4 py-2 border-2 border-gray-200 rounded-2xl bg-white flex flex-wrap items-center gap-2 cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          {formData.language.length > 0 ? (
                            formData.language.map((langValue) => {
                              const lang = [
                                { value: 'ru', label: 'Русский', emoji: '🇷🇺' },
                                { value: 'kz', label: 'Казахский', emoji: '🇰🇿' },
                                { value: 'en', label: 'Английский', emoji: '🇬🇧' },
                                { value: 'other', label: 'Другой', emoji: '🌍' },
                              ].find(l => l.value === langValue);
                              if (!lang) return null;
                              return (
                                <div
                                  key={lang.value}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{lang.emoji}</span>
                                  <span>{lang.label}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData({ ...formData, language: formData.language.filter(l => l !== lang.value) });
                                    }}
                                    className="ml-1 hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 text-sm">Выберите языки...</span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown */}
                        {isLanguageDropdownOpen && (
                          <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {[
                              { value: 'ru', label: 'Русский', emoji: '🇷🇺' },
                              { value: 'kz', label: 'Казахский', emoji: '🇰🇿' },
                              { value: 'en', label: 'Английский', emoji: '🇬🇧' },
                              { value: 'other', label: 'Другой', emoji: '🌍' },
                            ].map((lang) => {
                              const isSelected = formData.language.includes(lang.value);
                              return (
                                <button
                                  key={lang.value}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setFormData({ ...formData, language: formData.language.filter(l => l !== lang.value) });
                                    } else {
                                      setFormData({ ...formData, language: [...formData.language, lang.value] });
                                    }
                                  }}
                                  className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <span className="text-lg">{lang.emoji}</span>
                                  <span className="flex-1 text-sm font-medium">{lang.label}</span>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
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
                      Длительность консультации <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        value={formData.preferred_consultation_duration}
                        onChange={(e) => setFormData({ ...formData, preferred_consultation_duration: e.target.value })}
                        className={`w-full pl-4 pr-16 py-3 rounded-xl border-2 ${
                          formErrors.preferredConsultationDuration ? 'border-red-500' : 'border-gray-200'
                        } focus:border-blue-500 focus:outline-none transition-colors`}
                        placeholder="30"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">минут</span>
                    </div>
                    {formErrors.preferredConsultationDuration && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.preferredConsultationDuration}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Рекомендуемая длительность одной консультации (5-180 минут)
                    </p>
                  </div>

                  {/* Room Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Номер кабинета
                    </label>
                    <input
                      type="text"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Например: 7B, 700, 7F-D"
                      maxLength={20}
                    />
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
                        {(editingMember.clinic?.logo || user.clinic?.logo) ? (
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-blue-200 shadow-md w-16 h-16 flex items-center justify-center">
                            <img src={editingMember.clinic?.logo || user.clinic?.logo!} alt={editingMember.clinic?.name || user.clinic?.name} className="w-full h-full object-contain" />
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
                      resetForm();
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

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && scheduleMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => setMouseDownTarget(e.target)}
            onClick={(e) => {
              if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) {
                setShowScheduleModal(false);
                setScheduleMember(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{scheduleModalTab === "template" ? "Постоянное расписание" : "Расписание"}</h2>
                    <p className="text-sm text-gray-500">{scheduleMember.first_name} {scheduleMember.last_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowScheduleModal(false); setScheduleMember(null); }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="sticky top-[81px] z-10 bg-white flex border-b border-gray-100">
                {[
                  { key: 'schedule', label: 'По датам', icon: <Calendar className="w-4 h-4" /> },
                  { key: 'template', label: 'Постоянное', icon: <RotateCcw className="w-4 h-4" /> },
                  { key: 'history', label: 'История', icon: <History className="w-4 h-4" /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setScheduleModalTab(tab.key as any)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                      scheduleModalTab === tab.key
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">

                {/* ── PLANNER TAB (hidden) ── */}
                {scheduleModalTab === 'schedule' && (
                  <div className="space-y-4">
                    {/* Consultation type toggle */}
                    <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200">
                      <button type="button" onClick={() => handlePlannerTypeChange('online')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${plannerConsultationType === 'online' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Video className="w-4 h-4" /> Онлайн
                      </button>
                      <button type="button" onClick={() => handlePlannerTypeChange('offline')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${plannerConsultationType === 'offline' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Home className="w-4 h-4" /> Оффлайн
                      </button>
                    </div>

                    {/* Week nav */}
                    <div className="flex items-center justify-between bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-4 py-3">
                      <button type="button" onClick={() => handlePlannerWeekNav(-1)}
                        className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <span className="text-base">📅</span>
                        {plannerWeekStart ? formatWeekLabel(plannerWeekStart) : '...'}
                        {plannerWeekStart && isCurrentWeekPlanner(plannerWeekStart) && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Текущая</span>
                        )}
                      </div>
                      <button type="button" onClick={() => handlePlannerWeekNav(1)}
                        className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>

                    {/* Days */}
                    {plannerLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>
                    ) : (
                      <div className="space-y-2">
                        {plannerDays.map((day, i) => {
                          const d = new Date(day.date + 'T00:00:00');
                          const dayNames = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
                          const fullNames = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
                          const dateLabel = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                          const isFromAvail = day.source === 'availability';
                          const isOff = day.is_day_off;
                          return (
                            <div key={day.date} className={`rounded-xl border-2 p-3 transition-all ${
                              isOff ? 'border-gray-200 bg-gray-50' :
                              (plannerConsultationType === 'online' ? 'border-blue-400 bg-blue-50' : 'border-purple-400 bg-purple-50')
                            }`}>
                              <div className="flex items-center gap-3">
                                {/* Day toggle */}
                                <button type="button"
                                  onClick={() => {
                                    const nowOff = !isOff;
                                    updatePlannerDay(i, {
                                      is_day_off: nowOff,
                                      ...(nowOff ? {} : {
                                        start_time: day.start_time || '09:00',
                                        end_time: day.end_time || '18:00',
                                      }),
                                    });
                                  }}
                                  className={`flex-shrink-0 w-11 h-11 rounded-xl border-2 font-semibold text-xs transition-all ${
                                    isOff ? 'border-gray-300 bg-white text-gray-400' :
                                    isFromAvail ? (plannerConsultationType === 'online' ? 'border-blue-500 bg-blue-500 text-white' : 'border-purple-500 bg-purple-500 text-white') :
                                    'border-gray-300 bg-white text-gray-500'
                                  }`}>
                                  {dayNames[d.getDay()]}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-800">{fullNames[d.getDay()]}</span>
                                    <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">{dateLabel}</span>
                                    {day.source === 'template' && <span className="text-xs text-gray-300 italic">из шаблона</span>}
                                  </div>
                                  {isOff && <p className="text-xs text-gray-400 mt-0.5">Выходной</p>}
                                </div>
                                {!isOff && (
                                  <div className="flex items-center gap-2">
                                    <input type="time" value={day.start_time || '09:00'} step="900"
                                      onChange={e => updatePlannerDay(i, { start_time: e.target.value })}
                                      className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm" />
                                    <span className="text-gray-300">—</span>
                                    <input type="time" value={day.end_time || '18:00'} step="900"
                                      onChange={e => updatePlannerDay(i, { end_time: e.target.value })}
                                      className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm" />
                                  </div>
                                )}
                                {/* Action buttons */}
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => handleSavePlannerDay(day)}
                                    className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors" title="Сохранить">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  {isFromAvail && (
                                    <button type="button" onClick={() => handleDeletePlannerDay(day)}
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="Сброс к шаблону">
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TEMPLATE TAB (old weekday pattern) ── */}
                {scheduleLoading && scheduleModalTab === 'template' && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                )}
                {!scheduleLoading && scheduleModalTab === 'template' && <>
                {/* Schedule Type */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Тип расписания <span className="text-red-500">*</span>
                  </label>
                  <ScheduleTypeSelector
                    scheduleType={formData.schedule_type}
                    onChange={(type) => {
                      setFormData({ ...formData, schedule_type: type });
                      // If switching to the doctor's saved type → restore their schedule
                      // If switching to a different type → show empty (they have no schedule of that type)
                      if (type === (scheduleMember?.schedule_type || 'weekly')) {
                        setWeeklySchedules(buildWeeklySchedulesFromMember(scheduleMember!));
                      } else {
                        setWeeklySchedules(buildEmptyWeeklySchedules());
                      }
                      setCurrentWeekIndex(0);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-3">
                    💡 <strong>Недельное:</strong> разное расписание для каждого дня. <strong>Постоянное:</strong> одинаковое расписание каждый день.
                  </p>
                </div>

                {/* Week Navigation - only for weekly schedule */}
                {formData.schedule_type === 'weekly' && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-indigo-100">
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const currentWeekMonday = new Date(today);
                    const dayOfWeek = currentWeekMonday.getDay();
                    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                    currentWeekMonday.setDate(currentWeekMonday.getDate() + daysToMonday);
                    const displayedWeekStart = new Date(currentWeekMonday);
                    displayedWeekStart.setDate(currentWeekMonday.getDate() + (currentWeekIndex * 7));
                    const displayedWeekEnd = new Date(displayedWeekStart);
                    displayedWeekEnd.setDate(displayedWeekStart.getDate() + 6);
                    displayedWeekEnd.setHours(23, 59, 59, 999);
                    const formatDate = (date: Date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                    const isCurrentWeek = today >= displayedWeekStart && today <= displayedWeekEnd;
                    return (
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
                          className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all"
                          title="Предыдущая неделя"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          <span className="font-bold text-gray-800">{formatDate(displayedWeekStart)} — {formatDate(displayedWeekEnd)}</span>
                          {isCurrentWeek && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Текущая</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
                          className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all"
                          title="Следующая неделя"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    );
                  })()}
                </div>
                )}

                {/* Tab Switcher */}
                <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setScheduleType('online')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                      scheduleType === 'online'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span>Онлайн</span>
                    {Object.values(getCurrentOnlineSchedule()).filter(d => d.enabled).length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${scheduleType === 'online' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {Object.values(getCurrentOnlineSchedule()).filter(d => d.enabled).length}
                      </span>
                    )}
                    {getConflictDays().length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">⚠ {getConflictDays().length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('offline')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                      scheduleType === 'offline'
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span>Оффлайн</span>
                    {Object.values(getCurrentOfflineSchedule()).filter(d => d.enabled).length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${scheduleType === 'offline' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>
                        {Object.values(getCurrentOfflineSchedule()).filter(d => d.enabled).length}
                      </span>
                    )}
                    {getConflictDays().length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">⚠ {getConflictDays().length}</span>
                    )}
                  </button>
                </div>

                {/* Schedule Days */}
                <div className={`space-y-3 p-4 rounded-2xl ${scheduleType === 'online' ? 'bg-blue-50/40' : 'bg-purple-50/40'}`}>
                  {scheduleType === 'online' ? (
                    <p className="text-sm text-blue-700 font-medium mb-2">Настройте расписание для онлайн приемов</p>
                  ) : (
                    <p className="text-sm text-purple-700 font-medium mb-2">Настройте расписание для оффлайн приемов</p>
                  )}
                  {daysOfWeek.map((day) => {
                    const currentOnlineSchedule = getCurrentOnlineSchedule();
                    const currentOfflineSchedule = getCurrentOfflineSchedule();
                    const hasConflict = getScheduleConflict(day.value, scheduleType);
                    const isOnline = scheduleType === 'online';
                    const currentDaySchedule = isOnline ? currentOnlineSchedule : currentOfflineSchedule;
                    const otherSchedule = isOnline ? currentOfflineSchedule : currentOnlineSchedule;
                    const otherEnabled = otherSchedule[day.value]?.enabled;
                    const otherTime = otherEnabled ? `${otherSchedule[day.value]?.start} - ${otherSchedule[day.value]?.end}` : '';

                    return (
                      <div
                        key={day.value}
                        className={`rounded-xl border-2 p-4 transition-all bg-white ${
                          hasConflict
                            ? 'border-red-500 bg-red-50'
                            : currentDaySchedule[day.value]?.enabled
                            ? isOnline ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => isOnline ? toggleOnlineDay(day.value) : toggleOfflineDay(day.value)}
                            className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all font-semibold text-sm ${
                              hasConflict
                                ? 'border-red-500 bg-red-500 text-white'
                                : currentDaySchedule[day.value]?.enabled
                                ? isOnline ? 'border-blue-500 bg-blue-500 text-white' : 'border-purple-500 bg-purple-500 text-white'
                                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                            }`}
                            title={day.labelRu}
                          >
                            {day.labelShort}
                          </button>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700">
                              {day.labelRu}
                              {formData.schedule_type === 'weekly' && (
                                <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  {getDateForDay(day.dayIndex)}
                                </span>
                              )}
                            </p>
                            {otherEnabled && !currentDaySchedule[day.value]?.enabled && (
                              <p className={`text-xs mt-1 ${isOnline ? 'text-purple-600' : 'text-blue-600'}`}>
                                {isOnline ? '🏠 Оффлайн:' : '📱 Онлайн:'} {otherTime}
                              </p>
                            )}
                          </div>
                          {currentDaySchedule[day.value]?.enabled && (
                            <div className="flex items-center gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">С</label>
                                <input
                                  type="time"
                                  value={currentDaySchedule[day.value]?.start || '09:00'}
                                  onChange={(e) => isOnline
                                    ? updateOnlineDayTime(day.value, 'start', e.target.value)
                                    : updateOfflineDayTime(day.value, 'start', e.target.value)
                                  }
                                  step="900"
                                  className={`w-32 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm ${
                                    hasConflict
                                      ? 'border-red-300 focus:border-red-500'
                                      : isOnline ? 'border-gray-300 focus:border-blue-500' : 'border-gray-300 focus:border-purple-500'
                                  }`}
                                />
                              </div>
                              <div className="text-gray-400 pt-5">—</div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">До</label>
                                <input
                                  type="time"
                                  value={currentDaySchedule[day.value]?.end || '18:00'}
                                  onChange={(e) => isOnline
                                    ? updateOnlineDayTime(day.value, 'end', e.target.value)
                                    : updateOfflineDayTime(day.value, 'end', e.target.value)
                                  }
                                  step="900"
                                  className={`w-32 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm ${
                                    hasConflict
                                      ? 'border-red-300 focus:border-red-500'
                                      : isOnline ? 'border-gray-300 focus:border-blue-500' : 'border-gray-300 focus:border-purple-500'
                                  }`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        {hasConflict && (
                          <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                            <p className="text-xs text-red-800 font-semibold">
                              ⚠️ Конфликт времени! {isOnline ? 'Оффлайн' : 'Онлайн'} расписание: {otherTime}
                            </p>
                            <p className="text-xs text-red-700 mt-1">Измените время или отключите один из графиков</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Conflict warning */}
                {getConflictDays().length > 0 && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <p className="text-sm text-red-800 font-bold">⛔ Обнаружены конфликты расписания! ({getConflictDays().length} дней)</p>
                    <p className="text-xs text-red-700 mt-1">Исправьте конфликты перед сохранением.</p>
                  </div>
                )}
                </>}

                {/* Overrides Tab */}
                {false && (
                  <div className="space-y-6">
                    {/* Add Override Form */}
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" />
                        Добавить исключение
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Дата</label>
                          <input
                            type="date"
                            value={overrideForm.date}
                            onChange={e => setOverrideForm(f => ({ ...f, date: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Тип</label>
                          <select
                            value={overrideForm.consultation_type}
                            onChange={e => setOverrideForm(f => ({ ...f, consultation_type: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                          >
                            <option value="online">Онлайн</option>
                            <option value="offline">Оффлайн</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                          onClick={() => setOverrideForm(f => ({ ...f, is_day_off: !f.is_day_off }))}
                          className={`w-10 h-6 rounded-full transition-colors relative ${overrideForm.is_day_off ? 'bg-red-500' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${overrideForm.is_day_off ? 'left-5' : 'left-1'}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Выходной день</span>
                      </label>
                      {!overrideForm.is_day_off && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Начало</label>
                            <input
                              type="time"
                              value={overrideForm.start_time}
                              onChange={e => setOverrideForm(f => ({ ...f, start_time: e.target.value }))}
                              step="900"
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Конец</label>
                            <input
                              type="time"
                              value={overrideForm.end_time}
                              onChange={e => setOverrideForm(f => ({ ...f, end_time: e.target.value }))}
                              step="900"
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Примечание (необязательно)</label>
                        <input
                          type="text"
                          value={overrideForm.note}
                          onChange={e => setOverrideForm(f => ({ ...f, note: e.target.value }))}
                          placeholder="Например: командировка, отпуск..."
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveOverride}
                        disabled={overrideSaving || !overrideForm.date}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {overrideSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Сохранить исключение
                      </button>
                    </div>

                    {/* Existing Overrides List */}
                    {overrides.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Ban className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Исключений нет</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Существующие исключения</p>
                        {overrides.map(ov => (
                          <div key={ov.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${ov.is_day_off ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                            <div className="flex items-center gap-3">
                              {ov.is_day_off
                                ? <Ban className="w-4 h-4 text-red-500" />
                                : <Clock className="w-4 h-4 text-amber-600" />
                              }
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {new Date(ov.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${ov.consultation_type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {ov.consultation_type === 'online' ? 'Онлайн' : 'Оффлайн'}
                                  </span>
                                </p>
                                <p className={`text-xs mt-0.5 ${ov.is_day_off ? 'text-red-600' : 'text-amber-700'}`}>
                                  {ov.is_day_off ? 'Выходной' : `${ov.start_time?.slice(0, 5)} — ${ov.end_time?.slice(0, 5)}`}
                                  {ov.note && <span className="ml-2 text-gray-500">· {ov.note}</span>}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteOverride(ov.id)}
                              className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* History Tab */}
                {!scheduleLoading && scheduleModalTab === 'history' && (
                  <div className="space-y-3">
                    {scheduleHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">История изменений пуста</p>
                      </div>
                    ) : (
                      scheduleHistory.map((entry: any) => {
                        const actionColor = entry.action === 'create' ? 'text-green-600 bg-green-50 border-green-200' : entry.action === 'delete' ? 'text-red-600 bg-red-50 border-red-200' : 'text-blue-600 bg-blue-50 border-blue-200';
                        const actionLabel = entry.action === 'create' ? 'Создано' : entry.action === 'delete' ? 'Удалено' : 'Изменено';
                        const entityLabel = entry.entity_type === 'base' ? 'Базовое расписание' : 'Исключение';
                        const changedAt = new Date(entry.changed_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={entry.id} className={`p-4 rounded-xl border-2 ${actionColor}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${actionColor}`}>{actionLabel}</span>
                                <span className="text-xs text-gray-500">{entityLabel}</span>
                              </div>
                              <span className="text-xs text-gray-400">{changedAt}</span>
                            </div>
                            {entry.changed_by_name && (
                              <p className="text-xs text-gray-500 mb-2">Изменил: {entry.changed_by_name}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {entry.before && (
                                <div className="bg-white/60 rounded-lg p-2">
                                  <p className="text-xs font-semibold text-gray-500 mb-1">До</p>
                                  {Object.entries(entry.before).filter(([k]) => ['start_time','end_time','is_day_off','is_active','weekday','date'].includes(k)).map(([k, v]) => (
                                    <p key={k} className="text-xs text-gray-700"><span className="text-gray-400">{k}:</span> {String(v)}</p>
                                  ))}
                                </div>
                              )}
                              {entry.after && (
                                <div className="bg-white/60 rounded-lg p-2">
                                  <p className="text-xs font-semibold text-gray-500 mb-1">После</p>
                                  {Object.entries(entry.after).filter(([k]) => ['start_time','end_time','is_day_off','is_active','weekday','date'].includes(k)).map(([k, v]) => (
                                    <p key={k} className="text-xs text-gray-700"><span className="text-gray-400">{k}:</span> {String(v)}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 rounded-b-3xl flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowScheduleModal(false); setScheduleMember(null); }}
                  disabled={scheduleLoading}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Закрыть
                </button>
                {scheduleModalTab === 'template' && (
                  <button type="button" onClick={handleSaveSchedule}
                    disabled={scheduleLoading || getConflictDays().length > 0}
                    className="flex-1 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {scheduleLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Сохранение...</> : <><Calendar className="w-5 h-5" />Сохранить постоянное</>}
                  </button>
                )}
                {scheduleModalTab === 'schedule' && (
                  <>
                    <button type="button" onClick={handleCopyWeek}
                      className="px-4 py-3 rounded-2xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-sm flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Копировать
                    </button>
                    <button type="button" onClick={handleSaveEntireWeek} disabled={plannerSaving || plannerLoading}
                      className={`flex-1 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${plannerDirty ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
                      {plannerSaving ? <><Loader2 className="w-5 h-5 animate-spin" />Сохранение...</> : <><Calendar className="w-5 h-5" />{plannerDirty ? 'Сохранить' : 'Сохранить'}</>}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
