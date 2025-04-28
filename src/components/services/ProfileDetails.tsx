"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faClipboardList, faHome } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";

interface User {
  first_name: string;
  last_name: string;
  email: string;
}

interface Consultation {
  id: number;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty?: string;
  created_at: string;
}

interface HomeAppointment {
  id: number;
  doctor_name: string;
  appointment_time: string;
  status: string;
}

interface ProfileDetailsProps {
  user: User;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<HomeAppointment[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState<boolean>(true);
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const { data } = await api.get("/consultations/");
        const mapped = data.map((consultation: any) => ({
          id: consultation.id,
          doctor_first_name: consultation.doctor_first_name || "Неизвестно",
          doctor_last_name: consultation.doctor_last_name || "",
          doctor_specialty: consultation.doctor_specialty || null,
          created_at: consultation.created_at,
        }));
        setConsultations(mapped);
      } catch (error) {
        console.error("Ошибка загрузки консультаций:", error);
      } finally {
        setLoadingConsultations(false);
      }
    };

    const fetchHomeAppointments = async () => {
      try {
        const { data } = await api.get("/appointments/my-appointments/");
        const mapped = data.map((appointment: any) => ({
          id: appointment.id,
          doctor_name: appointment.doctor_first_name && appointment.doctor_last_name
            ? `${appointment.doctor_first_name} ${appointment.doctor_last_name}`
            : "Не назначен",
          appointment_time: appointment.appointment_time,
          status: appointment.status,
        }));
        setAppointments(mapped);
      } catch (error) {
        console.error("Ошибка загрузки домашних визитов:", error);
      } finally {
        setLoadingAppointments(false);
      }
    };
    

    fetchConsultations();
    fetchHomeAppointments();
  }, []);

  return (
    <section className="max-w-4xl mx-auto p-6 sm:p-10 bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#001E80]">Карточка пациента</h2>
        <p className="text-gray-500 mt-2">Информация о вашем профиле</p>
      </div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {/* Name */}
        <div className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition">
          <FontAwesomeIcon icon={faUser} className="text-[#001E80] text-xl" />
          <div>
            <p className="text-sm text-gray-500">ФИО</p>
            <p className="font-semibold text-gray-800">
              {user.first_name} {user.last_name}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition">
          <FontAwesomeIcon icon={faEnvelope} className="text-[#001E80] text-xl" />
          <div>
            <p className="text-sm text-gray-500">Электронная почта</p>
            <p className="font-semibold text-gray-800">{user.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Consultations */}
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-[#001E80] flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faClipboardList} />
          Последние консультации
        </h3>

        {loadingConsultations ? (
          <p className="text-gray-400">Загрузка консультаций...</p>
        ) : consultations.length > 0 ? (
          <ul className="space-y-3 text-gray-700 text-sm">
            {consultations.map((consultation) => (
              <li key={consultation.id} className="flex items-center gap-2">
                📅{" "}
                <span>
                  {new Date(consultation.created_at).toLocaleDateString()} —{" "}
                  <strong>
                    {consultation.doctor_first_name} {consultation.doctor_last_name}
                  </strong>
                  {consultation.doctor_specialty ? ` (${consultation.doctor_specialty})` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Нет консультаций</p>
        )}
      </div>

      {/* Home Appointments */}
      <div className="mt-16">
        <h3 className="text-2xl font-semibold text-[#001E80] flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faHome} />
          Домашние визиты
        </h3>

        {loadingAppointments ? (
          <p className="text-gray-400">Загрузка домашних визитов...</p>
        ) : appointments.length > 0 ? (
          <ul className="space-y-3 text-gray-700 text-sm">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex items-center gap-2">
                🏡{" "}
                <span>
                  {new Date(appointment.appointment_time).toLocaleDateString()} —{" "}
                  <strong>{appointment.doctor_name}</strong> —{" "}
                  <span
                    className={
                      appointment.status === "completed"
                        ? "text-green-600"
                        : appointment.status === "cancelled"
                        ? "text-red-500"
                        : "text-blue-500"
                    }
                  >
                    {appointment.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Нет домашних визитов</p>
        )}
      </div>
    </section>
  );
};

export default ProfileDetails;
