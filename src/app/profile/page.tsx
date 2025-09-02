"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import ProfileDetails from "@/components/services/ProfileDetails";
import { useAuth } from "@/context/AuthContext";

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
  
  if (!user) return null;
  
  // Convert id to string to match User type expectations
  const userProfile = {
    id: String(user.id || 0),
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
  };
  
  return <ProfileDetails user={userProfile} />;
}
