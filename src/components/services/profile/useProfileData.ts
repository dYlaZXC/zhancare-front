"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

export interface Consultation {
  id: number;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty?: string;
  created_at: string;
}

export interface HomeAppointment {
  id: number;
  doctor_name: string;
  appointment_time: string;
  status: string;
}

interface ChartDataPoint {
  date: string;
  count: number;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<HomeAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use role-based endpoints
        const consultationEndpoint = user?.role === 'patient' 
          ? '/consultations/my-consultations/'
          : '/consultations/';

        const [consultationRes, appointmentRes] = await Promise.all([
          api.get(consultationEndpoint),
          api.get("/appointments/my-appointments/"),
        ]);

        setConsultations(consultationRes.data);

        setAppointments(
          appointmentRes.data.map((a: any) => ({
            id: a.id,
            doctor_name: `${a.doctor_first_name || ""} ${a.doctor_last_name || ""}`.trim(),
            appointment_time: a.appointment_time,
            status: a.status,
          }))
        );
      } catch {
        toast.error("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  const consultationTrendData: ChartDataPoint[] = Object.values(
    consultations.reduce((acc, cur) => {
      const date = new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(cur.created_at));
      acc[date] = acc[date] || { date, count: 0 };
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; count: number }>)
  ).sort((a, b) => a.date.localeCompare(b.date));

  return {
    consultations,
    appointments,
    consultationTrendData,
    loading,
  };
};
