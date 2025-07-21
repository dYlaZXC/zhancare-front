"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, ClipboardPaste } from "lucide-react";

interface RecommendedDoctor {
  id: number;
  name: string;
  doctor_type: string;
  reason: string;
}

interface AIErrorData {
  specialty: string;
  reason: string;
  raw: string;
}

interface Props {
  step: number;
  onInsertExample?: () => void;
  recommendedDoctor?: RecommendedDoctor;
  aiErrorData?: AIErrorData;
  fallbackUsed?: boolean;
}

const TipsPanel: React.FC<Props> = ({
  step,
  onInsertExample,
  recommendedDoctor,
  aiErrorData,
  fallbackUsed,
}) => {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [aiTypingText, setAiTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);

  const closePopup = () => setPopupVisible(false);
  const openPopup = () => setPopupVisible(true);

  const getFullAnalysisText = (): string => {
    if (step === 2) {
      if (fallbackUsed && recommendedDoctor && aiErrorData) {
        return `AI не нашёл врача по направлению «${aiErrorData.specialty}», поэтому предложен врач: ${recommendedDoctor.name} (${recommendedDoctor.doctor_type}).
Причина: ${recommendedDoctor.reason}

Пояснение: ${aiErrorData.reason}`;
      } else if (recommendedDoctor) {
        return `AI рекомендовал врача: ${recommendedDoctor.name} (${recommendedDoctor.doctor_type}).
Пояснение: ${recommendedDoctor.reason}`;
      } else if (aiErrorData) {
        return `AI порекомендовал направление «${aiErrorData.specialty}», но подходящий врач не найден.
Пояснение: ${aiErrorData.reason}`;
      }
    }

    if (step === 1) {
      return "Анализируем введённые симптомы...";
    }

    if (step === 3) {
      return "Готовим безопасное соединение с врачом...";
    }

    return "";
  };

  useEffect(() => {
    if (step >= 1 && step <= 3) {
      setPopupVisible(true);
    }
  }, [step]);

  // Typing animation for full response
  useEffect(() => {
    const fullText = getFullAnalysisText();
    setTypingIndex(0);
    setAiTypingText("");

    if (!fullText) return;

    const interval = setInterval(() => {
      setTypingIndex((prev) => {
        if (prev >= fullText.length) {
          clearInterval(interval);
          return prev;
        }
        setAiTypingText(fullText.slice(0, prev + 1));
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [step, recommendedDoctor, aiErrorData, fallbackUsed]);

  const getTipsContent = () => {
    if (step === 1) {
      return (
        <>
          <p>
            Укажите как можно больше деталей о симптомах. Это поможет AI подобрать лучшего врача.
          </p>
          <p className="text-xs text-gray-500 italic">
            Пример: У меня температура 38.5, слабость, боль в горле уже третий день.
          </p>
          {onInsertExample && (
            <button
              onClick={onInsertExample}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ClipboardPaste size={16} />
              Вставить пример
            </button>
          )}
        </>
      );
    }

    if (step === 2) {
      return (
        <p>
          AI анализирует симптомы и предлагает врача на их основе. <br />
          <span className="text-xs text-gray-500">
            При необходимости вы можете выбрать другого специалиста.
          </span>
        </p>
      );
    }

    if (step === 3) {
      return (
        <p>
          Проверяем подключение к выбранному врачу. Обычно ожидание не превышает 1–2 минут.
        </p>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Popup */}
      <AnimatePresence>
        {isPopupVisible && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-11/12 max-w-md p-6 rounded-xl shadow-lg space-y-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-gray-800 font-semibold text-base">
                <Bot className="text-blue-600" size={20} />
                🤖 Помощь AI
              </div>
              <div className="text-sm text-gray-700 space-y-3">{getTipsContent()}</div>
              {step === 2 && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs text-gray-600 whitespace-pre-line">
                  {aiTypingText}
                </div>
              )}
              <button
                className="text-blue-600 hover:underline text-sm mt-2"
                onClick={closePopup}
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Panel */}
      <div className="hidden lg:block w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 text-sm text-gray-700 sticky top-6 space-y-5">
        <div className="flex items-center gap-2 font-semibold text-gray-800 text-base">
          <Bot className="text-blue-600" size={20} />
          Помощь AI
        </div>

        <div>{getTipsContent()}</div>

        <hr className="border-gray-200" />

        {step === 2 && (
          <div className="flex items-start gap-2 text-gray-500 text-sm whitespace-pre-line">
            <Loader2 className="animate-spin text-blue-500 mt-1" size={16} />
            <span className="font-mono">{aiTypingText || "Анализ..."}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default TipsPanel;
