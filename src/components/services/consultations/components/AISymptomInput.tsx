import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, AlertCircle } from "lucide-react";

interface AISymptomInputProps {
  onRequestAIRecommendation?: (symptoms: string) => void;
  loadingAI?: boolean;
}

const AISymptomInput: React.FC<AISymptomInputProps> = ({
  onRequestAIRecommendation,
  loadingAI = false,
}) => {
  const [localSymptoms, setLocalSymptoms] = useState("");

  const handleSubmit = () => {
    if (localSymptoms.trim().length > 0 && onRequestAIRecommendation && !loadingAI) {
      onRequestAIRecommendation(localSymptoms);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-5"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex-shrink-0">
          <Sparkles size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-blue-900 mb-1">Получите рекомендации ИИ (опционально)</h4>
          <p className="text-sm text-blue-800 mb-3">
            Опишите ваши симптомы, и наш ИИ подберет наиболее подходящего специалиста
          </p>
          <textarea
            value={localSymptoms}
            onChange={(e) => setLocalSymptoms(e.target.value)}
            className="w-full h-20 md:h-24 p-3 rounded-lg border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white resize-none transition-all text-sm text-gray-800 placeholder-gray-400"
            placeholder="Например: Головная боль с утра, температура 38°C, общая слабость..."
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-blue-700">
              <AlertCircle size={12} />
              <span>{localSymptoms.length}/500 символов</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={localSymptoms.trim().length === 0 || loadingAI}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                localSymptoms.trim().length > 0 && !loadingAI
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loadingAI ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Анализируем...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Получить рекомендации
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(AISymptomInput);
