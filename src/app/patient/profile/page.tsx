"use client";

import { useUserProfile } from "@/components/services/profile/useUserProfile";
import ProfileDetails from "@/components/services/ProfileDetails";

export default function PatientProfilePage() {
  const { userProfile, loading, error, refetch } = useUserProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Error loading profile</div>
      </div>
    );
  }

  return <ProfileDetails user={userProfile} onRefetch={refetch} />;
}
