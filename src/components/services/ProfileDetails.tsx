"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { LayoutDashboard, TrendingUp, Clock, Settings, Video, Home } from "lucide-react";

// Import all components
import { ProfileHeader } from "./profile/ProfileHeader";
import { PersonalDetailsCard } from "./profile/PersonalDetailsCard";
import { MedicalDetailsCard } from "./profile/MedicalDetailsCard";
import { GeneralInfoTab } from "./profile/GeneralInfoTab";
import { InsuranceStatusCard } from "./profile/InsuranceStatusCard";
import { ConsultationsTab } from "./profile/ConsultationsTab";
import { VisitsTab } from "./profile/VisitsTab";
import { CalendarCard } from "./profile/CalendarCard";
import { QuickActionsCard } from "./profile/QuickActionsCard";

// Import types
import { User } from "./profile/types";
import { useProfileData } from "./profile/useProfileData";

interface ProfileDetailsProps {
  user: User;
  onRefetch?: () => void;
}

const tabs = [
  { id: "overview",  label: "Обзор",       icon: LayoutDashboard },
  { id: "activity",  label: "Активность",   icon: TrendingUp      },
  { id: "history",   label: "История",      icon: Clock           },
  { id: "settings",  label: "Настройки",    icon: Settings        },
] as const;

type TabId = (typeof tabs)[number]["id"];

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user, onRefetch }) => {
  const [activeTab, setActiveTab]           = useState<TabId>("overview");
  const [historySubTab, setHistorySubTab]   = useState<0 | 1>(0);
  const [isEditing, setIsEditing]           = useState(false);
  const [editValues, setEditValues]         = useState(user);
  const [errors, setErrors]                 = useState<{ email?: string }>({});

  const printRef = useRef<HTMLDivElement>(null);
  const { consultations, appointments, loading } = useProfileData();

  // ── Handlers ──────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    toast.success("PDF загружен!");
  };

  const handleEditValueChange = (field: keyof User, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonalDataSave = async (updatedData: Partial<User>) => {
    try {
      const apiData = {
        first_name:     updatedData.first_name,
        last_name:      updatedData.last_name,
        phone:          updatedData.phone,
        birth_date:     updatedData.birth_date,
        gender:         updatedData.gender,
        address:        updatedData.address,
        city:           updatedData.city,
        language:       updatedData.language,
        citizenship:    updatedData.citizenship,
        marital_status: updatedData.marital_status,
        profession:     updatedData.profession,
      };
      await api.patch("/user-profile/profile/", apiData);
      toast.success("Личные данные успешно обновлены!");
    } catch (error: any) {
      console.error("Error updating personal data:", error);
      if (error?.response?.status === 405) {
        toast.error("Метод не поддерживается. Перезапустите Django сервер.");
      } else if (error?.response?.status === 400) {
        toast.error("Ошибка валидации данных");
      } else if (error?.response?.data?.detail) {
        toast.error(`Ошибка: ${error.response.data.detail}`);
      } else {
        toast.error("Ошибка при обновлении данных");
      }
    }
  };

  // ── Derived values ────────────────────────────────────────────
  const yearsInSystem = user.date_joined
    ? Math.max(0, Math.floor(
        (Date.now() - new Date(user.date_joined).getTime()) / (1000 * 60 * 60 * 24 * 365)
      ))
    : 0;

  const rating = loading ? "—"
    : consultations.length + appointments.length >= 20 ? "A+"
    : consultations.length + appointments.length >= 10 ? "A"
    : consultations.length + appointments.length >= 5  ? "B+"
    : "B";

  // ── Tab content ───────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── 1. Overview ────────────────────────────────────────────
      case "overview":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            {/* Left column: calendar */}
            <CalendarCard />

            {/* Right column: stats + actions */}
            <div className="space-y-4">
              {/* Key stats */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 pt-6 pb-4 text-center border-b border-gray-100">
                  <p className="text-6xl font-extrabold text-blue-600 tabular-nums leading-none">
                    {loading ? "—" : consultations.length}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Онлайн консультаций</p>
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="py-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{loading ? "—" : appointments.length}</p>
                    <p className="text-xs text-gray-400">Визитов</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{rating}</p>
                    <p className="text-xs text-gray-400">Рейтинг</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{yearsInSystem}</p>
                    <p className="text-xs text-gray-400">Лет в системе</p>
                  </div>
                </div>
              </div>

              <QuickActionsCard />
            </div>
          </div>
        );

      // ── 2. Activity ────────────────────────────────────────────
      case "activity":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <GeneralInfoTab
              user={user}
              isEditing={false}
              editValues={editValues}
              errors={errors}
              onEditValueChange={handleEditValueChange}
              consultationsCount={consultations.length}
              appointmentsCount={appointments.length}
            />

            <div className="space-y-4">
              {/* Recent consultations */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Последние консультации</h3>
                    <p className="text-xs text-gray-400">Онлайн-обращения</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {loading ? (
                    <div className="p-5 space-y-3 animate-pulse">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
                    </div>
                  ) : consultations.length === 0 ? (
                    <p className="py-10 text-center text-gray-400 text-sm">Консультаций пока нет</p>
                  ) : (
                    consultations.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                          {c.doctor_first_name?.[0]}{c.doctor_last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {c.doctor_first_name} {c.doctor_last_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{c.doctor_specialty || "Специальность не указана"}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(c.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent home visits */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Визиты на дом</h3>
                    <p className="text-xs text-gray-400">Недавние вызовы врача</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {loading ? (
                    <div className="p-5 space-y-3 animate-pulse">
                      {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
                    </div>
                  ) : appointments.length === 0 ? (
                    <p className="py-10 text-center text-gray-400 text-sm">Визитов пока нет</p>
                  ) : (
                    appointments.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          a.status === "completed" ? "bg-green-500" :
                          a.status === "pending"   ? "bg-yellow-500" :
                          a.status === "cancelled" ? "bg-red-500" : "bg-gray-400"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.doctor_name || "Врач не указан"}</p>
                          <p className="text-xs text-gray-400">
                            {a.appointment_time
                              ? new Date(a.appointment_time).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
                              : "Дата не указана"}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          a.status === "completed" ? "bg-green-50 text-green-700" :
                          a.status === "pending"   ? "bg-yellow-50 text-yellow-700" :
                          a.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"
                        }`}>
                          {a.status === "completed" ? "Завершён" :
                           a.status === "pending"   ? "Ожидание" :
                           a.status === "cancelled" ? "Отменён"  : a.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      // ── 3. History ─────────────────────────────────────────────
      case "history":
        return (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {(["Онлайн консультации", "Визиты на дом"] as const).map((label, i) => (
                <button
                  key={i}
                  onClick={() => setHistorySubTab(i as 0 | 1)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    historySubTab === i
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {historySubTab === 0 ? (
                <motion.div
                  key="consultations"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ConsultationsTab />
                </motion.div>
              ) : (
                <motion.div
                  key="visits"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <VisitsTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      // ── 4. Settings ────────────────────────────────────────────
      case "settings":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            <PersonalDetailsCard
              user={user}
              isEditable={true}
              onSave={handlePersonalDataSave}
              onRefetch={onRefetch}
              showCompletionProgress={true}
            />
            <div className="space-y-4">
              <MedicalDetailsCard user={user} onRefetch={onRefetch} />
              <InsuranceStatusCard />
            </div>
          </div>
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
      <ProfileHeader onDownloadPDF={handleDownloadPDF} />

      {/* Top-level tab navigation */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <nav className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors flex-1 sm:flex-none justify-center sm:justify-start ${
                activeTab === id
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default ProfileDetails;
