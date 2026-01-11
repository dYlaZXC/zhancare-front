"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { DoctorSidebar } from "@/components/layout/DoctorSidebar";
import { DoctorHeader } from "@/components/layout/DoctorHeader";
import { DoctorBreadcrumb } from "@/components/layout/DoctorBreadcrumb";
import { DoctorMainContent } from "@/components/layout/DoctorMainContent";

// import DoctorConsultations from "@/components/services/DoctorConsultations";
import DoctorConsultationsNew from "@/components/services/DoctorConsultationsNew";
import DoctorProfileInfo from "@/components/doctor/DoctorProfileInfo";
import DoctorAnalytics from "@/components/doctor/DoctorAnalytics";

export default function DoctorProfile() {
  const { user, logoutUser, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("consultations");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== "doctor") {
      // Redirect to appropriate profile based on role
      if (user.role === 'admin') {
        router.replace('/admin-profile');
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
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        🔄 Проверка авторизации...
      </div>
    );
  }

  if (!user || user.role !== "doctor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    );
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
      case "appointments":
        return (
          <h1 className="text-2xl font-semibold text-[#001E80]">
            Ваши запланированные консультации
          </h1>
        );
      case "patients":
        return (
          <h1 className="text-2xl font-semibold text-[#001E80]">
            История пациентов
          </h1>
        );
      case "consultations":
        return <DoctorConsultationsNew />;
      case "analytics":
        return <DoctorAnalytics />;
      case "profile":
        return <DoctorProfileInfo />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <DoctorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-80'}`}>
        {/* Header */}
        <DoctorHeader 
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Main Content */}
        <main className={`flex-1 bg-gray-50 ${activeTab === 'consultations' || activeTab === 'analytics' ? '' : 'p-4 sm:p-6'}`}>
          {/* Breadcrumb - Hide for consultations, analytics and profile tabs */}
          {activeTab !== 'consultations' && activeTab !== 'profile' && activeTab !== 'analytics' && (
            <DoctorBreadcrumb
              activeTab={activeTab}
              onNavigate={setActiveTab}
            />
          )}

          {/* Page Content with loading animation */}
          <DoctorMainContent activeTab={activeTab}>
            {renderContent()}
          </DoctorMainContent>
        </main>
      </div>
    </div>
  );
}
