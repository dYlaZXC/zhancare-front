"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { NurseSidebar } from "@/components/layout/NurseSidebar";
import { NurseHeader } from "@/components/layout/NurseHeader";
import { NurseBreadcrumb } from "@/components/layout/NurseBreadcrumb";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setIsAuthOpen } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== "nurse") {
      // Redirect to appropriate profile based on role
      if (user.role === 'admin') {
        router.replace('/admin/profile');
      } else if (user.role === 'doctor') {
        router.replace('/doctor/consultations');
      } else if (user.role === 'patient') {
        router.replace('/patient/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      setIsAuthOpen(true);
      router.replace("/");
    }
  }, [loading, user, router, setIsAuthOpen]);

  if (loading) {
    return <PremiumLoadingScreen message="Проверка авторизации" />;
  }

  if (!user || user.role !== "nurse") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Перенаправление на страницу профиля медсестры...</div>
      </div>
    );
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
          {/* Breadcrumb */}
          <NurseBreadcrumb />

          {/* Page Content */}
          <div className="px-3 pb-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
