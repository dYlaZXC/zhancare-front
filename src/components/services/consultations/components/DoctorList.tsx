"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center h-32"
          >
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 text-sm">Загружаем врачей...</p>
            </div>
          </motion.div>
        ) : filteredDoctors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-gray-50 rounded-xl"
          >
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
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 w-full max-w-full"
          >
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onDoctorSelect(doctor.id)}
              >
                {renderDoctorCard(
                  doctor,
                  recommendedDoctor?.id === doctor.id,
                  selectedDoctorId === doctor.id
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorList;