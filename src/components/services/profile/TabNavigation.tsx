"use client";

import { User, FileText, Home } from "lucide-react";

interface Tab {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps {
  selectedTab: number;
  onTabChange: (index: number) => void;
}

export const TabNavigation = ({ selectedTab, onTabChange }: TabNavigationProps) => {
  const tabs: Tab[] = [
    { name: "Общая информация", icon: User },
    { name: "История", icon: FileText },
    { name: "Визиты", icon: Home },
  ];

  return (
    <div className="border-b border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {tabs.map((tab, index) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(index)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-sm font-medium rounded-lg transition-all touch-manipulation ${
                selectedTab === index
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600"
              } w-full sm:w-auto min-h-[44px] sm:min-h-[36px]`}
            >
              <IconComponent className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};