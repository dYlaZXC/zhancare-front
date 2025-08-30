// src/components/ProfilePage.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { MainContent } from "@/components/layout/MainContent";

import VideoConsultation from "@/components/services/VideoConsultation";
import Appointments from "@/components/services/HomeAppointments";
import MedicalHistory from "@/components/services/MedicalHistory";
import ChatDoctors from "@/components/services/ChatDoctors";
import ProfileDetails from "@/components/services/ProfileDetails";
import { ActivityLog } from "@/components/services/ActivityLog";
import Image from "next/image";
import Logo from "@/assets/logosaas_new2.png";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    if (!loading && user?.role === "doctor") {
      router.replace("/doctor-profile");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-pulse">
          <Image src={Logo} alt="Loading..." width={120} height={120} priority />
        </div>
        <p className="text-gray-500 mt-4 text-sm">Проверка авторизации...</p>
      </div>
    );
  }

  if (!user) return null;

  // ✅ Добавляем id в объект userProfile
  const userProfile = {
    id: user.id || 0,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileDetails user={userProfile} />;
      case "video":
        return <VideoConsultation />;
      case "appointments":
        return <Appointments />;
      case "history":
        return <MedicalHistory />;
      case "chat":
        return <ChatDoctors />;
      case "documents":
        return <div>📄 Раздел документов в разработке...</div>;
      case "activity":
        return <ActivityLog />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar with control */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header with menu toggle */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto">
          <main className="flex-1 p-4 sm:p-6 bg-gray-50">
            {/* Breadcrumbs */}
            <Breadcrumb activeTab={activeTab} />

            {/* Animated Content */}
            <MainContent activeTab={activeTab}>{renderContent()}</MainContent>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
