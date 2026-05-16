"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminBreadcrumb } from "@/components/layout/AdminBreadcrumb";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, setIsAuthOpen, isAdmin, isDoctor, isNurse, isPatient } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoggingOut) return;

    if (!loading && user && !isAdmin) {
      if (isDoctor) {
        router.replace('/doctor-profile');
      } else if (isNurse) {
        router.replace('/nurse-profile');
      } else if (isPatient) {
        router.replace('/patient/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      setIsAuthOpen(true);
      router.replace("/");
    }
  }, [loading, user, isAdmin, isDoctor, isNurse, isPatient, router, isLoggingOut, setIsAuthOpen]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return <PremiumLoadingScreen message="Проверка авторизации" />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Перенаправление на страницу профиля администратора...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main */}
      <div className={`flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-500 ${sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-80'}`}>
        {/* Header */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
          {/* Breadcrumb */}
          <AdminBreadcrumb />

          {/* Page Content — scrollable for normal pages */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col pl-4 sm:pl-6 pr-0 pt-4 sm:pt-6 pb-4 sm:pb-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
