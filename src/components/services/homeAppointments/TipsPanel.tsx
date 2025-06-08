"use client";

import React from "react";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface TipsPanelProps {
  step: 1 | 2 | 3;
}

const tipsByStep: Record<1 | 2 | 3, { title: string; tips: string[] }> = {
  1: {
    title: "Как правильно указать адрес и симптомы",
    tips: [
      "Указывайте полный адрес, включая подъезд и этаж, если есть.",
      "Опишите основные симптомы кратко: температура, кашель, боль и т.п.",
      "Если есть хронические болезни — укажите это.",
    ],
  },
  2: {
    title: "Советы при выборе врача и времени",
    tips: [
      "Выбирайте врача по специализации и опыту.",
      "Убедитесь, что выбрано время, когда вы точно будете дома.",
      "Проверьте точность адреса перед переходом дальше.",
    ],
  },
  3: {
    title: "Перед подтверждением вызова",
    tips: [
      "Проверьте все поля — адрес, дату, симптомы.",
      "После отправки врач получит уведомление автоматически.",
      "Будьте на связи — врач может позвонить перед приездом.",
    ],
  },
};

const TipsPanel: React.FC<TipsPanelProps> = ({ step }) => {
  const { title, tips } = tipsByStep[step];

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl shadow-md p-6 space-y-3"
    >
      <div className="flex items-center gap-2 text-yellow-800 font-semibold text-lg">
        <Lightbulb className="w-5 h-5" />
        {title}
      </div>
      <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </motion.div>
  );
};

export default TipsPanel;
