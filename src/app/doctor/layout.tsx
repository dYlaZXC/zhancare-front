"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { DoctorSidebar } from "@/components/layout/DoctorSidebar";
import { DoctorHeader } from "@/components/layout/DoctorHeader";
import { DoctorBreadcrumb } from "@/components/layout/DoctorBreadcrumb";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== "doctor") {
      // Redirect to appropriate profile based on role
      if (user.role === 'admin') {
        router.replace('/admin/profile');
      } else if (user.role === 'nurse') {
        router.replace('/nurse-profile');
      } else if (user.role === 'patient') {
        router.replace('/patient/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return <PremiumLoadingScreen message="Проверка авторизации" />;
  }

  if (!user || user.role !== "doctor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Перенаправление на страницу профиля врача...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <DoctorSidebar
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
        <main className="flex-1 bg-gray-50">
          {/* Breadcrumb */}
          <DoctorBreadcrumb />

          {/* Page Content */}
          <div className="px-3 pb-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
