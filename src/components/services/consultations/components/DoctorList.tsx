"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import type { Doctor, RecommendedDoctor } from "../types/doctor";

interface DoctorListProps {
  doctors: Doctor[];
  filteredDoctors: Doctor[];
  loading: boolean;
  selectedDoctorId: number | null;
  recommendedDoctor?: RecommendedDoctor;
  onDoctorSelect: (doctorId: number) => void;
  renderDoctorCard: (doctor: Doctor, isRecommended: boolean, isSelected: boolean) => React.ReactNode;
  doctorsError?: string | null;
  websocketConnected?: boolean;
}

// Memoize the doctor list content separately to prevent re-renders
// DON'T check renderDoctorCard equality - it will ALWAYS change!
// Instead, just check the data that matters
const DoctorListContent = React.memo<{
  filteredDoctors: Doctor[];
  selectedDoctorId: number | null;
  recommendedDoctor?: RecommendedDoctor;
  renderDoctorCard: (doctor: Doctor, isRecommended: boolean, isSelected: boolean) => React.ReactNode;
}>(({ filteredDoctors, selectedDoctorId, recommendedDoctor, renderDoctorCard }) => {
  

  return (
    <div className="space-y-3 w-full max-w-full">
      {filteredDoctors.map((doctor) => (
        <div key={doctor.id}>
          {renderDoctorCard(
            doctor,
            recommendedDoctor?.id === doctor.id,
            selectedDoctorId === doctor.id
          )}
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // CRITICAL FIX: Don't compare renderDoctorCard - it will always be different!
  // Only compare the actual data that matters for rendering

  // Check if doctor IDs are the same and in the same order
  const doctorsIdsEqual =
    prevProps.filteredDoctors.length === nextProps.filteredDoctors.length &&
    prevProps.filteredDoctors.every((doc, idx) => doc.id === nextProps.filteredDoctors[idx]?.id);

  // Check if any doctor's availability status changed (for WebSocket updates)
  const doctorsStatusEqual = doctorsIdsEqual &&
    prevProps.filteredDoctors.every((doc, idx) =>
      doc.availability_status === nextProps.filteredDoctors[idx]?.availability_status
    );

  const propsEqual = (
    doctorsIdsEqual &&
    doctorsStatusEqual &&
    prevProps.selectedDoctorId === nextProps.selectedDoctorId &&
    prevProps.recommendedDoctor?.id === nextProps.recommendedDoctor?.id
  );

  return propsEqual;
});

DoctorListContent.displayName = 'DoctorListContent';

const DoctorList: React.FC<DoctorListProps> = ({
  doctors,
  filteredDoctors,
  loading,
  selectedDoctorId,
  recommendedDoctor,
  onDoctorSelect,
  renderDoctorCard,
  doctorsError,
  websocketConnected,
}) => {
  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 text-sm">Загружаем врачей...</p>
          </div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Users className="mx-auto text-gray-400 mb-3" size={32} />
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              {doctorsError || (doctors.length === 0
                ? "Нет доступных врачей"
                : "Врачи не найдены"
              )}
            </p>

            {doctorsError && websocketConnected && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-xs">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span>Ожидаем появления врачей в реальном времени</span>
              </div>
            )}

            {doctorsError && !websocketConnected && (
              <div className="flex items-center justify-center gap-2 text-orange-600 text-xs">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span>Подключение к серверу обновлений...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <DoctorListContent
          filteredDoctors={filteredDoctors}
          selectedDoctorId={selectedDoctorId}
          recommendedDoctor={recommendedDoctor}
          renderDoctorCard={renderDoctorCard}
        />
      )}
    </div>
  );
};

export default React.memo(DoctorList);