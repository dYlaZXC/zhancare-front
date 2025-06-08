"use client";

import React from "react";
import { UserCircle } from "lucide-react";

interface User {
  first_name: string;
  last_name?: string;
  email: string;
}

interface UserInfoPanelProps {
  user: User | null;
}

const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-4 bg-white rounded-2xl p-4 shadow border border-gray-100">
      <UserCircle className="w-12 h-12 text-[#001E80]" />
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {user.first_name} {user.last_name || ""}
        </h2>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    </div>
  );
};

export default UserInfoPanel;
