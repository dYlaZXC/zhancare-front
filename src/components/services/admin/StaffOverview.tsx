"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserCheck, Users } from "lucide-react";
import StatCard from "./StatCard";

interface StaffOverviewProps {
  totalDoctors: number;
  totalNurses: number;
  totalPatients: number;
}

export default function StaffOverview({
  totalDoctors,
  totalNurses,
  totalPatients,
}: StaffOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Staff Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={UserCheck}
          title="Total Doctors"
          value={totalDoctors}
          color="#3b82f6"
        />
        <StatCard
          icon={Users}
          title="Total Nurses"
          value={totalNurses}
          color="#8b5cf6"
        />
        <StatCard
          icon={Users}
          title="Total Patients"
          value={totalPatients}
          color="#10b981"
        />
      </div>
    </motion.div>
  );
}
