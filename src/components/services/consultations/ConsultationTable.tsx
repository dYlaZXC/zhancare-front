import type { Consultation } from "@/types/consultation";
import { ConsultationRow } from "./ConsultationRow";

interface ConsultationTableProps {
  consultations: Consultation[];
  onAccept: (meetingId: string) => void;
}

export const ConsultationTable: React.FC<ConsultationTableProps> = ({
  consultations,
  onAccept,
}) => {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-2xl font-semibold">🛌 Нет консультаций</div>
        <p className="mt-2 text-sm text-gray-500">
          Все консультации обработаны или пока не запланированы.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: Consultation["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "missed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-200 text-gray-600";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="mt-6">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl shadow-md">
        <table className="w-full text-sm text-left text-gray-800 bg-white min-w-[600px] border border-gray-200">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3">Пациент</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Статус</th>
              <th className="px-5 py-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {consultations.map((consultation) => (
              <ConsultationRow
                key={consultation.id}
                consultation={consultation}
                onAccept={() => onAccept(consultation.meeting_id ?? '')}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
          >
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Пациент: </span>
              {consultation.patient_name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-semibold text-gray-800">Email: </span>
              {consultation.patient_email || (
                <span className="italic text-gray-400">не указан</span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-semibold text-gray-800">Статус: </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  consultation.status
                )}`}
              >
                {consultation.status}
              </span>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onAccept(consultation.meeting_id ?? '')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition"
              >
                Принять
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
