"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

interface AssignConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number;
  slot: any;
  date: string;
  onAssigned: () => void;
}

export default function AssignConsultationModal({
  isOpen,
  onClose,
  doctorId,
  slot,
  date,
  onAssigned
}: AssignConsultationModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/schedule/', {
        type: 'consultation',
        patient_id: selectedPatient,
        doctor_id: doctorId,
        date: date,
        time: slot.start_time,
        duration: 30,
        notes: notes
      });

      toast.success('Консультация успешно назначена!');
      onAssigned();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Не удалось назначить консультацию');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full"
      >
        <h3 className="text-xl font-bold mb-4" style={{ color: '#1e263e' }}>
          Назначить консультацию
        </h3>

        <div className="mb-4 p-4 bg-blue-50 rounded-2xl">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <Clock className="w-5 h-5" />
            {slot.start_time} - {slot.end_time}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Пациент <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Выберите пациента</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} {p.email && `(${p.email})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
              Примечания
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className="flex gap-3">
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
              {submitting ? 'Назначение...' : 'Назначить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
