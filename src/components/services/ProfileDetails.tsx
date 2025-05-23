// ProfileDetails Full Width with Responsive Layout

"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faClipboardList,
  faHome,
  faEdit,
  faSave,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
import classNames from "classnames";

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
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(user);
  const [showAllConsultations, setShowAllConsultations] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consultationRes, appointmentRes] = await Promise.all([
          api.get("/consultations/"),
          api.get("/appointments/my-appointments/"),
        ]);

        setConsultations(consultationRes.data);
        setAppointments(
          appointmentRes.data.map((a: any) => ({
            id: a.id,
            doctor_name: `${a.doctor_first_name || ""} ${a.doctor_last_name || ""}`.trim() || "Не назначен",
            appointment_time: a.appointment_time,
            status: a.status,
          }))
        );
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveProfile = async () => {
    try {
      await api.patch("/users/me/", editValues);
      setIsEditing(false);
    } catch (err) {
      console.error("Ошибка сохранения профиля:", err);
    }
  };

  const downloadPDF = async () => {
    setShowAllConsultations(true);
    setShowAllAppointments(true);
    setTimeout(async () => {
      if (!printRef.current) return;
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          filename: "profile-details.pdf",
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(printRef.current)
        .save()
        .then(() => {
          setShowAllConsultations(false);
          setShowAllAppointments(false);
        });
    }, 100);
  };

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(dateStr));

  const getStatusColor = (status: string) =>
    classNames("inline-block px-2 py-0.5 text-xs rounded font-medium", {
      "bg-green-100 text-green-700": status === "completed",
      "bg-red-100 text-red-600": status === "cancelled",
      "bg-blue-100 text-blue-600": status === "scheduled",
    });

  const limitedConsultations = showAllConsultations ? consultations : consultations.slice(0, 5);
  const limitedAppointments = showAllAppointments ? appointments : appointments.slice(0, 5);

  return (
    <section
      ref={printRef}
      className="w-full px-6 sm:px-10 md:px-16 py-10 bg-white min-h-screen"
    >
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-800">Карточка пациента</h2>
          <p className="text-sm text-gray-500">Информация на {formatDate(new Date().toISOString())}</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button
            onClick={() => (isEditing ? saveProfile() : setIsEditing(true))}
            className="px-4 py-2 text-sm font-semibold text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-700 rounded-lg transition"
          >
            <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="mr-2" />
            {isEditing ? "Сохранить" : "Редактировать"}
          </button>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 text-sm font-semibold text-red-700 hover:text-white border border-red-700 hover:bg-red-700 rounded-lg transition"
          >
            <FontAwesomeIcon icon={faFilePdf} className="mr-2" /> Скачать PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <div className="bg-white shadow border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} /> Основная информация
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoField
              label="ФИО"
              value={`${editValues.first_name} ${editValues.last_name}`}
              editable={isEditing}
              onChange={(val) => {
                const [first, last] = val.split(" ");
                setEditValues({ ...editValues, first_name: first || "", last_name: last || "" });
              }}
            />
            <InfoField
              label="Электронная почта"
              value={editValues.email}
              editable={isEditing}
              onChange={(val) => setEditValues({ ...editValues, email: val })}
            />
          </div>
        </div>

        <TimelineBlock
          title="Последние консультации"
          icon={faClipboardList}
          items={limitedConsultations.map((c) => ({
            date: c.created_at,
            text: `${c.doctor_first_name} ${c.doctor_last_name} ${c.doctor_specialty ? `(${c.doctor_specialty})` : ""}`,
          }))}
          showAll={showAllConsultations}
          toggleShow={() => setShowAllConsultations(true)}
          total={consultations.length}
        />

        <TimelineBlock
          title="Домашние визиты"
          icon={faHome}
          items={limitedAppointments.map((a) => ({
            date: a.appointment_time,
            text: `${a.doctor_name} — ${a.status}`,
            color: getStatusColor(a.status),
          }))}
          showAll={showAllAppointments}
          toggleShow={() => setShowAllAppointments(true)}
          total={appointments.length}
        />
      </div>
    </section>
  );
};

const InfoField = ({ label, value, editable, onChange }: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (val: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    {editable ? (
      <input
        className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 transition px-1 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <p className="text-base font-medium text-gray-800">{value}</p>
    )}
  </div>
);

const TimelineBlock = ({
  title,
  icon,
  items,
  showAll,
  toggleShow,
  total,
}: {
  title: string;
  icon: any;
  items: { date: string; text: string; color?: string }[];
  showAll: boolean;
  toggleShow: () => void;
  total: number;
}) => (
  <div className="bg-white shadow border border-gray-200 rounded-2xl p-6">
    <h3 className="text-xl font-semibold text-slate-700 mb-6 flex items-center gap-2">
      <FontAwesomeIcon icon={icon} /> {title}
    </h3>
    <div className="relative border-l-2 border-blue-200 ml-3">
      {items.map((item, i) => (
        <div key={i} className="mb-6 ml-6">
          <div className="absolute w-3 h-3 bg-gradient-to-br from-blue-600 to-blue-300 rounded-full -left-1.5 top-1" />
          <p className="text-sm text-gray-500">{new Intl.DateTimeFormat("ru-RU").format(new Date(item.date))}</p>
          <p className={classNames("text-base mt-1", item.color)}>{item.text}</p>
        </div>
      ))}
    </div>
    {!showAll && total > 5 && (
      <button
        onClick={toggleShow}
        className="mt-4 text-blue-600 text-sm underline hover:text-blue-800 transition print:hidden"
      >
        Показать все
      </button>
    )}
  </div>
);

export default ProfileDetails;
