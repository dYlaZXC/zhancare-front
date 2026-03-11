"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { X, Loader2, AlertCircle } from "lucide-react";

// Import types from centralized types file
import type { Patient, Doctor, Nurse } from "../types/scheduleTypes";

// Import components
import SearchSelect from "../components/SearchSelect";
import PatientInfoCard from "../components/PatientInfoCard";
import DoctorInfoCard from "../components/DoctorInfoCard";
import NurseInfoCard from "../components/NurseInfoCard";
import EventTypeSelector from "../components/EventTypeSelector";
import TimeSlotsSelector from "../components/TimeSlotsSelector";
import DoctorAvailabilityIndicator from "../components/DoctorAvailabilityIndicator";

interface AddEventModalProps {
  show: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

interface AvailableSlot {
  id: number;
  start_time: string;
  end_time: string;
  available_capacity: number;
}

export default function AddEventModal({ show, onClose, onEventAdded }: AddEventModalProps) {
  const [eventType, setEventType] = useState<'consultation' | 'appointment'>('consultation');
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    nurse_id: '',
    date: (() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    })(),
    time: '',
    duration: 30,
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDoctorIds, setAvailableDoctorIds] = useState<Set<number>>(new Set());
  const [loadingAvailableDoctors, setLoadingAvailableDoctors] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);

  // Fetch patients, doctors, and nurses when modal opens
  useEffect(() => {
    if (!show) return;
    const fetchData = async () => {
      try {
        const [patientsRes, staffRes] = await Promise.all([
          api.get('/patients/?all=true'),
          api.get('/staff/')
        ]);
        setPatients(patientsRes.data);
        setDoctors(staffRes.data.filter((s: any) => s.role === 'doctor'));
        setNurses(staffRes.data.filter((s: any) => s.role === 'nurse'));
      } catch (err) {
        console.error("Failed to load patients/staff:", err);
      }
    };
    fetchData();
  }, [show]);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      setFormData({
        patient_id: '',
        doctor_id: '',
        nurse_id: '',
        date: dateString,
        time: '',
        duration: 30,
        address: '',
        notes: ''
      });
      setEventType('consultation');
    }
  }, [show]);

  // Fetch available doctors when date, time, or duration changes
  useEffect(() => {
    if (!formData.date || !formData.time || eventType !== 'consultation') {
      setAvailableDoctorIds(new Set());
      return;
    }

    const fetchAvailableDoctors = async () => {
      setLoadingAvailableDoctors(true);
      try {
        const response = await api.get('/consultations/available-doctors/', {
          params: {
            date: formData.date,
            time: formData.time,
            duration: formData.duration
          }
        });
        const doctorIds = new Set<number>(response.data.available_doctors.map((d: any) => d.id));
        setAvailableDoctorIds(doctorIds);

        // If currently selected doctor is not available, clear selection
        if (formData.doctor_id && !doctorIds.has(parseInt(formData.doctor_id))) {
          setFormData(prev => ({ ...prev, doctor_id: '' }));
        }
      } catch (err) {
        console.error("Failed to fetch available doctors:", err);
        setAvailableDoctorIds(new Set());
      } finally {
        setLoadingAvailableDoctors(false);
      }
    };

    fetchAvailableDoctors();
  }, [formData.date, formData.time, formData.duration, eventType]);

  // Fetch available time slots when doctor, date, or duration changes
  useEffect(() => {
    if (!formData.doctor_id || !formData.date || eventType !== 'consultation') {
      setAvailableSlots([]);
      return;
    }

    const fetchAvailableSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await api.get('/consultations/available-slots/', {
          params: {
            doctor_id: formData.doctor_id,
            date: formData.date,
            duration: formData.duration
          }
        });
        setAvailableSlots(response.data.available_slots || []);
      } catch (err) {
        console.error("Failed to fetch available slots:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [formData.doctor_id, formData.date, formData.duration, eventType]);

  // Auto-fill duration based on doctor's preferred consultation duration
  useEffect(() => {
    if (formData.doctor_id && eventType === 'consultation') {
      const selectedDoctor = doctors.find(d => String(d.id) === formData.doctor_id);
      if (selectedDoctor?.preferred_consultation_duration) {
        setFormData(prev => ({
          ...prev,
          duration: selectedDoctor.preferred_consultation_duration!
        }));
      }
    }
  }, [formData.doctor_id, doctors, eventType]);

  // Helper function to check if doctor has a valid schedule configured
  const doctorHasSchedule = (doctor: Doctor) => {
    const schedule = doctor.online_work_schedule;
    if (!schedule) return false;

    // Check if at least one day is enabled
    return Object.values(schedule).some((day: any) =>
      typeof day === 'object' && day.enabled === true
    );
  };

  // Count doctors without schedules
  const doctorsWithoutSchedule = doctors.filter(d => !doctorHasSchedule(d)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        type: eventType,
        patient_id: formData.patient_id,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        notes: formData.notes,
      };

      if (eventType === 'consultation') {
        payload.doctor_id = formData.doctor_id;
      } else {
        payload.nurse_id = formData.nurse_id;
        payload.doctor_id = formData.doctor_id || undefined;
        payload.address = formData.address;
      }

      await api.post('/schedule/', payload);
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

  if (!show) return null;

  const selectedPatient = patients.find(p => String(p.id) === formData.patient_id) || null;
  const selectedDoctor = doctors.find(d => String(d.id) === formData.doctor_id) || null;
  const selectedNurse = nurses.find(n => String(n.id) === formData.nurse_id) || null;

  return (
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
          {/* Event Type */}
          <EventTypeSelector
            eventType={eventType}
            onChange={setEventType}
          />

          {/* Patient */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Пациент <span className="text-red-500">*</span>
            </label>
            <SearchSelect
              options={patients.map(p => ({ id: p.id, label: `${p.first_name} ${p.last_name}`, subtitle: p.email }))}
              value={formData.patient_id}
              onChange={(val) => setFormData({ ...formData, patient_id: val })}
              placeholder="Выберите пациента..."
              required
            />
            <PatientInfoCard patient={selectedPatient} />
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Доктор {eventType === 'consultation' && <span className="text-red-500">*</span>}
              {loadingAvailableDoctors && (
                <span className="ml-2 text-xs text-gray-500">
                  <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                  Проверка доступности...
                </span>
              )}
            </label>
            <SearchSelect
              options={doctors
                .filter(d => {
                  // First, check if doctor has a schedule configured
                  if (!doctorHasSchedule(d)) return false;

                  // If date & time are selected for consultation, only show available doctors
                  if (formData.date && formData.time && eventType === 'consultation') {
                    return availableDoctorIds.has(d.id);
                  }
                  // Otherwise show all doctors with schedules
                  return true;
                })
                .map(d => {
                  const isAvailable = availableDoctorIds.has(d.id);
                  const availabilityBadge = formData.date && formData.time && eventType === 'consultation' && isAvailable
                    ? ' ✅'
                    : '';

                  // Build subtitle with specialization and email
                  const subtitleParts = [];
                  if (d.specialization) subtitleParts.push(d.specialization);
                  if (d.email) subtitleParts.push(d.email);
                  const subtitle = subtitleParts.join(' • ');

                  return {
                    id: d.id,
                    label: `${d.first_name} ${d.last_name}${availabilityBadge}`,
                    subtitle: subtitle || undefined
                  };
                })}
              value={formData.doctor_id}
              onChange={(val) => setFormData({ ...formData, doctor_id: val })}
              placeholder={
                formData.date && formData.time && eventType === 'consultation' && availableDoctorIds.size === 0
                  ? "Нет доступных докторов"
                  : "Выберите доктора..."
              }
              required={eventType === 'consultation'}
            />

            {/* Info about doctors without schedules */}
            {doctorsWithoutSchedule > 0 && (
              <div className="mt-2 p-3 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{doctorsWithoutSchedule}</span> {doctorsWithoutSchedule === 1 ? 'доктор не имеет' : 'докторов не имеют'} настроенного расписания. Пожалуйста, обновите расписание для {doctorsWithoutSchedule === 1 ? 'этого доктора' : 'этих докторов'} в разделе "Персонал".
                </p>
              </div>
            )}

            {/* Availability info */}
            {eventType === 'consultation' && (
              <DoctorAvailabilityIndicator
                availableDoctorIds={availableDoctorIds}
                formData={formData}
                loadingAvailableDoctors={loadingAvailableDoctors}
              />
            )}

            <DoctorInfoCard doctor={selectedDoctor} />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Продолжительность (минут)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value={15}>15 минут</option>
              <option value={30}>30 минут</option>
              <option value={45}>45 минут</option>
              <option value={60}>1 час</option>
              <option value={90}>1.5 часа</option>
              <option value={120}>2 часа</option>
            </select>
          </div>

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

          {/* Time */}
          <TimeSlotsSelector
            eventType={eventType}
            formData={formData}
            onChange={(time) => setFormData({ ...formData, time })}
            availableSlots={availableSlots}
            loadingSlots={loadingSlots}
          />

          {/* Nurse — only for appointments */}
          {eventType === 'appointment' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Медсестра <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                options={nurses.map(n => ({ id: n.id, label: `${n.first_name} ${n.last_name}`, subtitle: n.email }))}
                value={formData.nurse_id}
                onChange={(val) => setFormData({ ...formData, nurse_id: val })}
                placeholder="Выберите медсестру..."
                required
              />
              <NurseInfoCard nurse={selectedNurse} />
            </div>
          )}

          {/* Address — only for appointments */}
          {eventType === 'appointment' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Адрес вызова <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ул. Абая 150, кв. 25"
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
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
  );
}
