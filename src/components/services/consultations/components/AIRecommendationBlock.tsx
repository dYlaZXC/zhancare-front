"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { RecommendedDoctor, AIErrorData } from "../types/doctor";

interface AIRecommendationBlockProps {
  recommendedDoctor?: RecommendedDoctor;
  aiErrorData?: AIErrorData;
  fallbackUsed?: boolean;
}

const URGENCY_CONFIG = {
  urgent: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: '🔴 Срочно',
    sub: 'Нужна немедленная консультация',
  },
  moderate: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    label: '🟠 Желательно сегодня',
    sub: 'Обратитесь в ближайшее время',
  },
  non_urgent: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
    label: '🟢 Не срочно',
    sub: 'Плановая консультация',
  },
};

const AIRecommendationBlock: React.FC<AIRecommendationBlockProps> = ({
  recommendedDoctor,
  aiErrorData,
  fallbackUsed = false,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Split reason into clean bullet points (sentences)
  const bulletPoints = useMemo(() => {
    const text = recommendedDoctor?.reason || aiErrorData?.reason || '';
    if (!text) return [];
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }, [recommendedDoctor?.reason, aiErrorData?.reason]);

  const visiblePoints = showAll ? bulletPoints : bulletPoints.slice(0, 2);
  const hiddenCount = bulletPoints.length - 2;

  const urgency = recommendedDoctor?.urgency || 'non_urgent';
  const urgencyCfg = URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.non_urgent;

  if (!recommendedDoctor && !aiErrorData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-2xl border overflow-hidden"
        style={{ background: '#F5F8FF', borderColor: '#D8E2FF' }}
      >
        <div className="p-4 flex items-start gap-3">

          {/* AI icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #3772ff, #6366f1)' }}
          >
            <Bot className="text-white" size={18} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                AI рекомендует
              </span>
              {recommendedDoctor?.confidence && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  recommendedDoctor.confidence >= 80
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : recommendedDoctor.confidence >= 60
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  Уверен на {recommendedDoctor.confidence}%
                </span>
              )}
              {fallbackUsed && (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Назначен автоматически
                </span>
              )}
            </div>

            {recommendedDoctor && (
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-gray-900 leading-tight">{recommendedDoctor.name}</p>
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {recommendedDoctor.doctor_type}
                </span>
              </div>
            )}

            {/* Bullet reasons */}
            {visiblePoints.length > 0 && (
              <div className="space-y-1">
                {visiblePoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5 text-xs">•</span>
                    <span className="text-xs text-gray-600 leading-relaxed">{point}</span>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium mt-1 transition-colors"
                  >
                    {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showAll ? 'Свернуть' : `Подробнее (ещё ${hiddenCount})`}
                  </button>
                )}
              </div>
            )}

            {aiErrorData && !recommendedDoctor && (
              <p className="text-xs text-gray-500 italic mt-1">
                Специальность: {aiErrorData.specialty}
              </p>
            )}
          </div>

          {/* Right: urgency badge */}
          <div className="flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${urgencyCfg.bg} ${urgencyCfg.text} ${urgencyCfg.border}`}>
              {urgencyCfg.label}
            </div>
            {recommendedDoctor && (
              <p className="text-[10px] text-gray-400 mt-1 text-right leading-tight max-w-[120px]">
                {urgencyCfg.sub}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIRecommendationBlock;
