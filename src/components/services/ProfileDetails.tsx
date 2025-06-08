"use client";

import { useState, useRef } from "react";
import { Tab } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import classNames from "classnames";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ProfileHeader from "./profile/ProfileHeader";
import EditableInfoForm from "./profile/EditableInfoForm";
import ConsultationChart from "./profile/ConsultationChart";
import TimelineBlockWrapper from "./profile/TimelineBlockWrapper";
import { useProfileData } from "./profile/useProfileData";
import type { User } from "./profile/types";

import {
  faUser,
  faClipboardList,
  faHome,
} from "@fortawesome/free-solid-svg-icons";

interface ProfileDetailsProps {
  user: User;
}

const tabData = [
  { name: "Общая информация", icon: faUser },
  { name: "История", icon: faClipboardList },
  { name: "Визиты", icon: faHome },
] as const;

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user }) => {
  const { consultations, appointments, consultationTrendData, loading } = useProfileData();

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(user);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [showAllConsultations, setShowAllConsultations] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!editValues.email.includes("@")) {
      newErrors.email = "Некорректный email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfile = async () => {
    if (!validate()) return;
    try {
      await fetch("/api/user-profile/partial_update/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      toast.success("✅ Профиль обновлён!");
      setIsEditing(false);
    } catch {
      toast.error("Ошибка сохранения профиля");
    }
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf()
      .set({
        filename: "profile-details.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(printRef.current)
      .save();
  };

  const getStatusColor = (status: string) =>
    classNames("inline-block px-2 py-0.5 rounded-full text-xs font-medium", {
      "bg-green-100 text-green-700": status === "completed",
      "bg-red-100 text-red-600": status === "cancelled",
      "bg-blue-100 text-blue-600": status === "scheduled",
    });

  const stats = [
    { label: "Всего консультаций", value: consultations.length },
    { label: "Домашних визитов", value: appointments.length },
  ];

  const motionProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.25 },
  };

  return (
    <section
      ref={printRef}
      className="w-full px-4 sm:px-6 md:px-8 py-6 bg-white rounded-2xl shadow-md print:pt-2 print:pb-2"
    >
      <ProfileHeader
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(true)}
        onSave={saveProfile}
        onDownloadPDF={downloadPDF}
        stats={stats}
      />

      {loading ? (
        <div className="text-center text-gray-400">Загрузка...</div>
      ) : (
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex flex-wrap gap-2 mb-6">
            {tabData.map(({ name, icon }) => (
              <Tab
                key={name}
                className={({ selected }) =>
                  classNames(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full shadow-sm transition-all",
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  )
                }
              >
                <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                <span>{name}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels as={AnimatePresence} mode="wait">
            {tabData.map(({ name }, index) => (
              <Tab.Panel key={name} as={motion.div} {...motionProps} className="space-y-6">
                {index === 0 && (
                  <>
                    <EditableInfoForm
                      first_name={editValues.first_name}
                      last_name={editValues.last_name}
                      email={editValues.email}
                      isEditing={isEditing}
                      onChange={(field, value) =>
                        setEditValues((prev) => ({ ...prev, [field]: value }))
                      }
                      error={errors}
                    />
                    <ConsultationChart data={consultationTrendData} />
                  </>
                )}
                {index === 1 && (
                  <TimelineBlockWrapper
                    title="Последние консультации"
                    icon={faClipboardList}
                    items={consultations.map((c) => ({
                      date: c.created_at,
                      text: `${c.doctor_first_name} ${c.doctor_last_name}${c.doctor_specialty ? ` (${c.doctor_specialty})` : ""}`,
                    }))}
                    showAll={showAllConsultations}
                    toggleShow={() => setShowAllConsultations((prev) => !prev)}
                    total={consultations.length}
                  />
                )}
                {index === 2 && (
                  <TimelineBlockWrapper
                    title="Домашние визиты"
                    icon={faHome}
                    items={appointments.map((a) => ({
                      date: a.appointment_time,
                      text: `${a.doctor_name} — ${a.status}`,
                      color: getStatusColor(a.status),
                    }))}
                    showAll={showAllAppointments}
                    toggleShow={() => setShowAllAppointments((prev) => !prev)}
                    total={appointments.length}
                  />
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      )}
    </section>
  );
};

export default ProfileDetails;
