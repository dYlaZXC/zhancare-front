"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

interface AssignConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
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
  slot,
  availableSlots,
  date,
  onAssigned
}: AssignConsultationModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; phone?: string } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(slot || null);
  const [consultationType, setConsultationType] = useState<'online' | 'offline'>('online');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSlot(slot || null);
    setSelectedPatient(null);
    setPatientSearch('');
    setNotes('');
    setConsultationType('online');

    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients/?all=true');
        setPatients(response.data);
      } catch (err) {
        console.error("Failed to load patients:", err);
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

  const filteredPatients = patients.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const q = patientSearch.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Выберите пациента'); return; }
    if (!selectedSlot) { toast.error('Выберите время приёма'); return; }
    setSubmitting(true);

    try {
      await api.post('/schedule/', {
        type: 'consultation',
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        date: date,
        time: selectedSlot.start_time,
        duration: 30,
        consultation_type: consultationType,
        notes: notes
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
              <span className="flex-shrink-0 text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">Врач</span>
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
                            до {nearest.end_time}
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

            {/* Consultation type */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Тип консультации
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([['online', 'Онлайн', Video], ['offline', 'Офлайн', Home]] as const).map(([val, label, Icon]) => (
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

            {/* Patient search */}
            <div ref={patientSearchRef} className="relative">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Пациент <span className="text-red-500">*</span>
              </label>
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Поиск по имени или телефону..."
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm transition-colors"
                    />
                  </div>
                  {showPatientDropdown && patientSearch.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Пациенты не найдены</div>
                      ) : (
                        filteredPatients.slice(0, 8).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            onClick={() => {
                              setSelectedPatient({ id: p.id, name: `${p.first_name} ${p.last_name}`, phone: p.phone });
                              setPatientSearch('');
                              setShowPatientDropdown(false);
                            }}
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {p.first_name[0]}{p.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{p.first_name} {p.last_name}</p>
                              {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

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
