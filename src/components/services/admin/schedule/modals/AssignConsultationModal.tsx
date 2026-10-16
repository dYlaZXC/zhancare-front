"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Search,
  X,
  Clock,
  Video,
  Home,
  Check,
  Loader2,
  Plus,
  Banknote,
} from "lucide-react";
import SearchSelect from "../components/SearchSelect";
import { DURATION_OPTIONS, minutesBetween, addMinutes } from "../utils/durationOptions";
import { usePhoneVerification } from "@/components/services/admin/patient-management/hooks/usePatientVerificationCodes";
import PhoneVerificationField from "@/components/services/admin/patient-management/components/PhoneVerificationField";
import { PaymentSection } from "./add-event/components/PaymentSection";
import type { PaymentTypeOption, StaffMember } from "./add-event/types/addEventTypes";
import { useClinicCurrency } from "@/context/BrandContext";
import { getCurrencySymbol } from "@/utils/currency";

interface AssignConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  /** A nurse books a home visit, not an online/offline consultation — no
   * "Тип консультации" choice, and the submit below sends type='home_visit'
   * instead of 'consultation'. Defaults to 'doctor' for the existing
   * DoctorsScheduleContent call site, which never passes this. */
  staffRole?: 'doctor' | 'nurse';
  slot: any;
  availableSlots: any[];
  date: string;
  onAssigned: () => void;
}

export default function AssignConsultationModal({
  isOpen,
  onClose,
  doctorId,
  doctorName,
  doctorSpecialization,
  staffRole = 'doctor',
  slot,
  availableSlots,
  date,
  onAssigned
}: AssignConsultationModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; phone?: string } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(slot || null);
  // Defaults to the doctor's own step size (every generated slot in
  // availableSlots spans exactly their preferred_consultation_duration —
  // see generateSlots/generateAllSlots in the callers), but stays editable:
  // an admin booking a longer/shorter visit for THIS patient no longer has
  // to leave this quick-book flow and use the full "Добавить Запись" modal
  // instead (that hardcoded 30 here regardless of what was actually free).
  const [duration, setDuration] = useState<number>(30);
  const [consultationType, setConsultationType] = useState<'online' | 'offline'>('online');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const phoneVerification = usePhoneVerification(newPatientForm.phone);
  const patientSearchRef = useRef<HTMLDivElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);

  // Payment — this quick-book modal used to send no payment info at all,
  // silently defaulting to 'pay_at_clinic' server-side (ScheduleViewSet.create,
  // common/views/admin.py) regardless of what the doctor actually has
  // configured (e.g. a required prepayment). /staff/ already returns full
  // pricing/preference fields (AddEventModal uses the same endpoint) — doctorId
  // here is only an id, so fetch it directly rather than threading pricing
  // through every caller of this modal.
  const [doctorProfile, setDoctorProfile] = useState<StaffMember | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentTypeOption>('pay_at_clinic');
  const [prepayAmount, setPrepayAmount] = useState('');
  const { clinicCurrency } = useClinicCurrency();

  useEffect(() => {
    if (!isOpen || staffRole === 'nurse') return;
    api.get('/staff/').then(res => {
      const match = (res.data || []).find((s: any) => s.id === doctorId);
      setDoctorProfile(match || null);
    }).catch(() => setDoctorProfile(null));
  }, [isOpen, doctorId, staffRole]);

  const doctorPrice = (() => {
    if (!doctorProfile) return 0;
    const raw = consultationType === 'online' ? doctorProfile.online_consultation_price : doctorProfile.offline_consultation_price;
    return raw != null && raw !== '' ? Number(raw) : 0;
  })();
  const doctorPaymentPreference = doctorProfile
    ? (consultationType === 'online' ? doctorProfile.online_payment_preference : doctorProfile.offline_payment_preference)
    : undefined;

  // Re-derive the default payment type whenever the doctor's pricing loads or
  // the online/offline toggle changes — mirrors AddEventModal's
  // handleDoctorChange logic. The admin can still override via PaymentSection.
  useEffect(() => {
    if (!doctorProfile || staffRole === 'nurse') return;
    if (doctorPrice <= 0) {
      setPaymentType('free');
      setPrepayAmount('');
      return;
    }
    const pref = doctorPaymentPreference;
    const prepayPct = consultationType === 'online' ? doctorProfile.online_prepay_percent : doctorProfile.offline_prepay_percent;
    setPaymentType(pref || 'pay_at_clinic');
    if (pref === 'partial_prepay') {
      setPrepayAmount(String(Math.round(doctorPrice * (prepayPct ?? 50) / 100)));
    } else {
      setPrepayAmount('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorProfile, consultationType]);

  const handleCreatePatient = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim() || phoneVerification.status !== 'verified') {
      toast.error('Заполните имя, фамилию и подтвердите телефон');
      return;
    }
    setCreatingPatient(true);
    try {
      const response = await api.post('/patients/', newPatientForm);
      const created = response.data;
      setPatients(prev => [...prev, created]);
      setSelectedPatient({ id: created.id, name: `${created.first_name} ${created.last_name}`, phone: created.phone });
      setShowNewPatientForm(false);
      setNewPatientForm({ first_name: '', last_name: '', phone: '' });
      phoneVerification.reset();
      toast.success(`Пациент ${created.first_name} ${created.last_name} создан и выбран`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || Object.values(err?.response?.data || {})[0] as string || 'Ошибка создания пациента');
    } finally {
      setCreatingPatient(false);
    }
  };

  // The doctor's own typical duration — derived from the generated slots
  // themselves (every entry in availableSlots spans exactly this many
  // minutes) rather than a new prop, since the callers already encode it
  // there. Falls back to whichever slot was pre-selected, then 30.
  const doctorDefaultDuration = availableSlots.length > 0
    ? minutesBetween(availableSlots[0].start_time, availableSlots[0].end_time)
    : slot
    ? minutesBetween(slot.start_time, slot.end_time)
    : null;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSlot(slot || null);
    setDuration(doctorDefaultDuration ?? 30);
    setSelectedPatient(null);
    setPatientSearch('');
    setNotes('');
    setConsultationType('online');
    setShowNewPatientForm(false);
    setNewPatientForm({ first_name: '', last_name: '', phone: '' });
    phoneVerification.reset();
    setDoctorProfile(null);
    setPaymentType('pay_at_clinic');
    setPrepayAmount('');

    const fetchPatients = async () => {
      setPatientsLoading(true);
      try {
        const response = await api.get('/patients/?all=true');
        const data = Array.isArray(response.data) ? response.data : response.data?.results ?? [];
        setPatients(data);
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Не удалось загрузить список пациентов';
        toast.error(msg);
      } finally {
        setPatientsLoading(false);
      }
    };
    fetchPatients();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = patientSearch.trim()
    ? patients.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const q = patientSearch.toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
    : patients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Выберите пациента'); return; }
    if (!selectedSlot) { toast.error('Выберите время приёма'); return; }
    if (staffRole !== 'nurse' && paymentType === 'partial_prepay' && !prepayAmount) {
      toast.error('Укажите сумму предоплаты');
      return;
    }
    setSubmitting(true);

    try {
      await api.post('/schedule/', staffRole === 'nurse' ? {
        // Same shape AddEventModal itself sends for a home visit — the
        // nurse's id still goes under doctor_id (the backend's own
        // create() resolves staff via `nurse_id or doctor_id`, and this
        // frontend never actually sends a separate nurse_id key either).
        type: 'home_visit',
        consultation_type: 'home',
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        date: date,
        time: selectedSlot.start_time,
        duration,
        notes: notes,
      } : {
        type: 'consultation',
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        date: date,
        time: selectedSlot.start_time,
        duration,
        consultation_type: consultationType,
        notes: notes,
        payment_type: paymentType,
        ...(paymentType === 'partial_prepay' && prepayAmount ? { prepay_amount: prepayAmount } : {}),
      });
      toast.success('Запись успешно создана!');
      onAssigned();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = doctorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#1e263e' }}>Новая запись</h3>
            <p className="text-sm text-gray-400 mt-0.5">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* Doctor info */}
            <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #3772ff 0%, #6c47ff 100%)' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{doctorName}</p>
                {doctorSpecialization && <p className="text-xs text-gray-400 truncate">{doctorSpecialization}</p>}
              </div>
              <span className="flex-shrink-0 text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                {staffRole === 'nurse' ? 'Медсестра' : 'Врач'}
              </span>
            </div>

            {/* Slot picker */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Время приёма <span className="text-red-500">*</span>
              </label>
              {availableSlots.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  Нет свободных слотов на этот день
                </div>
              ) : (
                <>
                  {/* Nearest slot — big featured button */}
                  {(() => {
                    const nearest = selectedSlot || availableSlots[0];
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(nearest)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 mb-3 transition-all ${
                          selectedSlot?.start_time === nearest.start_time
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white group'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selectedSlot?.start_time === nearest.start_time ? 'bg-white/20' : 'bg-white shadow-sm'
                        }`}>
                          <Clock className={`w-6 h-6 ${selectedSlot?.start_time === nearest.start_time ? 'text-white' : 'text-emerald-500'}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold leading-tight">Ближайший: {nearest.start_time}</p>
                          <p className={`text-xs mt-0.5 ${selectedSlot?.start_time === nearest.start_time ? 'text-emerald-100' : 'text-emerald-400'}`}>
                            до {addMinutes(nearest.start_time, duration)}
                          </p>
                        </div>
                        {selectedSlot?.start_time === nearest.start_time && (
                          <Check className="w-5 h-5 ml-auto text-white" />
                        )}
                      </button>
                    );
                  })()}
                  {/* Full slot grid */}
                  {availableSlots.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {availableSlots.map((s, i) => {
                        const isSelected = selectedSlot?.start_time === s.start_time;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                          >
                            {s.start_time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Duration — defaults to this doctor's own typical slot length
                (derived from availableSlots), but stays editable: the admin
                can book a longer/shorter visit for this one patient without
                leaving this quick-book flow. Booking then locks exactly
                that window (BookingService.acquire_slot_for_time already
                handles genuine overlap, not just exact-start matches). */}
            {selectedSlot && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                  Продолжительность
                </label>
                <SearchSelect
                  options={DURATION_OPTIONS}
                  value={String(duration)}
                  onChange={(val) => setDuration(parseInt(val))}
                  placeholder="Выберите продолжительность..."
                />
                {doctorDefaultDuration != null && (
                  duration === doctorDefaultDuration ? (
                    <p className="text-xs text-gray-400 mt-1.5">По умолчанию для этого специалиста</p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Обычно у этого специалиста {DURATION_OPTIONS.find(o => o.id === doctorDefaultDuration)?.label?.toLowerCase() ?? `${doctorDefaultDuration} минут`}.{' '}
                      <button
                        type="button"
                        onClick={() => setDuration(doctorDefaultDuration)}
                        className="underline font-semibold hover:text-amber-700"
                      >
                        Вернуть по умолчанию
                      </button>
                    </p>
                  )
                )}
              </div>
            )}

            {/* Consultation type — a home visit doesn't have one; a nurse
                always makes a home visit, no online/offline choice to make. */}
            {staffRole !== 'nurse' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                  Тип консультации
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([['online', 'Видеоконсультация', Video], ['offline', 'Приём в клинике', Home]] as const).map(([val, label, Icon]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConsultationType(val)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        consultationType === val
                          ? val === 'online'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Patient search */}
            <div ref={patientSearchRef} className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: '#1e263e' }}>
                  Пациент <span className="text-red-500">*</span>
                </label>
                {!selectedPatient && (
                  <button
                    type="button"
                    onClick={() => { setShowNewPatientForm(v => !v); setPatientSearch(''); }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      showNewPatientForm ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {showNewPatientForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showNewPatientForm ? 'Отмена' : 'Новый пациент'}
                  </button>
                )}
              </div>

              {showNewPatientForm && (
                <div className="mb-3 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Новый пациент</p>
                  <div className="grid grid-cols-2 gap-2">
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
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Телефон <span className="text-red-500">*</span></label>
                      <PhoneVerificationField
                        phone={newPatientForm.phone}
                        onPhoneChange={(e164) => setNewPatientForm(p => ({ ...p, phone: e164 }))}
                        status={phoneVerification.status}
                        onSend={phoneVerification.send}
                        onVerify={phoneVerification.verify}
                        onResend={phoneVerification.resend}
                        otpError={phoneVerification.otpError}
                        onChangePhone={phoneVerification.changePhone}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreatePatient}
                    disabled={creatingPatient || phoneVerification.status !== 'verified'}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
                  >
                    {creatingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creatingPatient ? 'Создание...' : 'Создать и выбрать'}
                  </button>
                </div>
              )}
              {selectedPatient ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.name}</p>
                    {selectedPatient.phone && <p className="text-xs text-gray-500">{selectedPatient.phone}</p>}
                  </div>
                  <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-200 text-emerald-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {patientsLoading
                      ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    }
                    <input
                      ref={patientInputRef}
                      type="text"
                      value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                      onFocus={() => {
                        if (patientInputRef.current) setDropdownRect(patientInputRef.current.getBoundingClientRect());
                        setShowPatientDropdown(true);
                      }}
                      placeholder={patientsLoading ? 'Загрузка пациентов...' : `Поиск среди ${patients.length} пациентов...`}
                      disabled={patientsLoading}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  {showPatientDropdown && !patientsLoading && dropdownRect && (
                    <div
                      style={{
                        position: 'fixed',
                        top: dropdownRect.bottom + 4,
                        left: dropdownRect.left,
                        width: dropdownRect.width,
                        zIndex: 9999,
                      }}
                      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
                    >
                      {filteredPatients.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          {patients.length === 0 ? 'Нет доступных пациентов' : 'Пациенты не найдены'}
                        </div>
                      ) : (
                        <>
                          {filteredPatients.slice(0, 20).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setSelectedPatient({ id: p.id, name: `${p.first_name} ${p.last_name}`, phone: p.phone });
                                setPatientSearch('');
                                setShowPatientDropdown(false);
                              }}
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {(p.first_name?.[0] || '?')}{(p.last_name?.[0] || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{p.first_name} {p.last_name}</p>
                                {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                              </div>
                            </button>
                          ))}
                          {filteredPatients.length > 20 && (
                            <p className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                              Уточните поиск — ещё {filteredPatients.length - 20} пациентов
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Price summary + Payment Type (consultations only — a home
                visit via this same modal has no payment concept) */}
            {staffRole !== 'nurse' && doctorPrice > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50">
                <Banknote className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-600 font-medium truncate">{doctorName}</p>
                  <p className="text-lg font-black text-emerald-700 leading-tight">
                    {doctorPrice.toLocaleString('ru-RU')} {getCurrencySymbol(clinicCurrency)}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-100 px-2 py-1 rounded-lg">
                  Стоимость
                </span>
              </div>
            )}
            {staffRole !== 'nurse' && doctorProfile && (
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Дополнительная информация о записи..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPatient || !selectedSlot}
              className="flex-1 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Создание...' : 'Создать запись'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
