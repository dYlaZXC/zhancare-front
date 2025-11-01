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
      "📍 Указывайте полный адрес: улица, дом, подъезд, этаж, квартира",
      "🗺️ Используйте карту для точного определения местоположения",
      "📋 Опишите основные симптомы: температура, кашель, боль и т.п.",
      "💊 Укажите хронические заболевания и принимаемые лекарства",
      "🚑 При экстренных случаях лучше вызвать скорую помощь 103",
    ],
  },
  2: {
    title: "Советы при выборе врача и времени",
    tips: [
      "👨‍⚕️ Все специалисты имеют необходимую квалификацию и опыт",
      "⏰ Выбирайте время с запасом минимум 30 минут",
      "🏠 Убедитесь, что вы будете дома в выбранное время",
      "📞 Врач может позвонить за 10-15 минут до прибытия",
      "💰 Стоимость визита уточняется после подтверждения",
    ],
  },
  3: {
    title: "Перед подтверждением вызова",
    tips: [
      "✅ Проверьте все данные: адрес, дату, время, симптомы",
      "📲 После отправки вы получите SMS-подтверждение",
      "🔔 Врач получит уведомление автоматически",
      "💬 Будьте на связи по указанному телефону",
      "🚪 Подготовьте документы: паспорт, медицинская карта (если есть)",
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
      className="sticky top-6"
    >
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-amber-900 font-bold text-base leading-tight">{title}</h3>
            <p className="text-amber-700 text-xs mt-1">Полезные советы</p>
          </div>
        </div>

        {/* Tips List */}
        <div className="space-y-2.5">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-sm text-amber-900 leading-relaxed"
            >
              <span className="text-base flex-shrink-0 mt-0.5">{tip.split(' ')[0]}</span>
              <span className="flex-1">{tip.substring(tip.indexOf(' ') + 1)}</span>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-700 text-center">
            💡 Следуйте этим рекомендациям для успешного вызова
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TipsPanel;
