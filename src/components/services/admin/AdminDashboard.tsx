"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, AlertCircle, Loader2, TrendingUp } from "lucide-react";
import ClinicInfo from "./ClinicInfo";
import StaffOverview from "./StaffOverview";
import ActivityOverview from "./ActivityOverview";
import PerformanceMetrics from "./PerformanceMetrics";
import QuickActions from "./QuickActions";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  clinic?: {
    id: number;
    name: string;
    address: string;
    city: string;
    rating: number;
  };
}

interface AdminDashboardProps {
  user: User;
}

interface ClinicStats {
  total_doctors: number;
  total_nurses: number;
  total_patients: number;
  active_consultations: number;
  completed_consultations_today: number;
  pending_appointments: number;
  total_revenue_month: number;
  average_rating: number;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClinicStats();
  }, []);

  const fetchClinicStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clinic-stats/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch clinic statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error("Error fetching clinic stats:", err);
      setError(err.message || "Failed to load clinic statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome, {user.first_name} {user.last_name}
              </h1>
              <p className="text-blue-100 text-lg">Administrator Dashboard</p>
              <p className="text-blue-200 text-sm mt-1">{user.email}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4">
              <Building2 className="w-16 h-16" />
            </div>
          </div>
        </motion.div>

        {/* Clinic Information */}
        {user.clinic && <ClinicInfo clinic={user.clinic} />}

        {/* Statistics Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <span className="ml-3 text-lg text-gray-600">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Statistics</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        ) : stats ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Clinic Statistics
              </h2>
            </motion.div>

            {/* Staff Statistics */}
            <StaffOverview
              totalDoctors={stats.total_doctors}
              totalNurses={stats.total_nurses}
              totalPatients={stats.total_patients}
            />

            {/* Consultations & Appointments */}
            <ActivityOverview
              activeConsultations={stats.active_consultations}
              completedToday={stats.completed_consultations_today}
              pendingAppointments={stats.pending_appointments}
            />

            {/* Financial & Rating */}
            <PerformanceMetrics
              monthlyRevenue={stats.total_revenue_month}
              averageRating={stats.average_rating}
            />
          </>
        ) : null}

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}
