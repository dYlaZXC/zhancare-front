"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const VideoCallPage = () => {
  const router = useRouter();
  const { user, isDoctor, isPatient } = useAuth();

  useEffect(() => {
    if (isDoctor) {
      router.push(`/video-call/doctor${window.location.search}`);
    } else if (isPatient) {
      router.push(`/video-call/patient${window.location.search}`);
    }
  }, [user, isDoctor, isPatient, router]);

  return (
    <div className="flex items-center justify-center h-screen text-blue-600">
      <Loader2 className="animate-spin w-8 h-8 mr-2" />
      Redirecting to role-specific video call...
    </div>
  );
};

export default VideoCallPage;
