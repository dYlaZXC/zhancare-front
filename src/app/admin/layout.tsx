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
  const { user, loading, setIsAuthOpen } = useAuth();
  const router = useRouter();

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
        router.replace('/patient/profile');
      } else {
        router.replace("/");
      }
    } else if (!loading && !user) {
      setIsAuthOpen(true);
      router.replace("/");
    }
  }, [loading, user, router, isLoggingOut, setIsAuthOpen]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return <PremiumLoadingScreen message="Проверка авторизации" />;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Перенаправление на страницу профиля администратора...</div>
      </div>
    );
  }

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
        <main className="flex-1 bg-gray-50">
          {/* Breadcrumb */}
          <AdminBreadcrumb />

          {/* Page Content */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
