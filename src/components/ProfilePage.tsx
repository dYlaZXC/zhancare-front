// src/components/ProfilePage.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/components/services/profile/useUserProfile";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { MainContent } from "@/components/layout/MainContent";

import VideoConsultationFlow from "@/components/services/VideoConsultationFlow";
import Appointments from "@/components/services/HomeAppointments";
import MedicalHistory from "@/components/services/MedicalHistory";
import ChatDoctors from "@/components/services/ChatDoctors";
import ProfileDetails from "@/components/services/ProfileDetails";
import { ActivityLog } from "@/components/services/ActivityLog";

const ProfilePage = () => {
  const { user, loading, isDoctor } = useAuth();
  const { userProfile, loading: profileLoading, error: profileError, refetch } = useUserProfile();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Profile error handling
  useEffect(() => {
    if (profileError) {
      console.error('Profile loading error:', profileError);
    }
  }, [profileError]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
      return;
    }

    if (!loading && isDoctor) {
      router.replace("/doctor-profile");
      return;
    }
  }, [loading, user, isDoctor, router]);

  if (loading || profileLoading) {
    return null; // Don't show loading screen, let auth popup handle it
  }

  if (!user) {
    // User will be redirected immediately, return null to avoid flash
    return null;
  }

  // If no userProfile data yet, don't render
  if (!userProfile) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileDetails user={userProfile} onRefetch={refetch} />;
      case "video":
        return <VideoConsultationFlow />;
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
            <Breadcrumb />

            {/* Animated Content */}
            <MainContent activeTab={activeTab}>{renderContent()}</MainContent>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;