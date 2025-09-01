"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";

// Import all components
import { ProfileHeader } from "./profile/ProfileHeader";
import { PatientCard } from "./profile/PatientCard";
import { PersonalDetailsCard } from "./profile/PersonalDetailsCard";
import { MedicalDetailsCard } from "./profile/MedicalDetailsCard";
import { InsuranceStatusCard } from "./profile/InsuranceStatusCard";
import { MarkersCard } from "./profile/MarkersCard";
import { TabNavigation } from "./profile/TabNavigation";
import { GeneralInfoTab } from "./profile/GeneralInfoTab";
import { ConsultationsTab } from "./profile/ConsultationsTab";
import { VisitsTab } from "./profile/VisitsTab";
import { CalendarCard } from "./profile/CalendarCard";
import { QuickActionsCard } from "./profile/QuickActionsCard";

// Import types
import { User, Consultation, Appointment } from "./profile/types";

interface ProfileDetailsProps {
  user: User;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user }) => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(user);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [selectedTab, setSelectedTab] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with actual data hooks
  const consultations: Consultation[] = [
    { id: 1, created_at: "2024-01-15", doctor_first_name: "Иван", doctor_last_name: "Петров", doctor_specialty: "Терапевт" },
    { id: 2, created_at: "2024-02-20", doctor_first_name: "Мария", doctor_last_name: "Сидорова", doctor_specialty: "Кардиолог" }
  ];

  const appointments: Appointment[] = [
    { id: 1, appointment_time: "2024-08-15", doctor_name: "Иван Петров", status: "completed" },
    { id: 2, appointment_time: "2024-08-20", doctor_name: "Мария Сидорова", status: "scheduled" }
  ];

  // Validation logic
  const validate = () => {
    const newErrors: typeof errors = {};
    if (!editValues.email.includes("@")) {
      newErrors.email = "Некорректный email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Event handlers
  const handleEditToggle = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      // Replace with actual API call
      toast.success("Профиль обновлён!");
      setIsEditing(false);
    } catch {
      toast.error("Ошибка сохранения профиля");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValues(user);
    setErrors({});
  };

  const handleDownloadPDF = async () => {
    // Replace with actual PDF generation
    toast.success("PDF загружен!");
  };

  const handleEditValueChange = (field: keyof User, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const renderTabContent = () => {
    const motionProps = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.25 }
    };

    switch (selectedTab) {
      case 0:
        return (
          <motion.div key="general" {...motionProps} className="space-y-4">
            <GeneralInfoTab
              user={user}
              isEditing={isEditing}
              editValues={editValues}
              errors={errors}
              onEditValueChange={handleEditValueChange}
              consultationsCount={consultations.length}
              appointmentsCount={appointments.length}
            />
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="consultations" {...motionProps}>
            <ConsultationsTab consultations={consultations} />
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="visits" {...motionProps}>
            <VisitsTab appointments={appointments} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      ref={printRef}
      className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 min-h-screen"
    >
      {/* Header Component */}
      <ProfileHeader
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
        onSave={handleSave}
        onCancel={handleCancel}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Mobile-first responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Patient Information */}
        <div className="space-y-4 sm:space-y-6 md:col-span-1 xl:col-span-1">
          <PatientCard user={user} />
          <PersonalDetailsCard user={user} />
          <MedicalDetailsCard user={user} />
          <InsuranceStatusCard />
        </div>

        {/* Middle Column - Main Content with Tabs */}
        <div className="space-y-4 sm:space-y-6 md:col-span-1 xl:col-span-1 md:order-last xl:order-none">
          <MarkersCard />

          {/* Tabbed Content Card */}
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm">
            <TabNavigation
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            />

            <div className="p-3 sm:p-4 md:p-6">
              <AnimatePresence mode="wait">
                {renderTabContent()}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column - Calendar and Quick Actions */}
        <div className="space-y-4 sm:space-y-6 md:col-span-2 xl:col-span-1 md:order-first xl:order-none">
          <CalendarCard appointments={appointments} />
          <QuickActionsCard />
        </div>
      </div>
    </section>
  );
};

export default ProfileDetails;
