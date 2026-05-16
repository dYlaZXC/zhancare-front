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
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Microscope,
  Banknote,
} from "lucide-react";
import StaffScheduleModal from "../../StaffScheduleModal";
import SearchSelect from "../components/SearchSelect";
import { getCurrencySymbol, formatPrice } from "@/utils/currency";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onEventAdded: () => void;
}

const DIAG_CATEGORIES = [
  { id: 'lab',     label: 'Анализы крови',  Icon: FlaskConical },
  { id: 'imaging', label: 'Визуализация',   Icon: Scan },
  { id: 'cardio',  label: 'Кардиология',    Icon: Heart },
  { id: 'neuro',   label: 'Неврология',     Icon: Brain },
  { id: 'ortho',   label: 'Ортопедия',      Icon: Bone },
  { id: 'ophtha',  label: 'Офтальмология',  Icon: Eye },
  { id: 'peds',    label: 'Педиатрия',      Icon: Baby },
  { id: 'micro',   label: 'Микробиология',  Icon: Microscope },
] as const;

const DIAG_TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

export default function AddEventModal({
  isOpen,
  onClose,
  selectedDate,
  onEventAdded
}: AddEventModalProps) {
  const [consultationType, setConsultationType] = useState<'online' | 'offline' | 'home' | 'diagnostics'>('online');
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    date: selectedDate || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })(),
    time: '',
    duration: 30,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
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

  // Diagnostics state
  const [diagCategory, setDiagCategory] = useState<string | null>(null);
  const [diagServices, setDiagServices] = useState<Array<{
    id: number; name: string; description: string | null;
    price: string | null; duration_minutes: number; clinic_name: string;
  }>>([]);
  const [selectedDiagService, setSelectedDiagService] = useState<{
    id: number; name: string; price: string | null; duration_minutes: number; clinic_name: string;
  } | null>(null);
  const [loadingDiagServices, setLoadingDiagServices] = useState(false);

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
      if (res.data?.clinic_info?.currency) setClinicCurrency(res.data.clinic_info.currency);
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
        date: selectedDate || dateString,
        time: '',
        duration: 30,
        notes: ''
      });
      setConsultationType('online');
      setShowNewPatientForm(false);
      setNewPatientForm({ first_name: '', last_name: '', phone: '', email: '' });
      setTimePickerOpen(false);
      setDiagCategory(null);
      setDiagServices([]);
      setSelectedDiagService(null);
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
    // Fetch both consultation types — use whichever has an entry for this date
    Promise.allSettled([
      api.get(`/staff/${formData.doctor_id}/availability/`, { params: { week_start: monday, consultation_type: 'online' } }),
      api.get(`/staff/${formData.doctor_id}/availability/`, { params: { week_start: monday, consultation_type: 'offline' } }),
    ]).then(([onlineRes, offlineRes]) => {
      const onlineData = onlineRes.status === 'fulfilled' ? (onlineRes.value.data as any[]) : [];
      const offlineData = offlineRes.status === 'fulfilled' ? (offlineRes.value.data as any[]) : [];
      // Prefer the type matching the selected consultation type
      const preferred = scheduleType === 'online' ? onlineData : offlineData;
      const fallback = scheduleType === 'online' ? offlineData : onlineData;
      const entry =
        preferred.find(e => e.date === formData.date && !e.is_day_off && e.start_time) ??
        fallback.find(e => e.date === formData.date && !e.is_day_off && e.start_time);
      setAvailabilityEntry(entry ? { start_time: entry.start_time, end_time: entry.end_time } : null);
    }).finally(() => setLoadingAvailability(false));
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

  // Fetch diagnostics services when category changes
  useEffect(() => {
    if (consultationType !== 'diagnostics' || !diagCategory) { setDiagServices([]); setSelectedDiagService(null); return; }
    setLoadingDiagServices(true);
    api.get('/diagnostics/services/', { params: { category: diagCategory } })
      .then(res => setDiagServices(res.data.results ?? res.data))
      .catch(() => setDiagServices([]))
      .finally(() => setLoadingDiagServices(false));
  }, [diagCategory, consultationType]);

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
          scheduled_time: `${formData.date}T${formData.time}:00`,
          notes: formData.notes,
        });
      } else {
        await api.post('/schedule/', {
          type: consultationType === 'home' ? 'home_visit' : 'consultation',
          consultation_type: consultationType,
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          notes: formData.notes,
        });
      }
      toast.success('Запись успешно создана!');
      onClose();
      onEventAdded();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Не удалось создать запись";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
                { type: 'offline',     label: 'Оффлайн',      sub: 'Визит в клинику',         Icon: Home,        bg: '#0f766e' },
                { type: 'online',      label: 'Онлайн',        sub: 'Видеозвонок',              Icon: Video,       bg: '#1d4ed8' },
                { type: 'home',        label: 'Вызов на дом',  sub: 'Медсестра к вам',          Icon: MapPin,      bg: '#b45309' },
                { type: 'diagnostics', label: 'Диагностика',   sub: 'Анализы и обследование',   Icon: Stethoscope, bg: '#7c3aed' },
              ] as const).map(({ type, label, sub, Icon, bg }) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => { setConsultationType(type); setFormData(prev => ({ ...prev, doctor_id: '', time: '' })); setDiagCategory(null); setSelectedDiagService(null); }}
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

          {/* Diagnostics — Category + Service */}
          {consultationType === 'diagnostics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#1e263e' }}>
                  Категория диагностики <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DIAG_CATEGORIES.map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => setDiagCategory(id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${
                        diagCategory === id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/50'
                      }`}>
                      <Icon className={`w-5 h-5 ${diagCategory === id ? 'text-violet-600' : 'text-gray-400'}`} />
                      <span className={`text-[10px] font-semibold leading-tight ${diagCategory === id ? 'text-violet-700' : 'text-gray-500'}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {diagCategory && (
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
                          svc.clinic_name,
                          svc.price ? formatPrice(svc.price, clinicCurrency) : null,
                          svc.duration_minutes ? `${svc.duration_minutes} мин` : null,
                        ].filter(Boolean).join(' · '),
                      }))}
                      value={selectedDiagService ? String(selectedDiagService.id) : ''}
                      onChange={(val) => {
                        const svc = diagServices.find(s => String(s.id) === val);
                        setSelectedDiagService(svc ?? null);
                      }}
                      placeholder={diagServices.length === 0 ? 'Нет услуг в этой категории' : 'Выберите услугу...'}
                      required
                    />
                  )}
                </div>
              )}
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
              <div className="flex flex-wrap gap-2">
                {DIAG_TIMES.map(t => (
                  <button key={t} type="button" onClick={() => setFormData(f => ({ ...f, time: t }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      formData.time === t
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                    }`}
                    style={formData.time === t ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' } : undefined}>
                    {t}
                  </button>
                ))}
                <input type="text" value={formData.time} required readOnly className="sr-only" tabIndex={-1} />
              </div>
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
                                className={`relative flex flex-col items-center py-2 px-1 rounded-xl transition-all ${isSelected ? 'text-white shadow-sm' : slot.busy ? 'bg-gray-50 border border-gray-100 cursor-not-allowed' : 'bg-emerald-50 border border-emerald-200 hover:text-white hover:border-transparent cursor-pointer'}`}
                                style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}
                                onMouseEnter={e => { if (!slot.busy && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)'; }}
                                onMouseLeave={e => { if (!slot.busy && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = ''; }}>
                                <span className={`text-[11px] font-black leading-tight ${isSelected ? 'text-white' : slot.busy ? 'text-gray-300 line-through' : 'text-emerald-700'}`}>{slot.start}</span>
                                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : slot.busy ? 'text-gray-300' : 'text-emerald-500'}`}>{slot.busy ? 'занято' : `– ${slot.end}`}</span>
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
