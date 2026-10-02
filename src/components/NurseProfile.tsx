"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { NurseSidebar } from "@/components/layout/NurseSidebar";
import { NurseHeader } from "@/components/layout/NurseHeader";
import NurseHomeVisits from "@/components/nurse/NurseHomeVisits";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function NurseProfile() {
  const { user, logoutUser, loading, isNurse, isAdmin, isDoctor, isPatient } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("home-visits");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && user && !isNurse) {
      if (isAdmin) {
        router.replace('/admin/profile');
      } else if (isDoctor) {
        router.replace('/doctor/consultations');
      } else if (isPatient) {
        router.replace('/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, isNurse, isAdmin, isDoctor, isPatient, router]);

  if (loading) {
    return <PremiumLoadingScreen message="Проверка авторизации" />;
  }

  if (!user || !isNurse) {
    return <PremiumLoadingScreen message="Перенаправление на страницу профиля медсестры" />;
  }

  const handleLogout = () => {
    toast.success("Вы успешно вышли!", { position: "top-right", autoClose: 3000 });
    setTimeout(() => {
      logoutUser();
      router.replace("/");
    }, 1000);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home-visits":
        return <NurseHomeVisits />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <NurseSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-80'}`}>
        {/* Header */}
        <NurseHeader
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 bg-gray-50">
          {/* Page Content */}
          <div className="transition-all duration-300">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
