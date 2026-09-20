"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, DoorOpen, Plus, Search } from "lucide-react";

import type { ClinicRoom } from "./rooms/types/roomTypes";
import { RoomCard } from "./rooms/components/RoomCard";
import { RoomFormModal } from "./rooms/modals/RoomFormModal";
import { RoomAssignmentsModal, type DoctorScheduleTarget } from "./rooms/modals/RoomAssignmentsModal";
import StaffScheduleModal from "./StaffScheduleModal";

export function RoomsView({ user }: { user: any }) {
  const [rooms, setRooms] = useState<ClinicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClinicRoom | null>(null);
  const [assignmentsRoom, setAssignmentsRoom] = useState<ClinicRoom | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<DoctorScheduleTarget | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/clinic-rooms/");
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setRooms(list);
    } catch {
      toast.error("Не удалось загрузить кабинеты");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (r: ClinicRoom) => { setEditing(r); setShowModal(true); };

  const handleDelete = async (r: ClinicRoom) => {
    if (!confirm(`Деактивировать кабинет «${r.name}»?`)) return;
    try {
      await api.delete(`/clinic-rooms/${r.id}/`);
      setRooms(prev => prev.map(x => x.id === r.id ? { ...x, status: 'unavailable' } : x));
      toast.success("Кабинет деактивирован");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail;
      toast.error(msg || "Не удалось деактивировать кабинет");
    }
  };

  const searchLower = search.trim().toLowerCase();
  const filtered = rooms.filter(r => {
    if (!searchLower) return true;
    return r.name.toLowerCase().includes(searchLower) || (r.number ?? "").toLowerCase().includes(searchLower);
  });
  const totalActive = rooms.filter(r => r.status === 'active').length;
  const totalOther = rooms.length - totalActive;

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Кабинеты клиники
            </h1>
            <p className="text-gray-600">
              Управление кабинетами и расписанием врачей по кабинетам
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
          >
            <Plus className="w-5 h-5" />
            Добавить кабинет
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Всего кабинетов", value: rooms.length, color: "#f97316", bg: "#ffedd5" },
            { label: "Активных", value: totalActive, color: "#059669", bg: "#a7f3d0" },
            { label: "Недоступных / на обслуживании", value: totalOther, color: "#6b7280", bg: "#e5e7eb" },
          ].map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl p-4 border border-gray-100 shadow-sm" style={{ backgroundColor: stat.bg }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
                <DoorOpen className="w-8 h-8" style={{ color: stat.color }} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию или номеру кабинета..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Кабинеты не найдены</p>
            <p className="text-sm mt-1">Нажмите «Добавить кабинет» чтобы создать первый</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <RoomCard
                key={r.id}
                room={r}
                onEdit={openEdit}
                onAssignments={setAssignmentsRoom}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <RoomFormModal
            mode={editing ? "edit" : "create"}
            initial={editing}
            onClose={() => setShowModal(false)}
            onSaved={(saved) => {
              setRooms(prev => editing
                ? prev.map(r => r.id === saved.id ? saved : r)
                : [saved, ...prev]);
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {assignmentsRoom && (
        <RoomAssignmentsModal
          room={assignmentsRoom}
          onClose={() => setAssignmentsRoom(null)}
          onOpenDoctorSchedule={(doctor) => {
            setAssignmentsRoom(null);
            setScheduleTarget(doctor);
          }}
        />
      )}

      <StaffScheduleModal
        isOpen={!!scheduleTarget}
        member={scheduleTarget}
        onClose={() => setScheduleTarget(null)}
        onSaved={() => setScheduleTarget(null)}
        // Кабинеты are hidden entirely on the "Онлайн" tab (rooms only
        // ever apply to offline/mixed) — land on "Оффлайн" instead of the
        // default "Онлайн" so the room this admin came here to look at is
        // actually visible right away, not hidden behind a manual tab
        // switch. "Оффлайн" shows the exact same Кабинеты section
        // "Смешанное" would (the room data itself isn't type-specific),
        // so it doesn't matter which of the two non-online types this is.
        initialConsultationType="offline"
        // An override is anchored to one exact date — open the week that
        // actually contains it instead of always the current real week
        // (a weekly assignment has no single "right" date, so this stays
        // undefined for those and the modal defaults to today's week).
        initialDate={scheduleTarget?.date}
      />
    </div>
  );
}

export default RoomsView;
