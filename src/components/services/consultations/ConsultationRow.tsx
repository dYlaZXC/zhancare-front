import type { Consultation } from "@/types/consultation";

const statusTranslations: Record<Consultation["status"], string> = {
  pending: "⏳ В ожидании",
  ongoing: "🟢 В процессе",
  completed: "✅ Завершено",
  cancelled: "❌ Отменено",
  missed: "🔕 Пропущено",
  scheduled: "📅 Запланировано",
  planned: "📋 Запланированна",
};


interface Props {
  consultation: Consultation;
  onAccept: () => void;
}

export const ConsultationRow: React.FC<Props> = ({ consultation, onAccept }) => (
  <tr key={consultation.id} className="hover:bg-gray-50 transition">
    <td className="border p-3 font-medium">{consultation.patient_name}</td>
    <td className="border p-3 break-all text-gray-700">{consultation.patient_email || "—"}</td>
    <td className="border p-3">
      <span className="bg-gray-200 px-3 py-1 rounded-full text-xs font-medium">
        {statusTranslations[consultation.status]}
      </span>
    </td>
    <td className="border p-3">
      {consultation.status === "pending" && (
        <button
          onClick={onAccept}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md"
        >
          Принять
        </button>
      )}
    </td>
  </tr>
);
