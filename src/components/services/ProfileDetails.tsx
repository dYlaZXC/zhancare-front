"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";

// Import all components
import { ProfileHeader } from "./profile/ProfileHeader";
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
import { useProfileData } from "./profile/useProfileData";

interface ProfileDetailsProps {
  user: User;
  onRefetch?: () => void;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user, onRefetch }) => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(user);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [selectedTab, setSelectedTab] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);

  // Use the profile data hook that's already configured for real API calls
  const { consultations, appointments, loading } = useProfileData();

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

  const handlePersonalDataSave = async (updatedData: Partial<User>) => {
    try {
      // Map frontend field names to Django API field names
      const apiData = {
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        phone: updatedData.phone,
        birth_date: updatedData.birth_date,
        gender: updatedData.gender,
        address: updatedData.address,
        city: updatedData.city,
        language: updatedData.language,
        citizenship: updatedData.citizenship,
        marital_status: updatedData.marital_status,
        profession: updatedData.profession,
      };

      // Use Django UserProfileViewSet endpoint for updating profile
      await api.patch('/user-profile/profile/', apiData);
      toast.success("Личные данные успешно обновлены!");

      // Update local user state if needed
      // You might want to trigger a refetch of user data here
    } catch (error: any) {
      console.error('Error updating personal data:', error);

      // Show more detailed error message
      if (error?.response?.status === 405) {
        toast.error("Метод не поддерживается. Перезапустите Django сервер после обновления кода.");
      } else if (error?.response?.status === 400) {
        toast.error("Ошибка валидации данных");
      } else if (error?.response?.data?.detail) {
        toast.error(`Ошибка: ${error.response.data.detail}`);
      } else {
        toast.error("Ошибка при обновлении данных");
      }
    }
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
            <ConsultationsTab />
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="visits" {...motionProps}>
            <VisitsTab />
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
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Mobile-first responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Patient Information */}
        <div className="space-y-4 sm:space-y-6 md:col-span-1 xl:col-span-1">
          <PersonalDetailsCard
            user={user}
            isEditable={true}
            onSave={handlePersonalDataSave}
            onRefetch={onRefetch}
            showCompletionProgress={true}
          />
          <MedicalDetailsCard user={user} onRefetch={onRefetch} />
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
          <CalendarCard />
          <QuickActionsCard />
        </div>
      </div>
    </section>
  );
};

export default ProfileDetails;
