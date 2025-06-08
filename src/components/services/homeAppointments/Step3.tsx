"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface Step3Props {
  doctors: Doctor[];
  selectedDoctorId: number | null;
  appointmentTime: string;
  address: string;
  symptoms: string;
  notes: string;
  onBack: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

const Step3: React.FC<Step3Props> = ({
  doctors,
  selectedDoctorId,
  appointmentTime,
  address,
  symptoms,
  notes,
  onBack,
  onSubmit,
  loading = false,
}) => {
  const doctor = doctors.find((doc) => doc.id === selectedDoctorId);

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800">Подтвердите данные</h3>

      <div className="space-y-2 text-sm text-gray-700 bg-gray-50 rounded-xl p-4 ring-1 ring-gray-200">
        <p><strong>Врач:</strong> {doctor?.name || "Не выбран"}</p>
        <p><strong>Email:</strong> {doctor?.email || "—"}</p>
        <p><strong>Адрес:</strong> {address}</p>
        <p><strong>Дата и время:</strong> {new Date(appointmentTime).toLocaleString()}</p>
        {symptoms && <p><strong>Симптомы:</strong> {symptoms}</p>}
        {notes && <p><strong>Доп. заметки:</strong> {notes}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
        >
          Назад
        </button>

        <button
          onClick={onSubmit}
          disabled={loading || !selectedDoctorId || !appointmentTime || !address}
          className={`px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center ${
            loading || !selectedDoctorId || !appointmentTime || !address
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Отправка...
            </>
          ) : (
            "Подтвердить и отправить"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Step3;
