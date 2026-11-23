"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle, Clock } from "lucide-react";
import StatCard from "./StatCard";

interface ActivityOverviewProps {
  activeConsultations: number;
  completedToday: number;
  pendingAppointments: number;
}

export default function ActivityOverview({
  activeConsultations,
  completedToday,
  pendingAppointments,
}: ActivityOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Activity Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Activity}
          title="Active Consultations"
          value={activeConsultations}
          subtitle="Currently ongoing"
          color="#f59e0b"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Today"
          value={completedToday}
          subtitle="Consultations finished"
          color="#10b981"
        />
        <StatCard
          icon={Clock}
          title="Pending Appointments"
          value={pendingAppointments}
          subtitle="Scheduled consultations"
          color="#6366f1"
        />
      </div>
    </motion.div>
  );
}
