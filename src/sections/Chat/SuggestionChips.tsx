"use client";
import { motion } from "framer-motion";
import { FaThermometerHalf, FaBrain, FaVirus, FaHeartbeat, FaPills } from "react-icons/fa";

interface SuggestionChipsProps {
  language: string;
  streaming: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const icons = [FaThermometerHalf, FaBrain, FaVirus, FaHeartbeat, FaPills];

const allSuggestions: Record<string, Array<{ text: string; full: string }>> = {
  ru: [
    { text: "Температура", full: "Температура и озноб" },
    { text: "Головная боль", full: "Сильная головная боль" },
    { text: "Простуда", full: "Насморк и боль в горле" },
    { text: "Боль в груди", full: "Боль в груди при дыхании" },
    { text: "Лекарства", full: "Какое лекарство принять" },
  ],
  en: [
    { text: "Fever", full: "Fever and chills" },
    { text: "Headache", full: "Severe headache" },
    { text: "Cold", full: "Runny nose and sore throat" },
    { text: "Chest pain", full: "Chest pain when breathing" },
    { text: "Medicine", full: "What medicine should I take" },
  ],
  kz: [
    { text: "Температура", full: "Температура және дірілдеу" },
    { text: "Бас ауруы", full: "Қатты бас ауруы" },
    { text: "Суық тию", full: "Мұрын ағуы және жұтқыншақ ауруы" },
    { text: "Кеуде ауруы", full: "Тыныс алғанда кеуде ауруы" },
    { text: "Дәрі", full: "Қандай дәрі ішу керек" },
  ],
  uz: [
    { text: "Harorat", full: "Harorat va qaltirash" },
    { text: "Bosh og'rig'i", full: "Kuchli bosh og'rig'i" },
    { text: "Shamollash", full: "Burun bitishi va tomoq og'rig'i" },
    { text: "Ko'krak og'rig'i", full: "Nafas olganda ko'krak og'rig'i" },
    { text: "Dori", full: "Qaysi dorini ichish kerak" },
  ],
};

export default function SuggestionChips({ language, streaming, onSuggestionClick }: SuggestionChipsProps) {
  const chips = allSuggestions[language] ?? allSuggestions.en;

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {chips.map((chip, i) => {
        const Icon = icons[i];
        return (
          <motion.button
            key={i}
            onClick={() => onSuggestionClick(chip.full)}
            disabled={streaming}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.62)",
            }}
            whileHover={!streaming ? {
              scale: 1.04,
              y: -1,
            } : {}}
            whileTap={!streaming ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.06 }}
          >
            <Icon size={11} style={{ color: "#6AA2FF", flexShrink: 0 }} />
            <span>{chip.text}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
