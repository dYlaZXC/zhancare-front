"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faClipboardList,
  faHome,
  faEdit,
  faSave,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
import classNames from "classnames";
import { toast } from "react-toastify";

interface User {
  id: number;
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
  const printRef = useRef<HTMLDivElement>(null);

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
        toast.error("Ошибка загрузки данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveProfile = async () => {
    try {
      await api.patch("/user-profile/partial_update/", editValues);
      toast.success("Профиль успешно обновлен!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Ошибка при сохранении профиля");
      console.error(err);
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
    classNames("inline-block px-2 py-0.5 rounded-full text-xs font-medium", {
      "bg-green-100 text-green-700": status === "completed",
      "bg-red-100 text-red-600": status === "cancelled",
      "bg-blue-100 text-blue-600": status === "scheduled",
    });

  const consultationsToShow = showAllConsultations ? consultations : consultations.slice(0, 5);
  const appointmentsToShow = showAllAppointments ? appointments : appointments.slice(0, 5);

  return (
    <section
      ref={printRef}
      className="w-full px-4 sm:px-6 md:px-8 py-6 bg-white rounded-2xl shadow-md"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Карточка пациента</h2>
          <p className="text-xs text-gray-400 mt-1">Информация на {formatDate(new Date().toISOString())}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => (isEditing ? saveProfile() : setIsEditing(true))}
            className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow transition"
          >
            <FontAwesomeIcon icon={isEditing ? faSave : faEdit} />
            {isEditing ? "Сохранить" : "Редактировать"}
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-full shadow transition"
          >
            <FontAwesomeIcon icon={faFilePdf} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Загрузка данных...</div>
      ) : (
        <div className="flex flex-col gap-6">
          <InfoBlock
            title="Основная информация"
            icon={faUser}
            fields={[
              { label: "Имя", value: editValues.first_name, editable: isEditing, onChange: (val) => setEditValues({ ...editValues, first_name: val }) },
              { label: "Фамилия", value: editValues.last_name, editable: isEditing, onChange: (val) => setEditValues({ ...editValues, last_name: val }) },
              { label: "Электронная почта", value: editValues.email, editable: isEditing, onChange: (val) => setEditValues({ ...editValues, email: val }) },
            ]}
          />

          <TimelineBlock
            title="Последние консультации"
            icon={faClipboardList}
            items={consultationsToShow.map((c) => ({
              date: c.created_at,
              text: `${c.doctor_first_name} ${c.doctor_last_name} ${c.doctor_specialty ? `(${c.doctor_specialty})` : ""}`,
            }))}
            showAll={showAllConsultations}
            toggleShow={() => setShowAllConsultations(true)}
            total={consultations.length}
          />

          <TimelineBlock
            title="Последние домашние визиты"
            icon={faHome}
            items={appointmentsToShow.map((a) => ({
              date: a.appointment_time,
              text: `${a.doctor_name} — ${a.status}`,
              color: getStatusColor(a.status),
            }))}
            showAll={showAllAppointments}
            toggleShow={() => setShowAllAppointments(true)}
            total={appointments.length}
          />
        </div>
      )}
    </section>
  );
};

const InfoBlock = ({
  title,
  icon,
  fields,
}: {
  title: string;
  icon: any;
  fields: { label: string; value: string; editable: boolean; onChange: (val: string) => void }[];
}) => (
  <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl shadow-inner">
    <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-700 mb-3">
      <FontAwesomeIcon icon={icon} /> {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field, idx) => (
        <InfoField key={idx} {...field} />
      ))}
    </div>
  </div>
);

const InfoField = ({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (val: string) => void;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">{label}</label>
    {editable ? (
      <input
        className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 text-sm px-1 py-1 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
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
  <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl shadow-inner">
    <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-700 mb-3">
      <FontAwesomeIcon icon={icon} /> {title}
    </h3>
    <div className="relative border-l-2 border-blue-200 ml-3">
      {items.length === 0 ? (
        <p className="text-gray-400 text-xs italic mt-2 ml-4">Нет данных</p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="mb-4 ml-6">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 top-1" />
            <p className="text-xs text-gray-400">{new Intl.DateTimeFormat("ru-RU").format(new Date(item.date))}</p>
            <p className={classNames("text-sm font-medium mt-0.5", item.color)}>{item.text}</p>
          </div>
        ))
      )}
    </div>
  </div>
);

export default ProfileDetails;
