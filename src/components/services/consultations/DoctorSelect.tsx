"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Star, StarHalf, StarOff } from "lucide-react";
import Image from "next/image";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  rating?: number;
  avatarUrl?: string;
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
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmingDoctorId, setConfirmingDoctorId] = useState<number | null>(null);

  const selectedDoctor = doctors.find((doc) => doc.id === selectedDoctorId);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) =>
      `${doc.name} ${doc.doctor_type}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [doctors, searchTerm]);

  const doctorToConfirm = doctors.find((doc) => doc.id === confirmingDoctorId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setConfirmingDoctorId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderStars = (rating: number = 0) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center gap-[1px] text-yellow-500">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`full-${i}`} size={14} />
        ))}
        {hasHalf && <StarHalf size={14} />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <StarOff key={`empty-${i}`} size={14} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 animate-pulse">
        🔄 Загрузка доступных врачей...
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        ❗ Нет доступных врачей в данный момент.
      </div>
    );
  }

  return (
    <>
      {/* Selected doctor card */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Выбранный врач:
        </label>
        <button
          onClick={() => setShowModal(true)}
          className="w-full p-4 border border-blue-600 bg-blue-50 text-left rounded-xl transition hover:shadow-md"
        >
          <p className="text-gray-900 font-semibold">
            {selectedDoctor?.name || "Выберите врача"}
          </p>
          <p className="text-sm text-gray-600">
            {selectedDoctor?.doctor_type || ""}
          </p>
          {renderStars(selectedDoctor?.rating)}
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={() => {
              setShowModal(false);
              setConfirmingDoctorId(null);
            }}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-auto space-y-4 shadow-xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white pb-2 z-10">
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                  Выберите врача
                </h3>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск по имени или специализации"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {doctorToConfirm ? (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-800">Подтвердите выбор врача:</p>
                  <div className="p-4 border rounded-xl bg-blue-50 border-blue-600">
                    <p className="text-gray-900 font-semibold">{doctorToConfirm.name}</p>
                    <p className="text-sm text-gray-600">{doctorToConfirm.doctor_type}</p>
                    {renderStars(doctorToConfirm.rating)}
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <button
                      onClick={() => setConfirmingDoctorId(null)}
                      className="w-full py-2 text-sm rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => {
                        onChange(doctorToConfirm.id);
                        setConfirmingDoctorId(null);
                        setShowModal(false);
                      }}
                      className="w-full py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Подтвердить
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {filteredDoctors.length === 0 && (
                    <p className="text-sm text-gray-500">Совпадений не найдено.</p>
                  )}

                  <motion.div
                    key="list"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: { staggerChildren: 0.05 },
                      },
                    }}
                    className="space-y-2"
                  >
                    {filteredDoctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      const initials = doc.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                        
                      return (
                        <motion.button
                          key={doc.id}
                          onClick={() => setConfirmingDoctorId(doc.id)}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          className={clsx(
                            "w-full flex items-center gap-4 text-left p-4 rounded-xl border transition",
                            isSelected
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 bg-white hover:shadow"
                          )}
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden">
                            {doc.avatarUrl ? (
                              <Image
                                src={doc.avatarUrl}
                                alt={`Фотография доктора ${doc.name}`}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <p className="text-gray-900 font-semibold">{doc.name}</p>
                            <p className="text-sm text-gray-600">{doc.doctor_type}</p>
                            {renderStars(doc.rating)}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <motion.button
                    onClick={() => setShowModal(false)}
                    className="mt-2 w-full py-2 text-sm rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    whileTap={{ scale: 0.96 }}
                  >
                    Закрыть
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DoctorSelect;
