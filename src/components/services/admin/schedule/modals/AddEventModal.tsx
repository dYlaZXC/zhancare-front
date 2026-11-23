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
import { PatientSection, type NewPatientForm, type VerificationStatus } from "./add-event/components/PatientSection";
import { StaffSection } from "./add-event/components/StaffSection";
import { DiagnosticsSection } from "./add-event/components/DiagnosticsSection";
import { DateTimeSection } from "./add-event/components/DateTimeSection";
import { PaymentSection } from "./add-event/components/PaymentSection";
import { EventSuccessScreen } from "./add-event/components/EventSuccessScreen";
import { getClinicToday, getClinicNowMinutes } from "../utils/scheduleUtils";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onEventAdded: () => void;
  /** Docks the card to the left instead of centering it — used when
   * DateDetailsDrawer is ALSO open for the same date (see ScheduleView's
   * "+" on a day cell), so the drawer's own right-anchored panel doesn't
   * sit on top of/cover part of this card. */
  dockLeft?: boolean;
  /** Fires whenever the admin changes the date field here — lets the
   * caller keep DateDetailsDrawer (when also open) pointed at the same
   * date, instead of it silently going stale the moment the two disagree. */
  onDateChange?: (date: string) => void;
  /** Fires whenever the consultation type here changes — same idea as
   * onDateChange, so DateDetailsDrawer's "Свободные врачи" Видео/В клинике
   * toggle (when also open) can follow along. Home visit/diagnostics have
   * no equivalent there (that tab only ever books online/offline), so the
   * caller just leaves its own toggle alone for those two. */
  onConsultationTypeChange?: (type: ConsultationType) => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  selectedDate,
  onEventAdded,
  dockLeft = false,
  onDateChange: onSelectedDateChange,
  onConsultationTypeChange,
}: AddEventModalProps) {
  const [consultationType, setConsultationType] = useState<ConsultationType>('online');
  // Reports every change (not just the type-card clicks) so the reset-on-
  // open effect below — which also sets this back to 'online' — keeps the
  // caller's copy (DateDetailsDrawer's toggle, when also open) in sync too,
  // without having to thread the callback into every individual call site.
  useEffect(() => { onConsultationTypeChange?.(consultationType); }, [consultationType, onConsultationTypeChange]);
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
  const [newPatientForm, setNewPatientForm] = useState<NewPatientForm>({ first_name: '', last_name: '', phone: '', email: '', referral_source: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);
  // New patient is created only once the phone (always) and email (only if
  // given) have been verified via a code the PATIENT reads back to the
  // admin — see PatientsViewSet.create's own docstring (common/views/admin.py)
  // for why this replaced the old admin-typed-password flow.
  const [phoneStatus, setPhoneStatus] = useState<VerificationStatus>('unset');
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<VerificationStatus>('unset');
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);

  const resetNewPatientForm = () => {
    setNewPatientForm({ first_name: '', last_name: '', phone: '', email: '', referral_source: '' });
    setPhoneStatus('unset');
    setPhoneOtpError(null);
    setEmailStatus('unset');
    setEmailOtpError(null);
  };
  const [scheduleEditMember, setScheduleEditMember] = useState<{ id: number; first_name: string; last_name: string } | null>(null);
  const [availabilityEntry, setAvailabilityEntry] = useState<{ start_time: string; end_time: string } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  // Each existing booking's REAL [start, end) window (in minutes since
  // midnight, clinic-local) — not just its start time. Duration now varies
  // per booking (an admin can override it — see DateTimeSection), so a
  // candidate slot must be checked for genuine overlap against these
  // windows, not matched against a set of exact start-time strings.
  const [bookedIntervals, setBookedIntervals] = useState<{ startMin: number; endMin: number }[]>([]);
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
      resetNewPatientForm();
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

  // Fetch booked consultations for selected doctor+date to mark busy slots —
  // `duration` here is the booking's own ACTUAL duration (the backend now
  // derives it from the real AppointmentSlot, not the doctor's default), so
  // a slot extended past its usual length correctly shows everything it
  // overlaps as busy, not just its own start time.
  useEffect(() => {
    if (!formData.doctor_id || !formData.date) { setBookedIntervals([]); return; }
    api.get('/schedule/', { params: { doctor_id: formData.doctor_id, date: formData.date } })
      .then(res => {
        const intervals = (res.data as any[])
          .map(e => {
            const t = (e.time as string | undefined)?.substring(0, 5);
            if (!t) return null;
            const [h, m] = t.split(':').map(Number);
            const startMin = h * 60 + m;
            const duration = typeof e.duration === 'number' && e.duration > 0 ? e.duration : 30;
            return { startMin, endMin: startMin + duration };
          })
          .filter((iv): iv is { startMin: number; endMin: number } => iv !== null);
        setBookedIntervals(intervals);
      })
      .catch(() => setBookedIntervals([]));
  }, [formData.doctor_id, formData.date]);

  // Duration defaults to the selected staff member's own preferred
  // consultation duration — set once, at selection time, by
  // handleDoctorChange below (which correctly checks nurses for a home
  // visit, doctors otherwise). Deliberately NOT a useEffect keyed on
  // [formData.doctor_id, doctors]: since duration is now admin-editable
  // (see DateTimeSection's "Продолжительность"), re-running this on every
  // doctors-array refetch would silently clobber a manual edit the admin
  // already made for THIS visit.

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

  // Default the payment type whenever the chosen diagnostics service changes —
  // services have no per-service payment preference (unlike a doctor's own
  // online/offline preference), so this always defaults to pay_at_clinic
  // (or free for a zero/unset price), same as book_diagnostics_appointment's
  // own pay-at-clinic-when-not-specified default. Admin can still override
  // via PaymentSection below.
  useEffect(() => {
    if (consultationType !== 'diagnostics') return;
    const price = selectedDiagService?.price ? Number(selectedDiagService.price) : 0;
    setPaymentType(price > 0 ? 'pay_at_clinic' : 'free');
    setPrepayAmount('');
  }, [consultationType, selectedDiagService]);

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
    const isToday = formData.date === getClinicToday(clinicTimezone);
    const nowMinutes = isToday ? getClinicNowMinutes(clinicTimezone) : -1;
    const fmt = (mins: number) => {
      const m = mins % (24 * 60);
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    };
    const slots: DoctorSlot[] = [];
    while (cur + duration <= endMin) {
      if (isToday && cur <= nowMinutes) { cur += duration; continue; }
      const s = fmt(cur);
      const e = fmt(cur + duration);
      const slotEnd = cur + duration;
      // Genuine overlap, not an exact-start-time match — a booking extended
      // past its usual length (e.g. 11:00–11:50 instead of 11:00–11:30)
      // must also grey out 11:30, not just 11:00, exactly like the
      // server-side conflict check (BookingService.acquire_slot_for_time).
      const busy = bookedIntervals.some(iv => cur < iv.endMin && iv.startMin < slotEnd);
      slots.push({ start: s, end: e, busy });
      cur += duration;
    }
    return slots;
  };

  // Auto-fill the nearest free slot once this doctor's real working hours +
  // busy intervals are known for the chosen date — the dropdown already
  // computes and shows this same "Ближайший слот: HH:MM" as a badge per
  // doctor, so silently requiring one more click to actually apply it was
  // pure friction for the overwhelmingly common case (book the very next
  // opening). Only fires while time is still empty: never overwrites a
  // slot the admin already picked or deliberately cleared via the time
  // picker's own × button.
  useEffect(() => {
    if (formData.time || !formData.doctor_id || !formData.date || loadingAvailability) return;
    const nextFree = generateSlots().find(s => !s.busy);
    if (nextFree) setFormData(f => (f.time ? f : { ...f, time: nextFree.start }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityEntry, bookedIntervals, formData.doctor_id, formData.date, loadingAvailability]);

  // A doctor "has a schedule" if they have either:
  // - active DoctorSchedule template rows (schedules[].is_active), OR
  // - DoctorAvailability entries this week (has_availability flag from the API)
  const doctorHasSchedule = (doctor: StaffMember) => {
    const hasTemplate = Array.isArray((doctor as any).schedules) && (doctor as any).schedules.some((s: any) => s.is_active);
    const hasAvailability = doctor.has_availability === true;
    return hasTemplate || hasAvailability;
  };

  const handleSendPhoneCode = async () => {
    setPhoneStatus('sending');
    try {
      await api.post('/patients/send-create-phone-code/', { phone: newPatientForm.phone });
      setPhoneOtpError(null);
      setPhoneStatus('sent');
    } catch (err: any) {
      // Phone already belongs to an existing patient — offer to just select
      // them instead of leaving the admin stuck on a dead-end error. Booking
      // them here makes them visible to this clinic on its own (see
      // PatientsViewSet.list's own docstring on self-booking visibility) —
      // no separate clinic-link step is required just to book an appointment.
      if (err?.response?.status === 409) {
        try {
          const lookupRes = await api.get('/patients/lookup/', { params: { phone: newPatientForm.phone } });
          if (lookupRes.data?.found) {
            const found = lookupRes.data.patient;
            setPatients(prev => prev.some(p => p.id === found.id) ? prev : [...prev, found]);
            setFormData(prev => ({ ...prev, patient_id: String(found.id) }));
            setShowNewPatientForm(false);
            resetNewPatientForm();
            toast.info(`Пациент ${found.first_name} ${found.last_name} уже есть в системе — выбран автоматически`);
            return;
          }
        } catch {
          // fall through to the generic error below
        }
      }
      toast.error(err?.response?.data?.error || 'Не удалось отправить код');
      setPhoneStatus('unset');
    }
  };

  const handleVerifyPhoneCode = async (code: string) => {
    setPhoneStatus('verifying');
    setPhoneOtpError(null);
    try {
      await api.post('/patients/verify-create-phone-code/', { phone: newPatientForm.phone, code });
      setPhoneStatus('verified');
    } catch (err: any) {
      setPhoneOtpError(err?.response?.data?.error || 'Неверный код. Попробуйте снова.');
      setPhoneStatus('sent');
    }
  };

  const handleResendPhoneCode = async (): Promise<boolean> => {
    try {
      await api.post('/patients/send-create-phone-code/', { phone: newPatientForm.phone });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Не удалось отправить код');
      return false;
    }
  };

  const handleChangePhone = () => {
    setPhoneStatus('unset');
    setPhoneOtpError(null);
  };

  const handleSendEmailCode = async () => {
    setEmailStatus('sending');
    try {
      await api.post('/patients/send-create-email-code/', { email: newPatientForm.email });
      setEmailOtpError(null);
      setEmailStatus('sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Не удалось отправить код');
      setEmailStatus('unset');
    }
  };

  const handleVerifyEmailCode = async (code: string) => {
    setEmailStatus('verifying');
    setEmailOtpError(null);
    try {
      await api.post('/patients/verify-create-email-code/', { email: newPatientForm.email, code });
      setEmailStatus('verified');
    } catch (err: any) {
      setEmailOtpError(err?.response?.data?.error || 'Неверный код. Попробуйте снова.');
      setEmailStatus('sent');
    }
  };

  const handleResendEmailCode = async (): Promise<boolean> => {
    try {
      await api.post('/patients/send-create-email-code/', { email: newPatientForm.email });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Не удалось отправить код');
      return false;
    }
  };

  const handleSkipEmail = () => {
    setEmailStatus('skipped');
    setEmailOtpError(null);
  };

  const handleChangeEmail = () => {
    setEmailStatus('unset');
    setEmailOtpError(null);
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim() || phoneStatus !== 'verified') {
      toast.error('Заполните имя, фамилию и подтвердите телефон');
      return;
    }
    if (newPatientForm.email.trim() && emailStatus !== 'verified' && emailStatus !== 'skipped') {
      toast.error('Подтвердите email или нажмите «Указать позже»');
      return;
    }
    setCreatingPatient(true);
    try {
      const payload = {
        first_name: newPatientForm.first_name,
        last_name: newPatientForm.last_name,
        phone: newPatientForm.phone,
        referral_source: newPatientForm.referral_source,
        // Only ever sent once actually verified — never an unconfirmed email.
        email: emailStatus === 'verified' ? newPatientForm.email : undefined,
      };
      const response = await api.post('/patients/', payload);
      const created = response.data;
      setPatients(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, patient_id: String(created.id) }));
      setShowNewPatientForm(false);
      resetNewPatientForm();
      toast.success('Пациент создан. Он сможет войти по телефону через «Войти по коду».');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || Object.values(err?.response?.data || {})[0] as string || 'Ошибка создания пациента');
    } finally {
      setCreatingPatient(false);
    }
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
    if (consultationType !== 'home' && paymentType === 'partial_prepay' && !prepayAmount) {
      toast.error('Укажите сумму предоплаты');
      return;
    }
    setSubmitting(true);

    try {
      if (consultationType === 'diagnostics') {
        await api.post('/diagnostics/appointments/', {
          service_id: selectedDiagService!.id,
          patient_id: formData.patient_id,
          doctor_id: formData.referring_doctor_id || undefined,
          scheduled_time: `${formData.date}T${formData.time}:00`,
          notes: formData.notes,
          payment_type: paymentType,
          ...(paymentType === 'partial_prepay' && prepayAmount ? { prepay_amount: prepayAmount } : {}),
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
    {/* dockLeft: centered within the space LEFT of the drawer (reserves
        exactly its max width, 42rem/672px = max-w-2xl) instead of the
        whole viewport, so the card sits in the middle of its own half
        rather than glued to the left edge. */}
    <div className={`fixed z-50 bg-black/50 flex items-center justify-center p-4 ${dockLeft ? 'top-0 left-0 bottom-0 right-[42rem]' : 'inset-0'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`bg-white rounded-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide ${dockLeft ? 'max-w-xl' : 'max-w-2xl'}`}
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
            onToggleNewPatientForm={() => { setShowNewPatientForm(v => !v); setFormData(prev => ({ ...prev, patient_id: '' })); resetNewPatientForm(); }}
            newPatientForm={newPatientForm}
            onNewPatientFormChange={setNewPatientForm}
            creatingPatient={creatingPatient}
            onCreatePatient={handleCreatePatient}
            phoneStatus={phoneStatus}
            onSendPhoneCode={handleSendPhoneCode}
            onVerifyPhoneCode={handleVerifyPhoneCode}
            onResendPhoneCode={handleResendPhoneCode}
            phoneOtpError={phoneOtpError}
            onChangePhone={handleChangePhone}
            emailStatus={emailStatus}
            onSendEmailCode={handleSendEmailCode}
            onVerifyEmailCode={handleVerifyEmailCode}
            onResendEmailCode={handleResendEmailCode}
            emailOtpError={emailOtpError}
            onSkipEmail={handleSkipEmail}
            onChangeEmail={handleChangeEmail}
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
            onDateChange={(val) => {
              setFormData({ ...formData, date: val });
              onSelectedDateChange?.(val);
            }}
            time={formData.time}
            onTimeChange={(val) => setFormData(f => ({ ...f, time: val }))}
            duration={formData.duration}
            onDurationChange={(val) => setFormData({ ...formData, duration: val })}
            defaultDuration={(consultationType === 'home' ? nurses : doctors).find(d => String(d.id) === formData.doctor_id)?.preferred_consultation_duration ?? null}
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

          {/* Payment Type — consultations (after a doctor is picked) or any
              diagnostics service (no doctor-preference concept there, so
              doctorPreference is simply omitted). Home visits have no
              payment concept at all, same as in AssignConsultationModal. */}
          {((consultationType === 'online' || consultationType === 'offline') && formData.doctor_id) && (
            <PaymentSection
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              prepayAmount={prepayAmount}
              onPrepayAmountChange={setPrepayAmount}
              doctorPrice={doctorPrice}
              doctorPreference={doctorPaymentPreference}
            />
          )}
          {consultationType === 'diagnostics' && selectedDiagService && (
            <PaymentSection
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              prepayAmount={prepayAmount}
              onPrepayAmountChange={setPrepayAmount}
              doctorPrice={selectedDiagService.price ? Number(selectedDiagService.price) : 0}
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
