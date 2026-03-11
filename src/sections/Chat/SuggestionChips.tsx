"use client";
import { motion } from "framer-motion";
import { FaThermometerHalf, FaBrain, FaVirus, FaHeartbeat, FaPills } from "react-icons/fa";

interface SuggestionChipsProps {
  language: string;
  streaming: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const icons = [FaThermometerHalf, FaBrain, FaVirus, FaHeartbeat, FaPills];

export default function SuggestionChips({
  language,
  streaming,
  onSuggestionClick
}: SuggestionChipsProps) {
  const getSuggestions = () => {
    switch (language) {
      case "ru":
        return [
          { text: "Температура", full: "Температура и озноб" },
          { text: "Головная боль", full: "Сильная головная боль" },
          { text: "Простуда", full: "Насморк и боль в горле" },
          { text: "Боль", full: "Боль в груди при дыхании" },
          { text: "Лекарства", full: "Какое лекарство принять" },
        ];
      case "en":
        return [
          { text: "Fever", full: "Fever and chills" },
          { text: "Headache", full: "Severe headache" },
          { text: "Cold", full: "Runny nose and sore throat" },
          { text: "Pain", full: "Chest pain when breathing" },
          { text: "Medicine", full: "What medicine should I take" },
        ];
      case "kz":
        return [
          { text: "Температура", full: "Температура және дірілдеу" },
          { text: "Бас ауруы", full: "Қатты бас ауруы" },
          { text: "Суық тию", full: "Мұрын ағуы және жұтқыншақ ауруы" },
          { text: "Ауырсыну", full: "Тыныс алғанда кеуде ауруы" },
          { text: "Дәрі", full: "Қандай дәрі ішу керек" },
        ];
      default:
        return [
          { text: "Fever", full: "Fever and chills" },
          { text: "Headache", full: "Severe headache" },
          { text: "Cold", full: "Runny nose and sore throat" },
          { text: "Pain", full: "Chest pain when breathing" },
          { text: "Medicine", full: "What medicine should I take" },
        ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      {suggestions.map((chip, i) => {
        const Icon = icons[i];
        return (
          <motion.button
            key={i}
            onClick={() => onSuggestionClick(chip.full)}
            disabled={streaming}
            className="flex items-center gap-1.5 bg-white/[0.07] backdrop-blur-sm border border-white/[0.10] rounded-full px-3.5 py-2 text-sm text-white/80 hover:bg-[#4F7FFF]/20 hover:border-[#4F7FFF]/50 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!streaming ? { scale: 1.04, y: -2 } : {}}
            whileTap={!streaming ? { scale: 0.96, y: 0 } : {}}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.07 }}
          >
            <Icon size={12} className="text-[#6AA2FF] flex-shrink-0" />
            <span>{chip.text}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
