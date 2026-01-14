"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminBreadcrumb } from "@/components/layout/AdminBreadcrumb";
import { DoctorMainContent } from "@/components/layout/DoctorMainContent";

import AdminProfileDashboard from "@/components/services/admin/AdminProfileDashboard";
import StaffManagement from "@/components/services/admin/StaffManagement";
import PatientManagement from "@/components/services/admin/PatientManagement";
import ScheduleView from "@/components/services/admin/ScheduleView";
import ReportsView from "@/components/services/admin/ReportsView";
import ActivityView from "@/components/services/admin/ActivityView";

export default function AdminProfile() {
  const { user, logoutUser, loading, setIsAuthOpen } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Don't redirect if we're in the process of logging out
    if (isLoggingOut) return;

    if (!loading && user && user.role !== "admin") {
      // Redirect to appropriate profile based on role
      if (user.role === 'doctor') {
        router.replace('/doctor-profile');
      } else if (user.role === 'nurse') {
        router.replace('/nurse-profile');
      } else if (user.role === 'patient') {
        router.replace('/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router, isLoggingOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        🔄 Проверка авторизации...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    );
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
            activeTab={activeTab}
            onNavigate={setActiveTab}
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
