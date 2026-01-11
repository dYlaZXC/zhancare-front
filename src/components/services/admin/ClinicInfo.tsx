"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Star } from "lucide-react";

interface Clinic {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
}

interface ClinicInfoProps {
  clinic: Clinic;
}

export default function ClinicInfo({ clinic }: ClinicInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 className="w-6 h-6 text-blue-600" />
        Clinic Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Clinic Name</p>
          <p className="text-lg font-semibold text-gray-900">{clinic.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Location</p>
          <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            {clinic.city}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Address</p>
          <p className="text-lg font-semibold text-gray-900">{clinic.address}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Rating</p>
          <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            {clinic.rating.toFixed(1)} / 5.0
          </p>
        </div>
      </div>
    </motion.div>
  );
}
