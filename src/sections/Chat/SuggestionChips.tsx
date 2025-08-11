"use client";
import { motion } from "framer-motion";
import { FaLightbulb } from "react-icons/fa";

interface SuggestionChipsProps {
  language: string;
  streaming: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export default function SuggestionChips({
  language,
  streaming,
  onSuggestionClick
}: SuggestionChipsProps) {
  const getSuggestions = () => {
    switch (language) {
      case "ru":
        return [
          "Головная боль и температура",
          "Боль в груди при дыхании",
          "Проблемы со сном"
        ];
      case "en":
        return [
          "Headache and fever",
          "Chest pain when breathing",
          "Sleep problems"
        ];
      case "kz":
        return [
          "Бас ауруы және температура",
          "Тыныс алғанда кеуде ауруы",
          "Ұйқы мәселелері"
        ];
      default:
        return ["Headache and fever", "Chest pain when breathing", "Sleep problems"];
    }
  };

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      {getSuggestions().map((suggestion, i) => (
        <motion.button
          key={i}
          onClick={() => onSuggestionClick(suggestion)}
          disabled={streaming}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!streaming ? { scale: 1.02 } : {}}
          whileTap={!streaming ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.1 }}
        >
          <FaLightbulb className="text-yellow-400" size={12} />
          <span>{suggestion}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}