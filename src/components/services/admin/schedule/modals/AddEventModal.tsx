"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Calendar as CalendarIcon,
  Plus,
  Video,
  Home,
  Clock,
  User,
  Stethoscope,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Activity,
  FlaskConical,
  Scan,
  ScanLine,
  ClipboardList,
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Microscope,
  Banknote,
  Building2,
  CreditCard,
  Gift,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}
import StaffScheduleModal from "../../StaffScheduleModal";
import SearchSelect from "../components/SearchSelect";
import { getCurrencySymbol, formatPrice } from "@/utils/currency";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onEventAdded: () => void;
}

type PaymentTypeOption = 'pay_at_clinic' | 'free' | 'full_prepay' | 'partial_prepay';

const PAYMENT_TYPE_OPTIONS: {
  type: PaymentTypeOption;
  label: string;
  sub: string;
  Icon: React.ElementType;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  selectedIconBg: string;
  selectedIconColor: string;
}[] = [
  {
    type: 'pay_at_clinic',
    label: 'В клинике',
    sub: 'Оплата при визите',
    Icon: Building2,
    selectedBg: '#f0fdf4',
    selectedBorder: '#86efac',
    selectedText: '#15803d',
    selectedIconBg: '#dcfce7',
    selectedIconColor: '#16a34a',
  },
  {
    type: 'free',
    label: 'Бесплатно',
    sub: 'Без оплаты',
    Icon: Gift,
    selectedBg: '#eff6ff',
    selectedBorder: '#93c5fd',
    selectedText: '#1d4ed8',
    selectedIconBg: '#dbeafe',
    selectedIconColor: '#2563eb',
  },
  {
    type: 'full_prepay',
    label: 'Полная предоплата',
    sub: '100% заранее',
    Icon: CreditCard,
    selectedBg: '#faf5ff',
    selectedBorder: '#c4b5fd',
    selectedText: '#7c3aed',
    selectedIconBg: '#ede9fe',
    selectedIconColor: '#7c3aed',
  },
  {
    type: 'partial_prepay',
    label: 'Частичная',
    sub: 'Депозит заранее',
    Icon: Wallet,
    selectedBg: '#fffbeb',
    selectedBorder: '#fcd34d',
    selectedText: '#b45309',
    selectedIconBg: '#fef3c7',
    selectedIconColor: '#d97706',
  },
];

type DiagCategoryItem = { slug: string; name: string; icon: string; color: string };

function getCategoryIconBySlug(icon: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    'flask-conical': FlaskConical,
    'scan-line':     ScanLine,
    'heart':         Heart,
    'brain':         Brain,
    'bone':          Bone,
    'eye':           Eye,
    'baby':          Baby,
    'microscope':    Microscope,
    'stethoscope':   Stethoscope,
    'clipboard-list': ClipboardList,
  };
  return map[icon] ?? ClipboardList;
}

export default function AddEventModal({
  isOpen,
  onClose,
  selectedDate,
  onEventAdded
}: AddEventModalProps) {
  const [consultationType, setConsultationType] = useState<'online' | 'offline' | 'home' | 'diagnostics'>('online');
  const [paymentType, setPaymentType] = useState<PaymentTypeOption>('pay_at_clinic');
  const [prepayAmount, setPrepayAmount] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    referring_doctor_id: '',
    date: selectedDate || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })(),
    time: '',
    duration: 30,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ meeting_id?: string; access_code?: string } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const [tgSending, setTgSending] = useState(false);
  const [tgSent, setTgSent] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [scheduleEditMember, setScheduleEditMember] = useState<{ id: number; first_name: string; last_name: string } | null>(null);
  const [availabilityEntry, setAvailabilityEntry] = useState<{ start_time: string; end_time: string } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const [doctorFirstSlots, setDoctorFirstSlots] = useState<Record<number, string>>({});
  const [patients, setPatients] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    gender?: string;
    address?: string;
    city?: string;
    clinic?: { id: number; name: string };
  }>>([]);
  const [doctors, setDoctors] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    years_of_experience?: number;
    address?: string;
    city?: string;
    clinic?: { id: number; name: string };
    preferred_consultation_duration?: number;
    online_consultation_price?: string | null;
    offline_consultation_price?: string | null;
    online_work_schedule?: any;
    offline_work_schedule?: any;
    has_availability?: boolean;
  }>>([]);
  const [nurses, setNurses] = useState<typeof doctors>([]);

  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [clinicName, setClinicName] = useState<string>('');
  const [clinicAddress, setClinicAddress] = useState<string>('');

  // Diagnostics state
  const [diagCategoryList, setDiagCategoryList] = useState<DiagCategoryItem[]>([]);
  const [diagServices, setDiagServices] = useState<Array<{
    id: number; name: string; description: string | null;
    price: string | null; duration_minutes: number; clinic_name: string;
    category: string | null; category_label: string | null;
  }>>([]);
  const [selectedDiagService, setSelectedDiagService] = useState<{
    id: number; name: string; price: string | null; duration_minutes: number; clinic_name: string;
    category: string | null; category_label: string | null;
  } | null>(null);
  const [loadingDiagServices, setLoadingDiagServices] = useState(false);
  const [diagSlots, setDiagSlots] = useState<Array<{ start: string; end: string; label: string; available: number | null }>>([]);
  const [loadingDiagSlots, setLoadingDiagSlots] = useState(false);

  const fetchStaff = async () => {
    try {
      const staffRes = await api.get('/staff/');
      setDoctors(staffRes.data.filter((s: any) => s.role === 'doctor'));
      setNurses(staffRes.data.filter((s: any) => s.role === 'nurse'));
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  useEffect(() => {
    api.get('/clinic-stats/').then(res => {
      const info = res.data?.clinic_info;
      if (info?.currency) setClinicCurrency(info.currency);
      if (info?.name)     setClinicName(info.name);
      if (info?.address)  setClinicAddress(info.address);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const [patientsRes, staffRes] = await Promise.all([
          api.get('/patients/?all=true'),
          api.get('/staff/')
        ]);
        setPatients(patientsRes.data);
        const doctorList = staffRes.data.filter((s: any) => s.role === 'doctor');
        const nurseList  = staffRes.data.filter((s: any) => s.role === 'nurse');
        setDoctors(doctorList);
        setNurses(nurseList);
      } catch (err) {
        console.error("Failed to load patients/staff:", err);
      }
    };
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target as Node)) {
        setTimePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

      setFormData({
        patient_id: '',
        doctor_id: '',
        referring_doctor_id: '',
        date: selectedDate || dateString,
        time: '',
        duration: 30,
        notes: ''
      });
      setConsultationType('online');
      setPaymentType('pay_at_clinic');
      setPrepayAmount('');
      setShowNewPatientForm(false);
      setNewPatientForm({ first_name: '', last_name: '', phone: '', email: '' });
      setTimePickerOpen(false);
      setDiagServices([]);
      setSelectedDiagService(null);
      setCreatedInfo(null);
      setShareCopied(false);
      setWaSending(false); setWaSent(false);
      setTgSending(false); setTgSent(false);
    }
  }, [isOpen, selectedDate]);

  // Fetch working hours for selected doctor+date from "По датам" availability
  useEffect(() => {
    if (!formData.doctor_id || !formData.date) { setAvailabilityEntry(null); return; }

    setLoadingAvailability(true);
    const d = new Date(formData.date + 'T00:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const monday = d.toLocaleDateString('sv-SE');

    const scheduleType = (consultationType === 'home' || consultationType === 'diagnostics') ? 'offline' : consultationType;
    // Only the matching consultation_type — no cross-type fallback. A doctor working
    // online doesn't imply they see patients in-clinic; no explicit offline schedule
    // means no offline availability, same "no record = not bookable" rule as diagnostics.
    api.get(`/staff/${formData.doctor_id}/availability/`, { params: { week_start: monday, consultation_type: scheduleType } })
      .then(res => {
        const data = res.data as any[];
        const entry = data.find(e => e.date === formData.date && !e.is_day_off && e.start_time);
        setAvailabilityEntry(entry ? { start_time: entry.start_time, end_time: entry.end_time } : null);
      })
      .catch(() => setAvailabilityEntry(null))
      .finally(() => setLoadingAvailability(false));
  }, [formData.doctor_id, formData.date, consultationType]);

  // Fetch booked consultations for selected doctor+date to mark busy slots
  useEffect(() => {
    if (!formData.doctor_id || !formData.date) { setBookedTimes(new Set()); return; }
    api.get('/schedule/', { params: { doctor_id: formData.doctor_id, date: formData.date } })
      .then(res => {
        const times = new Set<string>((res.data as any[]).map(e => (e.time as string)?.substring(0, 5)).filter(Boolean));
        setBookedTimes(times);
      })
      .catch(() => setBookedTimes(new Set()));
  }, [formData.doctor_id, formData.date]);

  // Auto-fill duration based on doctor's preferred consultation duration
  useEffect(() => {
    if (formData.doctor_id) {
      const selectedDoctor = doctors.find(d => String(d.id) === formData.doctor_id);
      if (selectedDoctor?.preferred_consultation_duration) {
        setFormData(prev => ({
          ...prev,
          duration: selectedDoctor.preferred_consultation_duration!
        }));
      }
    }
  }, [formData.doctor_id, doctors]);

  // Fetch first available slot for every doctor on the selected date (used in dropdown badges)
  useEffect(() => {
    if (!formData.date || doctors.length === 0) { setDoctorFirstSlots({}); return; }
    const dayScheduleType = (consultationType === 'home' || consultationType === 'diagnostics') ? 'offline' : consultationType;
    api.get('/schedule/day/', { params: { date: formData.date, consultation_type: dayScheduleType } })
      .then(res => {
        const map: Record<number, string> = {};
        for (const doc of (res.data.doctors || [])) {
          const firstFree = (doc.slots || []).find((s: any) => s.status === 'free');
          if (firstFree) map[doc.doctor_id] = firstFree.start;
        }
        setDoctorFirstSlots(map);
      })
      .catch(() => setDoctorFirstSlots({}));
  }, [formData.date, consultationType, doctors.length]);

  // Fetch category справочник when diagnostics tab is active (used only to look up
  // icon/color for the auto-derived category badge under the service search)
  useEffect(() => {
    if (consultationType !== 'diagnostics') return;
    api.get('/diagnostics/categories/').then(res => {
      setDiagCategoryList(res.data.results ?? res.data);
    }).catch(() => {});
  }, [consultationType]);

  // Fetch all active diagnostics services up front — no category gate; category is
  // derived from whichever service gets picked, not chosen as a separate step first.
  useEffect(() => {
    if (consultationType !== 'diagnostics') { setDiagServices([]); setSelectedDiagService(null); return; }
    setLoadingDiagServices(true);
    api.get('/diagnostics/services/')
      .then(res => setDiagServices(res.data.results ?? res.data))
      .catch(() => setDiagServices([]))
      .finally(() => setLoadingDiagServices(false));
  }, [consultationType]);

  // Fetch real available slots for the selected diagnostics service/date — respects
  // the service's actual schedule (date-specific > weekday template), its own
  // duration_minutes, capacity_per_slot, already-booked times, past-time cutoff for
  // today, and this patient's own conflicting bookings. Replaces a hardcoded hourly list.
  useEffect(() => {
    if (consultationType !== 'diagnostics' || !selectedDiagService || !formData.date) {
      setDiagSlots([]);
      return;
    }
    setLoadingDiagSlots(true);
    setFormData(f => ({ ...f, time: '' }));
    api.get(`/diagnostics/services/${selectedDiagService.id}/available-slots/`, {
      params: { date: formData.date, patient_id: formData.patient_id || undefined },
    })
      .then(res => setDiagSlots(res.data.slots ?? []))
      .catch(() => setDiagSlots([]))
      .finally(() => setLoadingDiagSlots(false));
  }, [consultationType, selectedDiagService, formData.date, formData.patient_id]);

  // Generate time slots from the selected doctor's working hours
  const generateSlots = () => {
    if (!availabilityEntry) return [];
    const { start_time, end_time } = availabilityEntry;
    const duration = doctors.find(d => String(d.id) === formData.doctor_id)?.preferred_consultation_duration || 30;
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    let cur = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const now = new Date();
    const isToday = formData.date === now.toLocaleDateString('sv-SE');
    const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const slots: { start: string; end: string; busy: boolean }[] = [];
    while (cur + duration <= endMin) {
      if (isToday && cur <= nowMinutes) { cur += duration; continue; }
      const s = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;
      const e = `${String(Math.floor((cur + duration) / 60)).padStart(2, '0')}:${String((cur + duration) % 60).padStart(2, '0')}`;
      slots.push({ start: s, end: e, busy: bookedTimes.has(s) });
      cur += duration;
    }
    return slots;
  };

  // A doctor "has a schedule" if they have either:
  // - active DoctorSchedule template rows (schedules[].is_active), OR
  // - DoctorAvailability entries this week (has_availability flag from the API)
  const doctorHasSchedule = (doctor: typeof doctors[0]) => {
    const hasTemplate = Array.isArray((doctor as any).schedules) && (doctor as any).schedules.some((s: any) => s.is_active);
    const hasAvailability = doctor.has_availability === true;
    return hasTemplate || hasAvailability;
  };

  // Count doctors without schedules
  // Doctor has no schedule if neither template/availability nor a first slot from /schedule/day/
  const doctorsWithoutSchedule = doctors.filter(d => !doctorHasSchedule(d) && !doctorFirstSlots[d.id]).length;

  const handleCreatePatient = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim() || !newPatientForm.phone.trim()) {
      toast.error('Заполните обязательные поля: имя, фамилия, телефон');
      return;
    }
    setCreatingPatient(true);
    try {
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const response = await api.post('/patients/', { ...newPatientForm, password: tempPassword });
      const created = response.data;
      setPatients(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, patient_id: String(created.id) }));
      setShowNewPatientForm(false);
      setNewPatientForm({ first_name: '', last_name: '', phone: '', email: '' });
      toast.success(`Пациент создан. Временный пароль: ${tempPassword}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || Object.values(err?.response?.data || {})[0] as string || 'Ошибка создания пациента');
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (consultationType === 'diagnostics') {
        await api.post('/diagnostics/appointments/', {
          service_id: selectedDiagService!.id,
          patient_id: formData.patient_id,
          doctor_id: formData.referring_doctor_id || undefined,
          scheduled_time: `${formData.date}T${formData.time}:00`,
          notes: formData.notes,
        });
        toast.success('Запись успешно создана!');
        onClose();
        onEventAdded();
      } else {
        const resp = await api.post('/schedule/', {
          type: consultationType === 'home' ? 'home_visit' : 'consultation',
          consultation_type: consultationType,
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          notes: formData.notes,
          ...(consultationType !== 'home' && {
            payment_type: paymentType,
            ...(paymentType === 'partial_prepay' && prepayAmount ? { prepay_amount: prepayAmount } : {}),
          }),
        });
        onEventAdded();
        setCreatedInfo({ meeting_id: resp.data?.meeting_id, access_code: resp.data?.access_code });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Не удалось создать запись";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Build share text from current form state + response
  const buildCreatedShareText = () => {
    const patient = patients.find(p => String(p.id) === formData.patient_id);
    const doctor = doctors.find(d => String(d.id) === formData.doctor_id);
    const isOnline = consultationType === 'online';
    const typeLabel = consultationType === 'online' ? 'Видеоконсультация' : consultationType === 'offline' ? 'Приём в клинике' : 'Выезд на дом';
    const link = isOnline && createdInfo?.meeting_id
      ? `${window.location.origin}/video-call/patient?meetingId=${createdInfo.meeting_id}`
      : null;

    const PAYMENT_LABELS: Record<string, string> = {
      free: 'Бесплатно',
      pay_at_clinic: 'Оплата при визите',
      full_prepay: 'Полная предоплата',
      partial_prepay: 'Частичная предоплата',
    };

    const priceRaw = doctor
      ? (isOnline ? doctor.online_consultation_price : doctor.offline_consultation_price)
      : null;
    const price = priceRaw ? Number(priceRaw) : 0;

    const lines: (string | null)[] = [
      '📋 Ваша запись в ZhanCare',
      '',
      `📅 Дата: ${formData.date}, ${formData.time} (${formData.duration} мин)`,
      `🏥 Тип: ${typeLabel}`,
    ];

    if (doctor) lines.push(`👨‍⚕️ Доктор: ${doctor.first_name} ${doctor.last_name}`);
    if (patient) {
      lines.push('');
      lines.push(`👤 Пациент: ${patient.first_name} ${patient.last_name}`);
    }

    if (isOnline && link) {
      lines.push('', `🔗 Ссылка для входа:`, link);
    }
    if (isOnline && createdInfo?.access_code) {
      lines.push(`🔑 Код доступа: ${createdInfo.access_code}`);
    }

    if (paymentType !== 'free' && price > 0) {
      lines.push('');
      lines.push(`💳 Оплата: ${PAYMENT_LABELS[paymentType] ?? paymentType}`);
      if (paymentType === 'partial_prepay' && prepayAmount) {
        lines.push(`   Предоплата: ${Number(prepayAmount).toLocaleString('ru-RU')} из ${price.toLocaleString('ru-RU')} ₸`);
      } else if (paymentType === 'full_prepay') {
        lines.push(`   Сумма: ${price.toLocaleString('ru-RU')} ₸`);
      } else if (paymentType === 'pay_at_clinic') {
        lines.push(`   Сумма: ${price.toLocaleString('ru-RU')} ₸`);
      }
    }

    if (formData.notes) lines.push('', `📝 ${formData.notes}`);

    return lines.filter(l => l !== null).join('\n');
  };

  if (!isOpen) return null;

  // Success step — shown after consultation is created
  if (createdInfo !== null) {
    const patient = patients.find(p => String(p.id) === formData.patient_id);
    const doctor = doctors.find(d => String(d.id) === formData.doctor_id);
    const isOnline = consultationType === 'online';
    const isHome = consultationType === 'home';
    const typeLabel = consultationType === 'online' ? 'Видеоконсультация'
      : consultationType === 'offline' ? 'Приём в клинике'
      : consultationType === 'home' ? 'Выезд на дом'
      : 'Диагностика';
    const link = isOnline && createdInfo.meeting_id
      ? `${window.location.origin}/video-call/patient?meetingId=${createdInfo.meeting_id}`
      : null;
    const priceRaw = doctor
      ? (isOnline ? doctor.online_consultation_price : doctor.offline_consultation_price)
      : null;
    const price = priceRaw ? Number(priceRaw) : 0;
    const PAYMENT_LABELS: Record<string, string> = {
      free: 'Бесплатно', pay_at_clinic: 'Оплата при визите',
      full_prepay: 'Полная предоплата', partial_prepay: 'Частичная предоплата',
    };

    const shareText = buildCreatedShareText();
    const patientPhone = patient?.phone ? patient.phone.replace(/\D/g, '') : '';

    const handleShareCopy = () => {
      navigator.clipboard.writeText(shareText).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      });
    };
    const handleWhatsApp = async () => {
      if (!patientPhone) { toast.error('У пациента нет номера телефона'); return; }
      setWaSending(true);
      try {
        await api.post('/whatsapp/reply/', { to: patientPhone, body: shareText });
        setWaSent(true);
        toast.success('Отправлено в WhatsApp');
      } catch { toast.error('Не удалось отправить в WhatsApp'); }
      finally { setWaSending(false); }
    };
    const handleTelegram = async () => {
      if (!formData.patient_id) return;
      setTgSending(true);
      try {
        const convRes = await api.get('/tg/conversation/', { params: { patient_id: formData.patient_id } });
        if (!convRes.data.found) { toast.warn('Пациент не подключил Telegram бот'); return; }
        await api.post('/tg/reply/', { chat_id: convRes.data.chat_id, text: shareText });
        setTgSent(true);
        toast.success('Отправлено в Telegram');
      } catch { toast.error('Не удалось отправить в Telegram'); }
      finally { setTgSending(false); }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
        >
          {/* Green success header */}
          <div className="px-8 py-6 text-center" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Запись создана!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              {formData.date} в {formData.time} · {formData.duration} мин
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-sm">
              {/* Type */}
              <div className="flex items-center gap-2.5">
                {isOnline
                  ? <Video className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  : isHome
                    ? <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    : <Building2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                }
                <span className="text-gray-500 w-24 flex-shrink-0">Тип</span>
                <span className="font-semibold text-gray-800">{typeLabel}</span>
              </div>

              {patient && (
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Пациент</span>
                  <span className="font-semibold text-gray-800">{patient.first_name} {patient.last_name}</span>
                </div>
              )}
              {doctor && (
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Доктор</span>
                  <span className="font-semibold text-gray-800">{doctor.first_name} {doctor.last_name}</span>
                </div>
              )}

              {/* Online-only: video link + code */}
              {isOnline && link && (
                <div className="flex items-start gap-2.5">
                  <Video className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Ссылка</span>
                  <span className="font-medium text-indigo-600 text-xs break-all leading-relaxed">{link}</span>
                </div>
              )}
              {isOnline && createdInfo.access_code && (
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 text-amber-500 flex-shrink-0 text-center text-xs font-black">🔑</span>
                  <span className="text-gray-500 w-24 flex-shrink-0">Код</span>
                  <span className="font-black font-mono tracking-widest text-gray-800">{createdInfo.access_code}</span>
                </div>
              )}

              {/* Offline: clinic address */}
              {!isOnline && !isHome && clinicName && (
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Клиника</span>
                  <span className="font-semibold text-gray-800">{clinicName}</span>
                </div>
              )}
              {!isOnline && !isHome && clinicAddress && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Адрес</span>
                  <span className="font-medium text-gray-700">{clinicAddress}</span>
                </div>
              )}

              {/* Home visit: patient address */}
              {isHome && patient && (patient as any).address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Адрес</span>
                  <span className="font-medium text-gray-700">{(patient as any).address}</span>
                </div>
              )}

              {paymentType !== 'free' && price > 0 && (
                <div className="flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-500 w-24 flex-shrink-0">Оплата</span>
                  <span className="font-semibold text-gray-800">
                    {PAYMENT_LABELS[paymentType]} · {price.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              )}
            </div>

            {/* Share label */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
              Отправить пациенту
            </p>

            {/* Share buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShareCopy}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                  shareCopied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {shareCopied ? 'Скопировано' : 'Скопировать'}
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={waSending || waSent}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-all flex-shrink-0 disabled:opacity-70 ${waSent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#16a34a] border-[#86efac]'}`}
              >
                {waSending ? <Loader2 className="w-4 h-4 animate-spin" /> : waSent ? <Check className="w-4 h-4" /> : <WhatsAppIcon className="w-4 h-4" />}
                {waSent ? 'Отправлено' : 'WhatsApp'}
              </button>
              <button
                type="button"
                onClick={handleTelegram}
                disabled={tgSending || tgSent}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-all flex-shrink-0 disabled:opacity-70 ${tgSent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] border-[#93c5fd]'}`}
              >
                {tgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : tgSent ? <Check className="w-4 h-4" /> : <TelegramIcon className="w-4 h-4" />}
                {tgSent ? 'Отправлено' : 'Telegram'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors text-sm"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
            Добавить Запись
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consultation Type */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#1e263e' }}>
              Тип консультации
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { type: 'offline',     label: 'Приём в клинике', sub: 'Визит в клинику',         Icon: Home,        bg: '#0f766e' },
                { type: 'online',      label: 'Видеоконсультация', sub: 'Видеозвонок',              Icon: Video,       bg: '#1d4ed8' },
                { type: 'home',        label: 'Вызов на дом',  sub: 'Медсестра к вам',          Icon: MapPin,      bg: '#b45309' },
                { type: 'diagnostics', label: 'Диагностика',   sub: 'Анализы и обследование',   Icon: Stethoscope, bg: '#7c3aed' },
              ] as const).map(({ type, label, sub, Icon, bg }) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => { setConsultationType(type); setFormData(prev => ({ ...prev, doctor_id: '', referring_doctor_id: '', time: '' })); setSelectedDiagService(null); }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex flex-col gap-3 px-4 py-4 rounded-2xl overflow-hidden text-white text-left transition-all duration-200"
                  style={{
                    backgroundColor: bg,
                    opacity: consultationType === type ? 1 : 0.6,
                    boxShadow: consultationType === type ? `0 0 0 3px white, 0 0 0 5px ${bg}` : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-2xl" />
                  <div className="relative w-9 h-9 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="relative min-w-0">
                    <p className="text-sm font-bold leading-tight">{label}</p>
                    <p className="text-xs opacity-60 mt-0.5">{sub}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Patient */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold" style={{ color: '#1e263e' }}>
                Пациент <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowNewPatientForm(v => !v); setFormData(prev => ({ ...prev, patient_id: '' })); }}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${showNewPatientForm ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                {showNewPatientForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showNewPatientForm ? 'Отмена' : 'Новый пациент'}
              </button>
            </div>

            {showNewPatientForm ? (
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Новый пациент</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Имя <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newPatientForm.first_name}
                      onChange={e => setNewPatientForm(p => ({ ...p, first_name: e.target.value }))}
                      placeholder="Имя"
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Фамилия <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newPatientForm.last_name}
                      onChange={e => setNewPatientForm(p => ({ ...p, last_name: e.target.value }))}
                      placeholder="Фамилия"
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Телефон <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={newPatientForm.phone}
                      onChange={e => setNewPatientForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newPatientForm.email}
                      onChange={e => setNewPatientForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreatePatient}
                  disabled={creatingPatient}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
                >
                  {creatingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creatingPatient ? 'Создание...' : 'Создать и выбрать'}
                </button>
              </div>
            ) : (
            <SearchSelect
              options={patients.map(p => ({ id: p.id, label: `${p.first_name} ${p.last_name}`, subtitle: p.email }))}
              value={formData.patient_id}
              onChange={(val) => setFormData({ ...formData, patient_id: val })}
              placeholder="Выберите пациента..."
              required
            />
            )}

            {/* Patient info card */}
            {formData.patient_id && (() => {
              const patient = patients.find(p => String(p.id) === formData.patient_id);
              if (!patient) return null;
              return (
                <div className="mt-3 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/40">
                  <div className="flex items-center gap-2 mb-2.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Информация о пациенте</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {patient.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.birth_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.birth_date}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.gender === 'M' ? 'Мужчина' : patient.gender === 'F' ? 'Женщина' : patient.gender}</span>
                      </div>
                    )}
                    {(patient.address || patient.city) && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{[patient.address, patient.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {patient.clinic && (
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{patient.clinic.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Doctor / Nurse (hidden for diagnostics) */}
          {consultationType !== 'diagnostics' && (() => {
            const isHome = consultationType === 'home';
            const staffList = isHome ? nurses : doctors;
            const staffLabel = isHome ? 'Медсестра' : 'Доктор';
            const staffIcon = isHome ? <Activity className="w-4 h-4 text-amber-600" /> : <Stethoscope className="w-4 h-4 text-emerald-600" />;
            const accentColor = isHome ? 'amber' : 'emerald';
            return (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                  {staffLabel} <span className="text-red-500">*</span>
                  {loadingAvailability && (
                    <span className="ml-2 text-xs text-gray-500">
                      <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                      Загрузка расписания...
                    </span>
                  )}
                </label>
                {staffList.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-400">
                    <AlertCircle className="w-4 h-4 text-gray-300" />
                    {isHome ? 'Медсёстры не найдены' : 'Врачи не найдены'}
                  </div>
                ) : (
                  <SearchSelect
                    options={staffList.map(d => {
                      const subtitleParts = [];
                      if (d.specialization) subtitleParts.push(d.specialization);
                      if (d.email) subtitleParts.push(d.email);
                      return { id: d.id, label: `${d.first_name} ${d.last_name}`, subtitle: subtitleParts.join(' • ') || undefined };
                    })}
                    value={formData.doctor_id}
                    onChange={(val) => {
                      const member = staffList.find(d => String(d.id) === val);
                      const rawPrice = member
                        ? (consultationType === 'online' ? member.online_consultation_price : member.offline_consultation_price)
                        : null;
                      const newPrice = rawPrice != null && rawPrice !== '' ? Number(rawPrice) : 0;
                      if (newPrice > 0 && paymentType === 'free') setPaymentType('pay_at_clinic');
                      setFormData({ ...formData, doctor_id: val, time: '', duration: member?.preferred_consultation_duration || formData.duration });
                    }}
                    placeholder={`Выберите ${isHome ? 'медсестру' : 'доктора'}...`}
                    required={true}
                    renderOption={(option, isSelected, onSelect) => {
                      const d = staffList.find(m => String(m.id) === String(option.id));
                      const hasSchedule = d ? doctorHasSchedule(d) : false;
                      const firstSlot = d ? doctorFirstSlots[d.id] : undefined;
                      return (
                        <div onClick={onSelect} className={`w-full px-4 py-2.5 cursor-pointer flex items-center justify-between gap-2 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <div className="min-w-0">
                            <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{option.label}</div>
                            {option.subtitle && <div className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{option.subtitle}</div>}
                            {firstSlot && formData.date && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Ближайший слот: {firstSlot}</span>
                            )}
                            {!firstSlot && !hasSchedule && !loadingAvailability && !isHome && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">Нет расписания</span>
                            )}
                          </div>
                          {!loadingAvailability && !hasSchedule && d && !isHome && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setScheduleEditMember(d); }}
                              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                              <CalendarIcon className="w-3 h-3" /> Расписание
                            </button>
                          )}
                        </div>
                      );
                    }}
                  />
                )}

                {/* Staff info card */}
                {formData.doctor_id && (() => {
                  const member = staffList.find(d => String(d.id) === formData.doctor_id);
                  if (!member) return null;
                  return (
                    <div className={`mt-3 p-4 rounded-2xl border-2 ${accentColor === 'amber' ? 'border-amber-100 bg-amber-50/40' : 'border-emerald-100 bg-emerald-50/40'}`}>
                      <div className="flex items-center gap-2 mb-2.5">
                        {staffIcon}
                        <span className={`text-sm font-bold ${accentColor === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>
                          Информация о {isHome ? 'медсестре' : 'докторе'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {member.email && <div className="flex items-center gap-2 text-gray-600"><Mail className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span className="truncate">{member.email}</span></div>}
                        {member.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span>{member.phone}</span></div>}
                        {member.specialization && <div className="flex items-center gap-2 text-gray-600 col-span-2"><Stethoscope className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span>{member.specialization}</span></div>}
                        {member.clinic && <div className="flex items-center gap-2 text-gray-600 col-span-2"><User className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span>{member.clinic.name}</span></div>}
                      </div>
                    </div>
                  );
                })()}

                {/* No-schedule warning (doctors only) */}
                {!isHome && formData.doctor_id && (() => {
                  const d = doctors.find(doc => String(doc.id) === formData.doctor_id);
                  if (!d || doctorHasSchedule(d) || doctorFirstSlots[d.id]) return null;
                  return (
                    <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-amber-800">У доктора нет настроенного расписания</span>
                      </div>
                      <button type="button" onClick={() => setScheduleEditMember(d)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                        <CalendarIcon className="w-3 h-3" /> Настроить
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Diagnostics — Service (search first; category is derived from the pick, not chosen up front) */}
          {consultationType === 'diagnostics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                  Услуга <span className="text-red-500">*</span>
                </label>
                {loadingDiagServices ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    <span className="text-sm text-gray-400">Загрузка услуг...</span>
                  </div>
                ) : (
                  <SearchSelect
                    options={diagServices.map(svc => ({
                      id: svc.id,
                      label: svc.name,
                      subtitle: [
                        svc.category_label,
                        svc.price ? formatPrice(svc.price, clinicCurrency) : null,
                        svc.duration_minutes ? `${svc.duration_minutes} мин` : null,
                      ].filter(Boolean).join(' · '),
                    }))}
                    value={selectedDiagService ? String(selectedDiagService.id) : ''}
                    onChange={(val) => {
                      const svc = diagServices.find(s => String(s.id) === val);
                      setSelectedDiagService(svc ?? null);
                    }}
                    placeholder={diagServices.length === 0 ? 'Нет услуг диагностики' : 'Найти услугу...'}
                    required
                  />
                )}

                {selectedDiagService?.category && (() => {
                  const cat = diagCategoryList.find(c => c.slug === selectedDiagService.category);
                  if (!cat) return null;
                  const CatIcon = getCategoryIconBySlug(cat.icon);
                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cat.color}25` }}>
                        <CatIcon className="w-3 h-3" style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs text-gray-500">Категория: <span className="font-semibold text-gray-700">{cat.name}</span></span>
                    </div>
                  );
                })()}
              </div>

              {/* Optional referring doctor — drives the doctor's diagnostics commission, if one is configured for this service */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                  Назначивший врач <span className="text-gray-400 text-xs font-normal">(необязательно)</span>
                </label>
                <SearchSelect
                  options={doctors.map(d => ({
                    id: d.id,
                    label: `${d.first_name} ${d.last_name}`,
                    subtitle: d.specialization || undefined,
                  }))}
                  value={formData.referring_doctor_id}
                  onChange={(val) => setFormData({ ...formData, referring_doctor_id: val })}
                  placeholder="Без врача — выручка полностью клинике"
                />
              </div>
            </div>
          )}

          {/* Duration (hidden for diagnostics) */}
          {consultationType !== 'diagnostics' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Продолжительность (минут)
              </label>
              {formData.doctor_id ? (
                <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 select-none cursor-default">
                  <span className="flex-1 font-medium text-gray-700">
                    {[
                      { id: 15, label: '15 минут' }, { id: 30, label: '30 минут' },
                      { id: 45, label: '45 минут' }, { id: 60, label: '1 час' },
                      { id: 90, label: '1.5 часа' }, { id: 120, label: '2 часа' },
                      { id: 150, label: '2.5 часа' }, { id: 180, label: '3 часа' },
                    ].find(o => o.id === formData.duration)?.label ?? `${formData.duration} минут`}
                  </span>
                  <span className="text-xs text-gray-400">из профиля врача</span>
                </div>
              ) : (
                <SearchSelect
                  options={[
                    { id: 15, label: '15 минут' }, { id: 30, label: '30 минут' },
                    { id: 45, label: '45 минут' }, { id: 60, label: '1 час' },
                    { id: 90, label: '1.5 часа' }, { id: 120, label: '2 часа' },
                    { id: 150, label: '2.5 часа' }, { id: 180, label: '3 часа' },
                  ]}
                  value={String(formData.duration)}
                  onChange={(val) => setFormData({ ...formData, duration: parseInt(val) })}
                  placeholder="Выберите продолжительность..."
                />
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Time — simple picker for diagnostics, slot-based for doctor/nurse */}
          <div ref={consultationType !== 'diagnostics' ? timePickerRef : undefined}>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Время
            </label>
            {consultationType === 'diagnostics' ? (
              !selectedDiagService ? (
                <div className="px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-400">Сначала выберите услугу</p>
                </div>
              ) : loadingDiagSlots ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="text-sm text-gray-400">Загрузка слотов...</span>
                </div>
              ) : diagSlots.length === 0 ? (
                <div className="px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50">
                  <p className="text-sm text-amber-700">⚠️ На эту дату нет свободных слотов для «{selectedDiagService.name}»</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {diagSlots.map(slot => (
                    <button key={slot.label} type="button" onClick={() => setFormData(f => ({ ...f, time: slot.label }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                        formData.time === slot.label
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                      }`}
                      style={formData.time === slot.label ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' } : undefined}>
                      {slot.label}
                      {slot.available !== null && <span className="ml-1 opacity-70">· {slot.available}</span>}
                    </button>
                  ))}
                  <input type="text" value={formData.time} required readOnly className="sr-only" tabIndex={-1} />
                </div>
              )
            ) : formData.doctor_id && formData.date ? (() => {
              const slots = generateSlots();
              const selectedSlot = slots.find(s => s.start === formData.time);
              const freeCount = slots.filter(s => !s.busy).length;

              if (loadingAvailability) {
                return (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Загрузка расписания...</span>
                  </div>
                );
              }

              if (slots.length === 0) {
                return (
                  <div className="px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50">
                    <p className="text-sm text-amber-700">⚠️ У выбранного {consultationType === 'home' ? 'медсестры' : 'доктора'} нет рабочих часов на эту дату</p>
                  </div>
                );
              }

              return (
                <div className="relative">
                  <div onClick={() => setTimePickerOpen(v => !v)}
                    className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors bg-white ${timePickerOpen ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Clock className={`w-4 h-4 flex-shrink-0 ${selectedSlot ? 'text-blue-500' : 'text-gray-400'}`} />
                    {selectedSlot ? (
                      <>
                        <span className="flex-1 text-sm font-semibold text-gray-900">{selectedSlot.start} – {selectedSlot.end}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(f => ({ ...f, time: '' })); }} className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </>
                    ) : (
                      <span className="flex-1 text-sm text-gray-400">Выберите время</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${timePickerOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {timePickerOpen && (
                    <div className="absolute z-20 w-full mt-1.5 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          {freeCount} {freeCount === 1 ? 'слот свободен' : 'слота свободно'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-full bg-emerald-400" />Свободно</span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-full bg-gray-300" />Занято</span>
                        </div>
                      </div>
                      <div className="p-3 max-h-56 overflow-y-auto scrollbar-hide">
                        <div className="grid grid-cols-3 gap-1.5">
                          {slots.map(slot => {
                            const isSelected = slot.start === formData.time;
                            return (
                              <button key={slot.start} type="button" disabled={slot.busy}
                                onClick={() => { if (!slot.busy) { setFormData(f => ({ ...f, time: slot.start })); setTimePickerOpen(false); } }}
                                className={`group relative flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${isSelected ? 'text-white shadow-sm' : slot.busy ? 'bg-gray-50 border border-gray-100 cursor-not-allowed' : 'bg-emerald-50 border border-emerald-200 hover:bg-[linear-gradient(135deg,#3772ff_0%,#2c5bcc_100%)] hover:border-transparent cursor-pointer'}`}
                                style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}>
                                <span className={`text-[11px] font-black leading-tight ${isSelected ? 'text-white' : slot.busy ? 'text-gray-300 line-through' : 'text-emerald-700 group-hover:text-white'}`}>{slot.start}</span>
                                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : slot.busy ? 'text-gray-300' : 'text-emerald-500 group-hover:text-blue-100'}`}>{slot.busy ? 'занято' : `– ${slot.end}`}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  <input type="text" value={formData.time} required readOnly className="sr-only" tabIndex={-1} />
                </div>
              );
            })() : (
              <div>
                <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 cursor-not-allowed">
                  <Clock className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-400">Выберите {consultationType === 'home' ? 'медсестру' : 'доктора'} и дату</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">💡 Сначала выберите {consultationType === 'home' ? 'медсестру' : 'доктора'}, чтобы увидеть доступное время</p>
              </div>
            )}
          </div>

          {/* Price summary */}
          {(() => {
            let price: string | null = null;
            let label = '';

            if (consultationType === 'diagnostics' && selectedDiagService?.price) {
              price = selectedDiagService.price;
              label = selectedDiagService.name;
            } else if (formData.doctor_id) {
              const staffList = consultationType === 'home' ? nurses : doctors;
              const member = staffList.find(d => String(d.id) === formData.doctor_id);
              if (member) {
                const raw = consultationType === 'online'
                  ? member.online_consultation_price
                  : member.offline_consultation_price;
                if (raw) { price = raw; label = `${member.first_name} ${member.last_name}`; }
              }
            }

            if (!price) return null;
            return (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50">
                <Banknote className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-600 font-medium truncate">{label}</p>
                  <p className="text-lg font-black text-emerald-700 leading-tight">
                    {Number(price).toLocaleString('ru-RU')} {getCurrencySymbol(clinicCurrency)}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-100 px-2 py-1 rounded-lg">
                  Стоимость
                </span>
              </div>
            );
          })()}

          {/* Payment Type (consultations only, after doctor is selected) */}
          {(consultationType === 'online' || consultationType === 'offline') && formData.doctor_id && (() => {
            const staffList = doctors;
            const member = staffList.find(d => String(d.id) === formData.doctor_id);
            const rawPrice = member
              ? (consultationType === 'online' ? member.online_consultation_price : member.offline_consultation_price)
              : null;
            const doctorPrice = rawPrice != null && rawPrice !== '' ? Number(rawPrice) : 0;
            const visibleOptions = PAYMENT_TYPE_OPTIONS.filter(o => o.type !== 'free' || doctorPrice === 0);
            return (
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#1e263e' }}>
                Тип оплаты
              </label>
              <div className="grid grid-cols-2 gap-2">
                {visibleOptions.map(({ type, label, sub, Icon, selectedBg, selectedBorder, selectedText, selectedIconBg, selectedIconColor }) => {
                  const isSelected = paymentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl border-2 text-left transition-all"
                      style={{
                        backgroundColor: isSelected ? selectedBg : '#fff',
                        borderColor: isSelected ? selectedBorder : '#e5e7eb',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isSelected ? selectedIconBg : '#f3f4f6' }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: isSelected ? selectedIconColor : '#9ca3af' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight" style={{ color: isSelected ? selectedText : '#374151' }}>
                          {label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentType === 'partial_prepay' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold mb-1.5 text-gray-600">
                    Сумма предоплаты <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={prepayAmount}
                      onChange={e => setPrepayAmount(e.target.value)}
                      placeholder="0"
                      min={1}
                      required
                      className="w-full px-4 py-3 pr-16 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm bg-amber-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-amber-600">
                      ₸
                    </span>
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Добавьте дополнительную информацию..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Создаётся...' : 'Создать Запись'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>

    <StaffScheduleModal
      isOpen={!!scheduleEditMember}
      member={scheduleEditMember}
      onClose={() => setScheduleEditMember(null)}
      onSaved={() => { setScheduleEditMember(null); fetchStaff(); }}
    />
    </>
  );
}
