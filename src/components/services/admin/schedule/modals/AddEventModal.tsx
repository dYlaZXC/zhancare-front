"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Home, Video, MapPin, Stethoscope, X, Banknote, Loader2,
} from "lucide-react";
import StaffScheduleModal from "../../StaffScheduleModal";
import { getCurrencySymbol } from "@/utils/currency";

import type {
  ConsultationType, CreatedInfo, DiagCategoryItem, DiagService, DiagSlot,
  DoctorSlot, EventFormData, Patient, PaymentTypeOption, StaffMember,
} from "./add-event/types/addEventTypes";
import { PatientSection, type NewPatientForm } from "./add-event/components/PatientSection";
import { StaffSection } from "./add-event/components/StaffSection";
import { DiagnosticsSection } from "./add-event/components/DiagnosticsSection";
import { DateTimeSection } from "./add-event/components/DateTimeSection";
import { PaymentSection } from "./add-event/components/PaymentSection";
import { EventSuccessScreen } from "./add-event/components/EventSuccessScreen";

// "Today" must be computed in the CLINIC's own timezone, not the browser's —
// a browser-local date can already be a day behind/ahead of the clinic's
// actual calendar date near midnight, which made diagnostics slot lookups
// silently return empty (the backend compares against clinic-local `now()`).
// Falls back to Asia/Almaty, matching the backend's own fallback and the
// only timezone any clinic in this system is currently configured with.
function getClinicToday(tz: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date());
}

// Mirrors PatientFormModal's generator — guarantees one of each character
// class rather than a plain Math.random() slice, which could (rarely) land
// on something that fails the backend's password strength check.
function generateRandomPassword(): string {
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
  return pass.split('').sort(() => Math.random() - 0.5).join('');
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onEventAdded: () => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  selectedDate,
  onEventAdded
}: AddEventModalProps) {
  const [consultationType, setConsultationType] = useState<ConsultationType>('online');
  const [paymentType, setPaymentType] = useState<PaymentTypeOption>('pay_at_clinic');
  const [prepayAmount, setPrepayAmount] = useState('');
  const [formData, setFormData] = useState<EventFormData>({
    patient_id: '',
    doctor_id: '',
    referring_doctor_id: '',
    date: selectedDate || getClinicToday('Asia/Almaty'),
    time: '',
    duration: 30,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<CreatedInfo | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState<NewPatientForm>({ first_name: '', last_name: '', phone: '', email: '', password: generateRandomPassword(), referral_source: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [scheduleEditMember, setScheduleEditMember] = useState<{ id: number; first_name: string; last_name: string } | null>(null);
  const [availabilityEntry, setAvailabilityEntry] = useState<{ start_time: string; end_time: string } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const [doctorFirstSlots, setDoctorFirstSlots] = useState<Record<number, string>>({});
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<StaffMember[]>([]);
  const [nurses, setNurses] = useState<StaffMember[]>([]);

  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [clinicName, setClinicName] = useState<string>('');
  const [clinicAddress, setClinicAddress] = useState<string>('');
  const [clinicTimezone, setClinicTimezone] = useState<string>('Asia/Almaty');

  // Diagnostics state
  const [diagCategoryList, setDiagCategoryList] = useState<DiagCategoryItem[]>([]);
  const [diagServices, setDiagServices] = useState<DiagService[]>([]);
  const [selectedDiagService, setSelectedDiagService] = useState<DiagService | null>(null);
  const [loadingDiagServices, setLoadingDiagServices] = useState(false);
  const [diagSlots, setDiagSlots] = useState<DiagSlot[]>([]);
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
      if (info?.currency)  setClinicCurrency(info.currency);
      if (info?.name)      setClinicName(info.name);
      if (info?.address)   setClinicAddress(info.address);
      if (info?.time_zone) setClinicTimezone(info.time_zone);
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
      const dateString = getClinicToday(clinicTimezone);

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
      setNewPatientForm({ first_name: '', last_name: '', phone: '', email: '', password: generateRandomPassword(), referral_source: '' });
      setTimePickerOpen(false);
      setDiagServices([]);
      setSelectedDiagService(null);
      setCreatedInfo(null);
    }
  }, [isOpen, selectedDate]);
  // clinicTimezone intentionally excluded: it's read at the moment isOpen
  // flips true (populated on mount, well before any realistic modal-open),
  // not as a trigger — re-running this effect on a late-arriving timezone
  // update would reset an in-progress form the user is actively filling in.

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
    // Still no online<->offline cross-fallback — a doctor working online doesn't
    // imply they see patients in-clinic. But 'mixed' means flexible for either,
    // so it must also be checked (exact type wins if both exist for the same
    // day), or a doctor whose entire schedule is 'mixed' looks unbookable here.
    Promise.all([
      api.get(`/staff/${formData.doctor_id}/availability/`, { params: { week_start: monday, consultation_type: scheduleType } }),
      api.get(`/staff/${formData.doctor_id}/availability/`, { params: { week_start: monday, consultation_type: 'mixed' } }),
    ])
      .then(([exactRes, mixedRes]) => {
        const findEntry = (data: any[]) => data.find(e => e.date === formData.date && !e.is_day_off && e.start_time);
        const entry = findEntry(exactRes.data as any[]) ?? findEntry(mixedRes.data as any[]);
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
    const params: Record<string, string> = { date: formData.date };
    if (formData.patient_id) params.patient_id = formData.patient_id;
    api.get(`/diagnostics/services/${selectedDiagService.id}/available-slots/`, { params })
      .then(res => setDiagSlots(res.data.slots ?? []))
      .catch(() => setDiagSlots([]))
      .finally(() => setLoadingDiagSlots(false));
  }, [consultationType, selectedDiagService, formData.date, formData.patient_id]);

  // Generate time slots from the selected doctor's working hours
  const generateSlots = (): DoctorSlot[] => {
    if (!availabilityEntry) return [];
    const { start_time, end_time } = availabilityEntry;
    const duration = doctors.find(d => String(d.id) === formData.doctor_id)?.preferred_consultation_duration || 30;
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    let cur = startH * 60 + startM;
    let endMin = endH * 60 + endM;
    // Overnight schedule (e.g. 20:00–00:00): end time is numerically <= start
    // time because it lands on the next calendar day — extend past midnight
    // instead of treating the shift as zero-length.
    if (endMin <= cur) endMin += 24 * 60;
    const now = new Date();
    const isToday = formData.date === now.toLocaleDateString('sv-SE');
    const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const fmt = (mins: number) => {
      const m = mins % (24 * 60);
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    };
    const slots: DoctorSlot[] = [];
    while (cur + duration <= endMin) {
      if (isToday && cur <= nowMinutes) { cur += duration; continue; }
      const s = fmt(cur);
      const e = fmt(cur + duration);
      slots.push({ start: s, end: e, busy: bookedTimes.has(s) });
      cur += duration;
    }
    return slots;
  };

  // A doctor "has a schedule" if they have either:
  // - active DoctorSchedule template rows (schedules[].is_active), OR
  // - DoctorAvailability entries this week (has_availability flag from the API)
  const doctorHasSchedule = (doctor: StaffMember) => {
    const hasTemplate = Array.isArray((doctor as any).schedules) && (doctor as any).schedules.some((s: any) => s.is_active);
    const hasAvailability = doctor.has_availability === true;
    return hasTemplate || hasAvailability;
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim() || !newPatientForm.phone.trim() || !newPatientForm.password.trim()) {
      toast.error('Заполните обязательные поля: имя, фамилия, телефон, пароль');
      return;
    }
    setCreatingPatient(true);
    try {
      const response = await api.post('/patients/', newPatientForm);
      const created = response.data;
      setPatients(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, patient_id: String(created.id) }));
      setShowNewPatientForm(false);
      setNewPatientForm({ first_name: '', last_name: '', phone: '', email: '', password: generateRandomPassword(), referral_source: '' });
      const notified = created.email_sent
        ? (created.whatsapp_sent ? ' Данные для входа отправлены на email и в WhatsApp.' : ' Данные для входа отправлены на email.')
        : (created.whatsapp_sent || created.whatsapp_queued ? ' Данные для входа отправлены в WhatsApp.' : '');
      toast.success(`Пациент создан.${notified}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || Object.values(err?.response?.data || {})[0] as string || 'Ошибка создания пациента');
    } finally {
      setCreatingPatient(false);
    }
  };

  const generateNewPatientPassword = () => setNewPatientForm(p => ({ ...p, password: generateRandomPassword() }));
  const copyNewPatientPassword = () => {
    if (!newPatientForm.password) return;
    navigator.clipboard.writeText(newPatientForm.password);
    toast.success('Пароль скопирован');
  };

  const handleDoctorChange = (val: string) => {
    const staffList = consultationType === 'home' ? nurses : doctors;
    const member = staffList.find(d => String(d.id) === val);
    const rawPrice = member
      ? (consultationType === 'online' ? member.online_consultation_price : member.offline_consultation_price)
      : null;
    const newPrice = rawPrice != null && rawPrice !== '' ? Number(rawPrice) : 0;

    // Default the payment type to whatever this doctor has configured as their
    // preference for this consultation type — the admin can still pick a
    // different option afterward via the Payment Type buttons below. A price
    // of 0 (not set) makes any prepay amount meaningless, so treat it as free
    // regardless of the doctor's configured preference.
    if (member && (consultationType === 'online' || consultationType === 'offline')) {
      if (newPrice <= 0) {
        setPaymentType('free');
        setPrepayAmount('');
      } else {
        const pref = consultationType === 'online' ? member.online_payment_preference : member.offline_payment_preference;
        const prepayPct = consultationType === 'online' ? member.online_prepay_percent : member.offline_prepay_percent;
        setPaymentType(pref || 'pay_at_clinic');
        if (pref === 'partial_prepay') {
          const pct = prepayPct ?? 50;
          setPrepayAmount(String(Math.round(newPrice * pct / 100)));
        } else {
          setPrepayAmount('');
        }
      }
    }

    setFormData({ ...formData, doctor_id: val, time: '', duration: member?.preferred_consultation_duration || formData.duration });
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
        onEventAdded();
        setCreatedInfo({});
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

  if (!isOpen) return null;

  // Success step — shown after consultation is created
  if (createdInfo !== null) {
    const patient = patients.find(p => String(p.id) === formData.patient_id);
    const doctor = doctors.find(d => String(d.id) === formData.doctor_id);
    const referringDoctor = doctors.find(d => String(d.id) === formData.referring_doctor_id);
    return (
      <EventSuccessScreen
        consultationType={consultationType}
        formData={formData}
        paymentType={paymentType}
        prepayAmount={prepayAmount}
        createdInfo={createdInfo}
        patient={patient}
        doctor={doctor}
        diagService={selectedDiagService}
        referringDoctor={referringDoctor}
        clinicName={clinicName}
        clinicAddress={clinicAddress}
        onClose={onClose}
      />
    );
  }

  const slots = generateSlots();
  const doctorPrice = (() => {
    const member = doctors.find(d => String(d.id) === formData.doctor_id);
    const rawPrice = member ? (consultationType === 'online' ? member.online_consultation_price : member.offline_consultation_price) : null;
    return rawPrice != null && rawPrice !== '' ? Number(rawPrice) : 0;
  })();
  const doctorPaymentPreference = (() => {
    if (consultationType !== 'online' && consultationType !== 'offline') return undefined;
    const member = doctors.find(d => String(d.id) === formData.doctor_id);
    return member ? (consultationType === 'online' ? member.online_payment_preference : member.offline_payment_preference) : undefined;
  })();

  // Price summary
  let priceSummary: { price: string; label: string } | null = null;
  if (consultationType === 'diagnostics' && selectedDiagService?.price) {
    priceSummary = { price: selectedDiagService.price, label: selectedDiagService.name };
  } else if (formData.doctor_id) {
    const staffList = consultationType === 'home' ? nurses : doctors;
    const member = staffList.find(d => String(d.id) === formData.doctor_id);
    if (member) {
      const raw = consultationType === 'online' ? member.online_consultation_price : member.offline_consultation_price;
      if (raw) priceSummary = { price: raw, label: `${member.first_name} ${member.last_name}` };
    }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
            Добавить Запись
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pt-8 space-y-6">
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

          <PatientSection
            patients={patients}
            patientId={formData.patient_id}
            onPatientChange={(val) => setFormData({ ...formData, patient_id: val })}
            showNewPatientForm={showNewPatientForm}
            onToggleNewPatientForm={() => { setShowNewPatientForm(v => !v); setFormData(prev => ({ ...prev, patient_id: '' })); }}
            newPatientForm={newPatientForm}
            onNewPatientFormChange={setNewPatientForm}
            creatingPatient={creatingPatient}
            onCreatePatient={handleCreatePatient}
            onGeneratePassword={generateNewPatientPassword}
            onCopyPassword={copyNewPatientPassword}
          />

          {/* Doctor / Nurse (hidden for diagnostics) */}
          {consultationType !== 'diagnostics' && (
            <StaffSection
              consultationType={consultationType}
              doctors={doctors}
              nurses={nurses}
              doctorId={formData.doctor_id}
              onDoctorChange={handleDoctorChange}
              loadingAvailability={loadingAvailability}
              doctorFirstSlots={doctorFirstSlots}
              doctorHasSchedule={doctorHasSchedule}
              date={formData.date}
              onOpenSchedule={setScheduleEditMember}
            />
          )}

          {/* Diagnostics — Service (search first; category is derived from the pick, not chosen up front) */}
          {consultationType === 'diagnostics' && (
            <DiagnosticsSection
              diagServices={diagServices}
              loadingDiagServices={loadingDiagServices}
              selectedDiagService={selectedDiagService}
              onServiceChange={(val) => setSelectedDiagService(diagServices.find(s => String(s.id) === val) ?? null)}
              diagCategoryList={diagCategoryList}
              clinicCurrency={clinicCurrency}
              doctors={doctors}
              referringDoctorId={formData.referring_doctor_id}
              onReferringDoctorChange={(val) => setFormData({ ...formData, referring_doctor_id: val })}
            />
          )}

          <DateTimeSection
            consultationType={consultationType}
            date={formData.date}
            onDateChange={(val) => setFormData({ ...formData, date: val })}
            time={formData.time}
            onTimeChange={(val) => setFormData(f => ({ ...f, time: val }))}
            duration={formData.duration}
            onDurationChange={(val) => setFormData({ ...formData, duration: val })}
            doctorId={formData.doctor_id}
            loadingAvailability={loadingAvailability}
            slots={slots}
            availabilityEntry={availabilityEntry}
            timePickerOpen={timePickerOpen}
            onTimePickerToggle={() => setTimePickerOpen(v => !v)}
            timePickerRef={timePickerRef}
            selectedDiagService={selectedDiagService}
            diagSlots={diagSlots}
            loadingDiagSlots={loadingDiagSlots}
          />

          {/* Price summary */}
          {priceSummary && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50">
              <Banknote className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-600 font-medium truncate">{priceSummary.label}</p>
                <p className="text-lg font-black text-emerald-700 leading-tight">
                  {Number(priceSummary.price).toLocaleString('ru-RU')} {getCurrencySymbol(clinicCurrency)}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-100 px-2 py-1 rounded-lg">
                Стоимость
              </span>
            </div>
          )}

          {/* Payment Type (consultations only, after doctor is selected) */}
          {(consultationType === 'online' || consultationType === 'offline') && formData.doctor_id && (
            <PaymentSection
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              prepayAmount={prepayAmount}
              onPrepayAmountChange={setPrepayAmount}
              doctorPrice={doctorPrice}
              doctorPreference={doctorPaymentPreference}
            />
          )}

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
          <div className="sticky bottom-0 z-10 -mx-8 flex gap-4 rounded-b-3xl border-t-2 border-gray-100 bg-white px-8 pt-6 pb-8">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
