"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/components/services/profile/useUserProfile";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, setIsAuthOpen } = useAuth();
  const { userProfile, loading: profileLoading, error: profileError } = useUserProfile();
  const router = useRouter();

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
      // User is not authenticated, show auth popup immediately and redirect
      setIsAuthOpen(true);
      router.replace('/');
      return;
    }

    if (!loading && user?.role === "doctor") {
      router.replace("/doctor-profile");
      return;
    }

    if (!loading && user?.role === "admin") {
      router.replace("/admin-profile");
      return;
    }

    if (!loading && user?.role === "nurse") {
      router.replace("/nurse-profile");
      return;
    }
  }, [loading, user, router, setIsAuthOpen]);

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar with control */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ${sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-80'}`}>
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
