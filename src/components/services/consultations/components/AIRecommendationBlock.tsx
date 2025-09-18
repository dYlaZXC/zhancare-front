"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import clsx from "clsx";
import type { RecommendedDoctor, AIErrorData } from "../types/doctor";

interface AIRecommendationBlockProps {
  recommendedDoctor?: RecommendedDoctor;
  aiErrorData?: AIErrorData;
  fallbackUsed?: boolean;
}

const AIRecommendationBlock: React.FC<AIRecommendationBlockProps> = ({
  recommendedDoctor,
  aiErrorData,
  fallbackUsed = false,
}) => {
  const showAIBlock = recommendedDoctor || aiErrorData;

  // Format AI reasoning text with proper paragraphs and structure
  const formatAIReasoning = (text: string): Array<{type: 'warning' | 'recommendation' | 'text', content: string}> => {
    if (!text) return [];

    const sentences = text.split(/\.(?=\s+[А-Я])/);
    const paragraphs: Array<{type: 'warning' | 'recommendation' | 'text', content: string}> = [];
    let currentParagraph = "";

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      currentParagraph += (currentParagraph ? '. ' : '') + trimmed;

      const shouldBreak = (
        /рекомендуется|следует|необходимо|важно|можете|попробуйте/i.test(trimmed) ||
        /указывает|свидетельствует|характерно|типично|проявляется/i.test(trimmed) ||
        currentParagraph.split('.').length >= 3 ||
        /немедленно|срочно|опасно|внимание/i.test(sentences[index + 1] || "")
      );

      if (shouldBreak || index === sentences.length - 1) {
        if (currentParagraph.trim()) {
          if (/немедленно|срочно|опасно|внимание|вызовите скорую/i.test(currentParagraph)) {
            paragraphs.push({
              type: 'warning',
              content: currentParagraph.trim() + '.'
            });
          } else if (/рекомендуется|следует|можете попробовать|советуем/i.test(currentParagraph)) {
            paragraphs.push({
              type: 'recommendation',
              content: currentParagraph.trim() + '.'
            });
          } else {
            paragraphs.push({
              type: 'text',
              content: currentParagraph.trim() + '.'
            });
          }
        }
        currentParagraph = "";
      }
    });

    return paragraphs;
  };

  const getUrgencyIndicator = (urgency: string) => {
    const urgencyConfig = {
      urgent: {
        color: "bg-red-500",
        icon: AlertCircle,
        text: "Срочно",
        description: "Немедленная консультация"
      },
      non_urgent: {
        color: "bg-green-500",
        icon: CheckCircle2,
        text: "Не срочно",
        description: "Плановая консультация"
      },
      moderate: {
        color: "bg-yellow-500",
        icon: Clock,
        text: "Умеренно",
        description: "В ближайшее время"
      }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.non_urgent;
    const Icon = config.icon;

    return (
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 ${config.color} text-white px-2.5 py-1 rounded-full text-xs font-medium`}>
          <Icon size={10} />
          {config.text}
        </div>
        <span className="text-xs text-gray-500">{config.description}</span>
      </div>
    );
  };

  if (!showAIBlock) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={clsx(
          "rounded-xl border-2 overflow-hidden",
          fallbackUsed
            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
            : recommendedDoctor
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
            : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "p-2 rounded-lg flex-shrink-0",
              fallbackUsed ? "bg-yellow-500" : recommendedDoctor ? "bg-blue-500" : "bg-red-500"
            )}>
              <Bot className="text-white" size={16} />
            </div>
            <div className="min-w-0">
              <h4 className={clsx(
                "font-bold text-base",
                fallbackUsed ? "text-yellow-800" : recommendedDoctor ? "text-blue-800" : "text-red-800"
              )}>
                Рекомендация ИИ
              </h4>
              <p className={clsx(
                "text-xs",
                fallbackUsed ? "text-yellow-600" : recommendedDoctor ? "text-blue-600" : "text-red-600"
              )}>
                {fallbackUsed ? "Назначен доступный врач" : "На основе ваших симптомов"}
              </p>
            </div>
          </div>
        </div>

        {recommendedDoctor && (
          <div className="px-4 pb-4">
            {/* Doctor info */}
            <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {recommendedDoctor?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-0.5">
                    {fallbackUsed ? "📋 Назначен" : "✨ Рекомендуется"}
                  </p>
                  <h5 className="font-bold text-gray-900 text-sm leading-tight">{recommendedDoctor?.name || 'Не указано'}</h5>
                  <p className="text-blue-600 font-semibold text-xs">{recommendedDoctor?.doctor_type || 'Специальность не указана'}</p>
                </div>
                {recommendedDoctor?.confidence && (
                  <div className="text-center flex-shrink-0">
                    <div className={clsx(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs",
                      recommendedDoctor.confidence >= 80 ? "bg-green-500" :
                      recommendedDoctor.confidence >= 60 ? "bg-yellow-500" : "bg-orange-500"
                    )}>
                      {recommendedDoctor?.confidence}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation details */}
            <div className="space-y-4">
              <div>
                <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  💭 Медицинское обоснование
                </h6>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400 space-y-3">
                  {formatAIReasoning(recommendedDoctor?.reason || '').map((block, index) => {
                    if (block.type === 'warning') {
                      return (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-800 text-sm font-medium flex items-start gap-2 leading-relaxed">
                            <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                            <span>{block.content}</span>
                          </p>
                        </div>
                      );
                    }

                    if (block.type === 'recommendation') {
                      return (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-blue-800 text-sm leading-relaxed flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">💡</span>
                            <span>{block.content}</span>
                          </p>
                        </div>
                      );
                    }

                    return (
                      <p key={index} className="text-gray-700 text-sm leading-relaxed">
                        {block.content}
                      </p>
                    );
                  })}
                </div>
              </div>

              {recommendedDoctor?.urgency && (
                <div>
                  <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    ⚡ Уровень срочности
                  </h6>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    {getUrgencyIndicator(recommendedDoctor?.urgency || 'non_urgent')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AIRecommendationBlock;