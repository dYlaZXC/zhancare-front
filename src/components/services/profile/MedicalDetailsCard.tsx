"use client";

import { InfoCard } from "./InfoCard";
import { InfoRow } from "./InfoRow";
import { User } from "./types";

interface MedicalDetailsCardProps {
  user: User;
}

export const MedicalDetailsCard = ({ user }: MedicalDetailsCardProps) => {
  return (
    <InfoCard title="Медицинские данные">
      <div className="space-y-1">
        <InfoRow label="Группа крови" value={user.blood_type || "Не указана"} />
        <InfoRow label="Резус-фактор" value="Не указан" />
        <InfoRow label="Флюорография" value="Не указана" />
        <InfoRow label="Иммунизация" value="Не указано" />
      </div>
    </InfoCard>
  );
};
