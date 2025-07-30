import { NicknameEntryProps } from "./types";
import { motion } from "framer-motion";

export function NicknameEntry({
  nickname,
  onNicknameChange,
  onGenerate,
  loading,
  onStart,
}: NicknameEntryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-24 max-w-md mx-auto text-center px-4"
    >
      <h2 className="text-4xl font-extrabold text-white mb-6 drop-shadow-md">
        🧠 AI Викторина
      </h2>

      <input
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        className="w-full px-5 py-3 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md mb-4"
        placeholder="Введите никнейм"
      />

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-3 mb-4 rounded-xl font-medium transition duration-200 ${
          loading
            ? "bg-gray-600 text-white cursor-wait"
            : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
        }`}
      >
        {loading ? "Генерация..." : "🤖 Сгенерировать никнейм AI"}
      </button>

      <button
        onClick={onStart}
        disabled={!nickname.trim()}
        className={`w-full py-3 rounded-xl font-semibold transition duration-200 ${
          nickname.trim()
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 shadow-lg"
            : "bg-gray-400 text-white cursor-not-allowed"
        }`}
      >
        🚀 Начать игру
      </button>
    </motion.div>
  );
}
