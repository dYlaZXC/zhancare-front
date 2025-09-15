"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export interface FullUserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "patient" | "doctor" | "admin";
  role_display?: string;

  // Personal details
  birth_date?: string;
  gender?: "male" | "female" | "other";
  gender_display?: string;
  address?: string;
  city?: string;
  language?: "kz" | "ru" | "en" | "other";
  language_display?: string;
  citizenship?: string;
  marital_status?: "single" | "married" | "divorced" | "widowed";
  marital_status_display?: string;
  profession?: string;

  // Medical details
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  blood_type_display?: string;

  // Doctor specific
  doctor_type?: string;

  // Timestamps
  date_joined?: string;
}

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [fullUserProfile, setFullUserProfile] = useState<FullUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      console.log('❌ [useUserProfile] No user found, skipping API call');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔑 [useUserProfile] Starting API call...');
      console.log('🔑 [useUserProfile] User from AuthContext:', user);

      // Check authentication before making the call
      const token = localStorage.getItem("access_token");
      console.log('🔑 [useUserProfile] Access token exists:', !!token);
      console.log('🔑 [useUserProfile] Token preview:', token ? token.substring(0, 20) + '...' : 'none');

      console.log('🔑 [useUserProfile] Making API call to /user-profile/profile/...');
      const response = await api.get('/user-profile/profile/');

      console.log('✅ [useUserProfile] SUCCESS! API Response:', response.data);
      console.log('📞 [useUserProfile] Phone in API response:', response.data?.phone);
      console.log('🎯 [useUserProfile] Full response keys:', Object.keys(response.data));

      setFullUserProfile(response.data);
    } catch (error: any) {
      console.error('❌ [useUserProfile] Error fetching user profile:', error);
      console.error('❌ [useUserProfile] Error status:', error?.response?.status);
      console.error('❌ [useUserProfile] Error data:', error?.response?.data);
      console.error('❌ [useUserProfile] Error message:', error?.message);

      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch user profile';
      setError(errorMessage);

      // Fallback to basic user data on error
      if (user) {
        console.log('📄 [useUserProfile] Using fallback user data:', user);
        setFullUserProfile({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role || "patient",
        } as FullUserProfile);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔄 [useUserProfile] useEffect triggered:', { authLoading, user: !!user });
    if (!authLoading && user) {
      console.log('🔄 [useUserProfile] Calling fetchUserProfile...');
      fetchUserProfile();
    } else if (!authLoading && !user) {
      console.log('🔄 [useUserProfile] No user, setting loading to false');
      setLoading(false);
    } else {
      console.log('🔄 [useUserProfile] Still loading auth or no conditions met', { authLoading, user: !!user });
    }
  }, [authLoading, user]); // Removed fetchUserProfile from dependencies

  // Create the final user profile object with proper fallbacks
  const userProfile = fullUserProfile ? {
    id: String(fullUserProfile.id || user?.id || 0),
    first_name: fullUserProfile.first_name || user?.first_name || "",
    last_name: fullUserProfile.last_name || user?.last_name || "",
    email: fullUserProfile.email || user?.email || "",
    phone: fullUserProfile.phone || user?.phone || "",
    role: fullUserProfile.role || user?.role || "patient",
    role_display: fullUserProfile.role_display || "",

    // Personal details
    birth_date: fullUserProfile.birth_date || "",
    gender: fullUserProfile.gender || "",
    gender_display: fullUserProfile.gender_display || "",
    address: fullUserProfile.address || "",
    city: fullUserProfile.city || "",
    language: fullUserProfile.language || "ru",
    language_display: fullUserProfile.language_display || "",
    citizenship: fullUserProfile.citizenship || "",
    marital_status: fullUserProfile.marital_status || "",
    marital_status_display: fullUserProfile.marital_status_display || "",
    profession: fullUserProfile.profession || "",

    // Medical details
    blood_type: fullUserProfile.blood_type || "",
    blood_type_display: fullUserProfile.blood_type_display || "",

    // Doctor specific
    doctor_type: fullUserProfile.doctor_type || "",

    // Timestamps
    date_joined: fullUserProfile.date_joined || "",
  } : null;

  console.log('🎯 [useUserProfile] Final userProfile creation:');
  console.log('🎯 [useUserProfile] - fullUserProfile exists:', !!fullUserProfile);
  console.log('🎯 [useUserProfile] - fullUserProfile data:', fullUserProfile);
  console.log('🎯 [useUserProfile] - Final userProfile object:', userProfile);
  console.log('📞 [useUserProfile] - Final userProfile.phone:', userProfile?.phone);
  console.log('🔍 [useUserProfile] - Current states:', { loading, error, hasFullProfile: !!fullUserProfile });

  return {
    userProfile,
    fullUserProfile,
    loading,
    error,
    refetch: fetchUserProfile,
  };
};