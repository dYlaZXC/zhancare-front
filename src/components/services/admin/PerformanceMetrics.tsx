"use client";

import React from "react";
import { motion } from "framer-motion";
import { DollarSign, Star } from "lucide-react";
import StatCard from "./StatCard";

interface PerformanceMetricsProps {
  monthlyRevenue: number;
  averageRating: number;
}

export default function PerformanceMetrics({
  monthlyRevenue,
  averageRating,
}: PerformanceMetricsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString()}`}
          subtitle="This month's earnings"
          color="#059669"
        />
        <StatCard
          icon={Star}
          title="Average Rating"
          value={averageRating.toFixed(1)}
          subtitle="Patient satisfaction"
          color="#eab308"
        />
      </div>
    </motion.div>
  );
}
