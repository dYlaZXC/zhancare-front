"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import ProfileDetails from "@/components/services/ProfileDetails";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <ProfileDetailsWrapper />
      </TabLayout>
    </AuthRedirect>
  );
}

function ProfileDetailsWrapper() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role && user.role !== 'patient') {
      // Redirect to appropriate profile based on role
      if (user.role === 'doctor') {
        router.replace('/doctor-profile');
      } else if (user.role === 'nurse') {
        router.replace('/nurse-profile');
      } else if (user.role === 'admin') {
        router.replace('/admin-profile');
      }
    }
  }, [user, router]);

  if (!user) return null;

  // Only allow patient role (or users without specific roles)
  if (user.role && user.role !== 'patient') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    );
  }

  // Convert id to string to match User type expectations
  const userProfile = {
    id: String(user.id || 0),
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
  };

  return <ProfileDetails user={userProfile} />;
}
