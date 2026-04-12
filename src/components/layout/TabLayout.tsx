"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { MainContent } from "@/components/layout/MainContent";
import { ReactNode } from "react";

interface TabLayoutProps {
  children: ReactNode;
}

const TabLayout = ({ children }: TabLayoutProps) => {
  const { user, loading, isDoctor } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Map pathnames to tab IDs
  const getActiveTabFromPath = (pathname: string | null): string => {
    if (!pathname) return 'profile';
    const path = pathname.split('/').pop() || '';
    switch (path) {
      case 'profile': return 'profile';
      case 'smart-consultation': return 'smart-consultation';
      case 'video': return 'video';
      case 'appointments': return 'appointments';
      case 'history': return 'history';
      case 'chat': return 'chat';
      case 'documents': return 'documents';
      case 'activity': return 'activity';
      default: return 'profile';
    }
  };

  const activeTab = getActiveTabFromPath(pathname);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTabChange = (tabId: string) => {
    router.push(`/${tabId}`);
  };

  useEffect(() => {
    if (!loading && isDoctor) {
      router.replace("/doctor-profile");
    }
  }, [loading, user, isDoctor, router]);

  if (loading) {
    return null; // Don't show loading screen
  }

  if (!user) {
    return null; // AuthRedirect component handles this case
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar with control */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content - Account for desktop sidebar on XL screens and above */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-80'} transition-all duration-500`}>
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
            <MainContent activeTab={activeTab}>{children}</MainContent>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TabLayout;