import React from "react";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
}

interface DoctorSelectProps {
  doctors: Doctor[];
  selectedDoctorId: number | null;
  onChange: (id: number) => void;
  loading: boolean;
}

const DoctorSelect: React.FC<DoctorSelectProps> = ({
  doctors,
  selectedDoctorId,
  onChange,
  loading,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Доступные врачи:
      </label>
      {loading ? (
        <div className="animate-pulse text-gray-400 text-sm">Загрузка врачей...</div>
      ) : doctors.length > 0 ? (
        <select
          className="w-full border-b-2 border-gray-300 bg-transparent text-gray-800 py-2 focus:outline-none focus:border-blue-500 transition rounded-none"
          value={selectedDoctorId || ""}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <option value="">-- Выберите врача --</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} ({doc.doctor_type})
            </option>
          ))}
        </select>
      ) : (
        <div className="text-gray-400 text-sm">Нет доступных врачей.</div>
      )}
    </div>
  );
};

export default DoctorSelect;
