"use client";

import { motion } from "framer-motion";

interface StatisticsProps {
  language: string;
  isInView: boolean;
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 0.6
    }
  }
};

const statsData = [
  {
    value: "700+",
    label: {
      ru: "Консультаций",
      kz: "Консультация"
    },
    delay: 1.2
  },
  {
    value: "100+",
    label: {
      ru: "Врачей",
      kz: "Дәрігер"
    },
    delay: 1.4
  },
  {
    value: "24/7",
    label: {
      ru: "Поддержка",
      kz: "Қолдау"
    },
    delay: 1.6
  }
];

export default function Statistics({ language, isInView }: StatisticsProps) {
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
              {language === "ru" ? stat.label.ru : stat.label.kz}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}