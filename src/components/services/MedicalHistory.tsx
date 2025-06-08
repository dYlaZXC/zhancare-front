"use client";

import React from "react";
import { CalendarDays, FileText } from "lucide-react";
import { motion } from "framer-motion";

const mockHistory = [
  {
    id: 1,
    title: "Грипп",
    date: "12 марта 2024",
    notes: "Легкое течение, назначен парацетамол и отдых.",
    file: "gripp-recommendation.pdf",
  },
  {
    id: 2,
    title: "Общий анализ крови",
    date: "5 февраля 2024",
    notes: "Все показатели в норме. Повторный анализ через 6 месяцев.",
    file: "blood-test-2024.pdf",
  },
];

const MedicalHistory = () => {
  return (
    <div className="p-6 bg-white shadow-xl rounded-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#001E80]">Медицинская история</h2>
        <p className="text-gray-500 text-sm">История заболеваний и анализов за последние визиты.</p>
      </div>

      <div className="space-y-4">
        {mockHistory.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-blue-800">{item.title}</h3>
            <div className="flex items-center text-sm text-gray-500 gap-2 mt-1">
              <CalendarDays className="w-4 h-4" />
              <span>{item.date}</span>
            </div>
            <p className="text-sm text-gray-700 mt-2">{item.notes}</p>

            <div className="mt-3">
              <a
                href={`/files/${item.file}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <FileText className="w-4 h-4" />
                {item.file}
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MedicalHistory;
