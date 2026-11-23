"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminBreadcrumb } from "@/components/layout/AdminBreadcrumb";
import { DoctorMainContent } from "@/components/layout/DoctorMainContent";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

import AdminProfileDashboard from "@/components/services/admin/AdminProfileDashboard";
import StaffManagement from "@/components/services/admin/StaffManagement";
import PatientManagement from "@/components/services/admin/PatientManagement";
import ScheduleView from "@/components/services/admin/ScheduleView";
import ReportsView from "@/components/services/admin/ReportsView";
import ActivityView from "@/components/services/admin/ActivityView";
import { ServicesView } from "@/components/services/admin/ServicesView";

export default function AdminProfile() {
  const { user, logoutUser, loading, setIsAuthOpen, isAdmin, isDoctor, isNurse, isPatient } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoggingOut) return;

    if (!loading && user && !isAdmin) {
      if (isDoctor) {
        router.replace('/doctor/consultations');
      } else if (isNurse) {
        router.replace('/nurse/home-visits');
      } else if (isPatient) {
        router.replace('/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, isDoctor, isNurse, isPatient, router, isLoggingOut]);

  if (loading) {
    return <PremiumLoadingScreen message="Проверка авторизации" />;
  }

  if (!user || !isAdmin) {
    return <PremiumLoadingScreen message="Перенаправление на страницу профиля администратора" />;
  }

  const handleLogout = () => {
    toast.success("Вы успешно вышли!", { position: "top-right", autoClose: 1000 });
    setTimeout(() => {
      // Clear localStorage directly without triggering React state updates
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      // Set flag to auto-open auth popup on homepage
      localStorage.setItem("show_auth_after_logout", "true");

      // Immediate hard redirect - state will be cleared on next page load
      window.location.href = "/";
    }, 1200);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <AdminProfileDashboard user={user} />;
      case "staff":
        return <StaffManagement user={user} />;
      case "patients":
        return <PatientManagement user={user} />;
      case "schedule":
        return <ScheduleView user={user} />;
      case "reports":
        return <ReportsView user={user} />;
      case "services":
        return <ServicesView user={user} />;
      case "activity":
        return <ActivityView user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-80'}`}>
        {/* Header */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 p-4 sm:p-6">
          {/* Breadcrumb */}
          <AdminBreadcrumb
          />

          {/* Page Content with loading animation */}
          <DoctorMainContent activeTab={activeTab}>
            {renderContent()}
          </DoctorMainContent>
        </main>
      </div>
    </div>
  );
}
