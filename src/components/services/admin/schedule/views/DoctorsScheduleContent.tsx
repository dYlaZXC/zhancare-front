"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Search,
  Loader2,
  Stethoscope
} from "lucide-react";
import { ScheduleEvent } from '../types/scheduleTypes';
import AssignConsultationModal from '../modals/AssignConsultationModal';
import { DoctorScheduleCard } from '../components/DoctorScheduleCard';

interface DoctorsScheduleContentProps {
  selectedDate: string;
  events: ScheduleEvent[];
  fetchSchedule: () => void;
}

export function DoctorsScheduleContent({
  selectedDate,
  events,
  fetchSchedule
}: DoctorsScheduleContentProps) {
  const [doctors, setDoctors] = useState<Array<{
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    years_of_experience?: number;
    preferred_consultation_duration?: number;
    room_number?: string | null;
    online_work_schedule?: any;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [doctorSlots, setDoctorSlots] = useState<Map<number, any[]>>(new Map());

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await api.get('/staff/');
        const doctorsList = response.data.filter((s: any) => s.role === 'doctor');
        setDoctors(doctorsList);
      } catch (err) {
        console.error("Failed to load doctors:", err);
        toast.error("Не удалось загрузить список врачей");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch available slots for all doctors when date changes
  useEffect(() => {
    if (doctors.length === 0 || !selectedDate) return;

    const fetchAllDoctorSlots = async () => {
      setLoadingSlots(true);
      const slotsMap = new Map<number, any[]>();

      try {
        await Promise.all(
          doctors.map(async (doctor) => {
            try {
              const response = await api.get('/consultations/available-slots/', {
                params: {
                  doctor_id: doctor.id,
                  date: selectedDate,
                  duration: doctor.preferred_consultation_duration || 30
                }
              });
              slotsMap.set(doctor.id, response.data.available_slots || []);
            } catch (err) {
              console.error(`Failed to fetch slots for doctor ${doctor.id}:`, err);
              slotsMap.set(doctor.id, []);
            }
          })
        );

        setDoctorSlots(slotsMap);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAllDoctorSlots();
  }, [doctors, selectedDate]);

  const handleSlotClick = (doctorId: number, slot: any) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot(slot);
    setShowAssignModal(true);
  };

  const filteredDoctors = doctors.filter(doctor => {
    const fullName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
    const specialization = doctor.specialization?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || specialization.includes(query);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск врача..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-1.5 md:py-2 text-sm md:text-base rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-16 h-16 animate-spin mb-4 text-blue-600" />
            <span className="text-lg font-medium text-gray-600">Загрузка врачей...</span>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">
              {searchQuery ? 'Врачи не найдены' : 'Нет врачей'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredDoctors.map((doctor) => {
              const slots = doctorSlots.get(doctor.id) || [];
              const bookedSlots = events.filter(
                e => e.doctor_id === doctor.id && e.date === selectedDate
              );

              return (
                <DoctorScheduleCard
                  key={doctor.id}
                  doctor={doctor}
                  slots={slots}
                  bookedSlots={bookedSlots}
                  loadingSlots={loadingSlots}
                  selectedDate={selectedDate}
                  onSlotClick={handleSlotClick}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedDoctor && selectedSlot && (
        <AssignConsultationModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDoctor(null);
            setSelectedSlot(null);
          }}
          doctorId={selectedDoctor}
          slot={selectedSlot}
          date={selectedDate}
          onAssigned={() => {
            setShowAssignModal(false);
            fetchSchedule();
          }}
        />
      )}
    </div>
  );
}
