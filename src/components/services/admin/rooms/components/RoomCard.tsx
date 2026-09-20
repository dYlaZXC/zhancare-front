"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, Users2, Layers, Stethoscope, DoorOpen, CalendarClock } from "lucide-react";
import type { ClinicRoom } from "../types/roomTypes";
import { roomTypeLabel, roomStatusLabel, roomStatusColor } from "../types/roomTypes";

export function RoomCard({
  room,
  onEdit,
  onAssignments,
  onDelete,
}: {
  room: ClinicRoom;
  onEdit: (room: ClinicRoom) => void;
  onAssignments: (room: ClinicRoom) => void;
  onDelete: (room: ClinicRoom) => void;
}) {
  const statusColor = roomStatusColor(room.status);
  const isActive = room.status === "active";

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl p-6 border-2 border-gray-100 hover:border-orange-200 transition-all bg-white shadow-sm hover:shadow-md ${!isActive ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f97316cc, #f97316)" }}>
            <DoorOpen className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-gray-800">{room.name}</h3>
              {room.number && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gray-500">
                  № {room.number}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "#f97316" }}>
                {roomTypeLabel(room.room_type)}
              </span>
            </div>

            {room.specialization_name && (
              <p className="text-sm font-medium text-indigo-600 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                {room.specialization_name}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
              {room.floor && (
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4" /> Этаж {room.floor}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users2 className="w-4 h-4" /> {room.capacity} {room.capacity === 1 ? "врач" : "врача"} одновременно
              </span>
              {room.description && (
                <span className="hidden md:block italic truncate max-w-[220px] text-gray-400">{room.description}</span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ color: statusColor, background: `${statusColor}14`, borderColor: `${statusColor}33` }}>
                {isActive ? "✓ " : ""}{roomStatusLabel(room.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAssignments(room)}
            className="p-2.5 rounded-lg hover:bg-white transition-all group"
            title="Врачи и расписание"
          >
            <CalendarClock className="w-5 h-5 text-gray-500 group-hover:text-orange-600 transition-colors" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(room)}
            className="p-2.5 rounded-lg hover:bg-white transition-all group"
            title="Редактировать"
          >
            <Pencil className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(room)}
            className="p-2.5 rounded-lg hover:bg-white transition-all group"
            title="Деактивировать"
          >
            <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
