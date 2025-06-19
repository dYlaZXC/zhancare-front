"use client";

import React from "react";

interface AuthTabsProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
  translations: {
    login: string;
    register: string;
  };
}

const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange, translations }) => {
  return (
    <div className="flex border-b mb-4 w-full">
      <button
        className={`flex-1 text-center py-2 font-medium ${
          activeTab === "login"
            ? "border-b-2 border-black text-black"
            : "text-gray-500 hover:text-black"
        }`}
        onClick={() => onTabChange("login")}
      >
        {translations.login}
      </button>
      <button
        className={`flex-1 text-center py-2 font-medium ${
          activeTab === "register"
            ? "border-b-2 border-black text-black"
            : "text-gray-500 hover:text-black"
        }`}
        onClick={() => onTabChange("register")}
      >
        {translations.register}
      </button>
    </div>
  );
};

export default AuthTabs;
