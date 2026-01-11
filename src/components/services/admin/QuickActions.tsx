"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Calendar, TrendingUp } from "lucide-react";

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg flex items-center gap-3 font-semibold"
        >
          <Users className="w-5 h-5" />
          Manage Staff
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-lg flex items-center gap-3 font-semibold"
        >
          <Calendar className="w-5 h-5" />
          View Schedule
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg flex items-center gap-3 font-semibold"
        >
          <TrendingUp className="w-5 h-5" />
          View Reports
        </motion.button>
      </div>
    </motion.div>
  );
}
