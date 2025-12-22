"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Info, 
  ClipboardPaste, 
  Mic, 
  MicOff,
  Thermometer,
  Heart,
  Brain,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
// PatientConsultationsTable moved to ClinicsSelection component

interface Step1Props {
  symptoms: string;
  onChange: (value: string) => void;
  onNext: () => void;
  loading?: boolean;
}

const VideoConsultationStep1: React.FC<Step1Props> = ({
  symptoms,
  onChange,
  onNext,
  loading = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [charCount, setCharCount] = useState(symptoms.length);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isNextDisabled = !symptoms.trim() || loading;
  const minChars = 20;
  const maxChars = 500;
  const progress = Math.min((charCount / minChars) * 100, 100);

  // Quick symptom categories
  const categories = [
    { id: 'fever', icon: Thermometer, label: 'Температура/Жар', color: 'from-red-500 to-orange-500' },
    { id: 'heart', icon: Heart, label: 'Сердце/Грудь', color: 'from-pink-500 to-red-500' },
    { id: 'head', icon: Brain, label: 'Головная боль', color: 'from-purple-500 to-indigo-500' },
    { id: 'energy', icon: Zap, label: 'Слабость/Усталость', color: 'from-yellow-500 to-orange-500' },
  ];

  // Smart suggestions based on input
  const suggestions = [
    {
      text: "Температура 36.2, головная боль с утра, усиливается при движении",
      urgency: "non_urgent",
      urgencyLabel: "Плановая",
      urgencyColor: "blue"
    },
    {
      text: "Температура 39.5°C, сильный озноб, затрудненное дыхание",
      urgency: "urgent",
      urgencyLabel: "Срочная",
      urgencyColor: "red"
    },
    {
      text: "Боль в горле, трудно глотать, кашель",
      urgency: "non_urgent",
      urgencyLabel: "Плановая",
      urgencyColor: "blue"
    },
    {
      text: "Острая боль в груди, одышка, учащенное сердцебиение",
      urgency: "urgent",
      urgencyLabel: "Срочная",
      urgencyColor: "red"
    },
    {
      text: "Боль в животе, спазмы после еды",
      urgency: "non_urgent",
      urgencyLabel: "Плановая",
      urgencyColor: "blue"
    },
  ];

  useEffect(() => {
    setCharCount(symptoms.length);
  }, [symptoms]);

  const insertExample = () => {
    const example = "Головная боль с утра (около 7 утра), пульсирующая в области висков. Температура 38.1°C, небольшой озноб. Общая слабость, трудно сконцентрироваться на работе.";
    onChange(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const insertSuggestion = (suggestionText: string) => {
    const currentText = symptoms.trim();
    const newText = currentText ? `${currentText}. ${suggestionText}` : suggestionText;
    onChange(newText);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Auto-focus textarea after category selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Mock voice recording (in real implementation, integrate with Web Speech API)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Simulate voice input after 3 seconds
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        onChange(symptoms + " (добавлено голосом: першение в горле, сухой кашель)");
      }, 3000);
    }
  };

  const getProgressColor = () => {
    if (progress < 30) return 'from-red-400 to-red-500';
    if (progress < 70) return 'from-yellow-400 to-orange-500';
    return 'from-green-400 to-emerald-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <motion.div
        className="p-4 md:p-6 space-y-4 md:space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Progress and Step */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Clock size={14} />
            Шаг 1 из 3 • ~2 минуты
          </div>
          <div className="text-gray-500">
            {charCount}/{maxChars}
          </div>
        </div>

        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Sparkles size={16} />
            </div>
            Расскажите о ваших симптомах
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            Чем подробнее вы опишете симптомы, тем лучше мы сможем подобрать подходящего специалиста. 
            Укажите когда началось, что беспокоит, интенсивность.
          </p>
        </motion.div>

        {/* Enhanced Textarea with Features */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              ref={textareaRef}
              className={`w-full h-24 md:h-32 p-4 pr-16 rounded-xl border-2 bg-white resize-none transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm md:text-base ${
                charCount < minChars 
                  ? 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100' 
                  : 'border-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-100'
              }`}
              placeholder="💬 Опишите что вас беспокоит... Например: 'Болит голова с утра, пульсирующая боль в области висков. Температура поднялась до 38°C...'"
              value={symptoms}
              maxLength={maxChars}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {/* Voice Input Button */}
            <button
              onClick={toggleRecording}
              className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={isRecording ? 'Остановить запись' : 'Голосовой ввод'}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center gap-1 text-xs whitespace-nowrap">
              {charCount >= minChars ? (
                <CheckCircle2 className="text-green-500" size={14} />
              ) : (
                <AlertCircle className="text-orange-500" size={14} />
              )}
              <span className={charCount >= minChars ? 'text-green-600' : 'text-orange-600'}>
                {charCount >= minChars ? 'Достаточно' : `Ещё ${minChars - charCount}`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Smart Suggestions */}
        <AnimatePresence>
          {showSuggestions && symptoms.length < 10 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                💡 Готовые примеры:
                <span className="text-xs text-gray-500">(
                  <span className="text-red-600">●</span> срочные,
                  <span className="text-blue-600"> ●</span> плановые
                )</span>
              </h4>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => insertSuggestion(suggestion.text)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-sm relative ${
                      suggestion.urgencyColor === 'red'
                        ? 'border-red-200 hover:border-red-300 hover:bg-red-50 text-gray-700'
                        : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <ClipboardPaste className="inline w-4 h-4 mr-2 text-gray-400" />
                        {suggestion.text}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        suggestion.urgencyColor === 'red'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {suggestion.urgencyLabel}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Help Section */}
        <AnimatePresence>
          {charCount > 0 && charCount < minChars && (
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-start gap-3">
                <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <h4 className="font-semibold text-blue-900 mb-1">Полезные советы:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Укажите когда началось (вчера вечером, 3 дня назад)</li>
                    <li>• Опишите интенсивность (слабая, умеренная, сильная боль)</li>
                    <li>• Добавьте сопутствующие симптомы</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <motion.button
            onClick={insertExample}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 transition-all text-sm"
          >
            <ClipboardPaste size={16} />
            Вставить подробный пример
          </motion.button>

          <div className="flex-1" />

          <div className="relative">
            <motion.button
              onClick={onNext}
              disabled={isNextDisabled}
              onMouseEnter={() => setShowTooltip(isNextDisabled && !loading)}
              onMouseLeave={() => setShowTooltip(false)}
              whileTap={!isNextDisabled ? { scale: 0.97 } : {}}
              whileHover={!isNextDisabled ? { scale: 1.02 } : {}}
              transition={{ type: "spring", stiffness: 300 }}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 min-w-[140px] ${
                isNextDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Анализируем...
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10"
                >
                  Опишите симптомы для продолжения
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recording Indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Идет запись...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Extended Bottom Spacing */}
      <div className="pb-8 md:pb-12"></div>
    </div>
  );
};

export default VideoConsultationStep1;