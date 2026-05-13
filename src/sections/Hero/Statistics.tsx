"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StatisticsProps {
  language: string;
  isInView: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 100, duration: 0.6 }
  }
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return String(n);
}

export default function Statistics({ language, isInView }: StatisticsProps) {
  const [doctors, setDoctors] = useState<string>("100+");
  const [consultations, setConsultations] = useState<string>("1000+");

  useEffect(() => {
    fetch(`${API}/public/stats/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setDoctors(formatCount(data.doctors));
        setConsultations(formatCount(data.consultations));
      })
      .catch(() => {});
  }, []);

  const statsData = [
    {
      value: consultations,
      label: { ru: "Консультаций", kz: "Консультация", en: "Consultations" },
      delay: 1.2,
    },
    {
      value: doctors,
      label: { ru: "Врачей", kz: "Дәрігер", en: "Doctors" },
      delay: 1.4,
    },
    {
      value: "24/7",
      label: { ru: "Поддержка", kz: "Қолдау", en: "Support" },
      delay: 1.6,
    },
  ];

  const getLabel = (stat: typeof statsData[0]) => {
    switch (language) {
      case "ru": return stat.label.ru;
      case "kz": return stat.label.kz;
      case "en": return stat.label.en;
      default: return stat.label.en;
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0 pt-8 border-t border-white/10">
        {statsData.map((stat, index) => (
          <div key={index} className="text-center lg:text-left">
            <motion.div
              className="text-2xl sm:text-3xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
              transition={{ delay: stat.delay, duration: 0.6 }}
            >
              {stat.value}
            </motion.div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">
              {getLabel(stat)}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
