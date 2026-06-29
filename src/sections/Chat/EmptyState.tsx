"use client";

import { motion } from "framer-motion";
import { FaStethoscope, FaCheckCircle } from "react-icons/fa";

interface EmptyStateProps {
  language: string;
}

export default function EmptyState({ language }: EmptyStateProps) {
  const content = {
    ru: {
      welcome: "Добро пожаловать",
      subtitle: "Опишите ваши симптомы — получите рекомендации за 30 секунд",
      features: [
        "Анализ симптомов на основе клинических данных",
        "Рекомендации по обращению к специалисту",
        "Конфиденциальность и защита данных",
      ],
    },
    en: {
      welcome: "Welcome",
      subtitle: "Describe your symptoms — get recommendations in 30 seconds",
      features: [
        "Symptom analysis based on clinical data",
        "Specialist consultation recommendations",
        "Privacy and data protection",
      ],
    },
    kz: {
      welcome: "Қош келдіңіз",
      subtitle: "Симптомдарыңызды сипаттаңыз — 30 секундта ұсыныстар алыңыз",
      features: [
        "Клиникалық деректерге негізделген симптом талдауы",
        "Маман кеңесіне арналған ұсыныстар",
        "Құпиялылық және деректерді қорғау",
      ],
    },
    uz: {
      welcome: "Xush kelibsiz",
      subtitle: "Simptomlaringizni tasvirlang — 30 soniyada tavsiyalar olasiz",
      features: [
        "Klinik ma'lumotlarga asoslangan simptomlar tahlili",
        "Mutaxassis bilan konsultatsiya tavsiyalari",
        "Maxfiylik va ma'lumotlarni himoyalash",
      ],
    },
  };

  const c = content[language as keyof typeof content] || content.en;

  return (
    <motion.div
      className="text-center py-6 px-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Icon */}
      <motion.div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "linear-gradient(135deg, #4F7FFF 0%, #00C6FF 100%)" }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaStethoscope className="text-white text-2xl" />
      </motion.div>

      {/* Welcome */}
      <motion.h3
        className="text-lg font-semibold text-white mb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {c.welcome}
      </motion.h3>

      <motion.p
        className="text-sm text-white/50 max-w-xs mx-auto mb-6 leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {c.subtitle}
      </motion.p>

      {/* Feature list */}
      <div className="flex flex-col gap-2.5 items-center">
        {c.features.map((feature, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 text-xs text-white/35"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.1 }}
          >
            <FaCheckCircle size={11} className="text-[#4F7FFF] flex-shrink-0" />
            {feature}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
