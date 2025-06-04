"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useConsultationManager } from "./consultations/useConsultationManager";
import { ConsultationPopup } from "./consultations/ConsultationPopup";
import { ConsultationTable } from "./consultations/ConsultationTable";

const DoctorConsultations: React.FC = () => {
  const { token } = useAuth(); // can be removed if not used elsewhere
  const router = useRouter();

  const {
    consultations,
    newConsultation,
    setNewConsultation,
    dismissedIds,
    fetchConsultations,
    stopSound,
  } = useConsultationManager();

  const acceptConsultation = async (meeting_id: string) => {
    stopSound();
    try {
      const { data } = await api.post<{ meeting_id: string }>(`/consultations/${meeting_id}/accept/`, {});
      toast.success("Консультация принята");
      router.push(`/video-call?meetingId=${data.meeting_id}`);
    } catch {
      toast.error("Ошибка при принятии консультации");
    }
    setNewConsultation(null);
    fetchConsultations();
  };

  const rejectConsultation = async (meeting_id: string) => {
    stopSound();
    try {
      await api.post(`/consultations/${meeting_id}/reject/`, {});
      toast.info("Консультация отклонена");
    } catch {
      toast.error("Ошибка при отклонении консультации");
    }
    setNewConsultation(null);
    fetchConsultations();
  };

  const dismissPopup = () => {
    if (newConsultation) {
      dismissedIds.current.add(newConsultation.id);
    }
    stopSound();
    setNewConsultation(null);
  };

  return (
    <div className="p-6 bg-white shadow-xl rounded-2xl relative min-h-[400px]">
      <h2 className="text-2xl font-bold text-[#001E80]">Мои Консультации</h2>
      <p className="text-gray-600 mt-2">Следите за новыми запросами консультаций.</p>

      {newConsultation && (
        <ConsultationPopup
          consultation={newConsultation}
          onAccept={() => acceptConsultation(newConsultation.meeting_id)}
          onReject={() => rejectConsultation(newConsultation.meeting_id)}
          onDismiss={dismissPopup}
        />
      )}

      <ConsultationTable
        consultations={consultations}
        onAccept={acceptConsultation}
      />
    </div>
  );
};

export default DoctorConsultations;
