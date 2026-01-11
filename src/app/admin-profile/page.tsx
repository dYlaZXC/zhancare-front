"use client";

import AuthRedirect from "@/components/AuthRedirect";
import AdminProfile from "@/components/AdminProfile";

export default function AdminProfilePage() {
  return (
    <AuthRedirect>
      <AdminProfile />
    </AuthRedirect>
  );
}
