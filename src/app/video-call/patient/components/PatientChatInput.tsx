"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faHandHoldingMedical,
  faQuestionCircle,
  faMicrophone,
  faPaperclip,
  faKeyboard,
  faHeartbeat,
  faThermometerHalf,
  faHeadSideCough,
  faBandAid,
  faPills,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";

interface PatientChatInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  sendMessage: () => void;
  loading: boolean;
  t: any;
}

const PatientChatInput: React.FC<PatientChatInputProps> = ({
  userInput,
  setUserInput,
  sendMessage,
  loading,
  t
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickHealthQuestions = [
    {
      icon: faThermometerHalf,
      text: "У меня температура и болит голова",
      category: "Симптомы"
    },
    {
      icon: faHeadSideCough,
      text: "Кашель и боль в горле",
      category: "Простуда"
    },
    {
      icon: faHeartbeat,
      text: "Что означают мои результаты анализов?",
      category: "Анализы"
    },
    {
      icon: faBandAid,
      text: "Как правильно обработать рану?",
      category: "Первая помощь"
    },
    {
      icon: faPills,
      text: "Можно ли принимать это лекарство?",
      category: "Лекарства"
    },
    {
      icon: faInfoCircle,
      text: "Когда нужно обратиться к врачу?",
      category: "Консультация"
    }
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertQuickQuestion = (question: string) => {
    setUserInput(question);
    setShowQuickActions(false);
  };

  return (
    <div className="relative border-t border-white/10 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm">
      {/* Responsive Info Banner */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-b border-white/10 bg-blue-600/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faHandHoldingMedical} className="text-blue-300 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-300 text-xs sm:text-sm font-medium">Помощник пациента</p>
            <p className="text-white/70 text-xs hidden sm:block">Получите поддержку и общую информацию о здоровье</p>
          </div>

          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 text-blue-300 hover:text-blue-200 transition-colors"
          >
            <FontAwesomeIcon icon={faKeyboard} className="text-sm" />
            <span className="text-xs sm:text-sm hidden sm:inline">Быстрые вопросы</span>
            <span className="text-xs sm:hidden">Вопросы</span>
          </button>
        </div>
      </div>

      {/* Responsive Quick Actions Panel */}
      {showQuickActions && (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
            {quickHealthQuestions.map((item, index) => (
              <button
                key={index}
                onClick={() => insertQuickQuestion(item.text)}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-left border border-white/10 hover:border-blue-400/30 group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors flex-shrink-0">
                  <FontAwesomeIcon icon={item.icon} className="text-blue-300 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs sm:text-sm font-medium mb-1 line-clamp-2">{item.text}</p>
                  <p className="text-blue-300 text-xs">{item.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Main Input Area */}
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="relative">
          {/* Responsive Textarea */}
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Опишите ваши симптомы или задайте вопрос о здоровье..."
              className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 pr-24 sm:pr-32 text-sm sm:text-base text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 resize-none backdrop-blur-sm"
              rows={2}
              disabled={loading}
            />

            {/* Character Counter */}
            <div className="absolute bottom-2 left-3 sm:left-4 text-xs text-white/40">
              {userInput.length}/500
            </div>

            {/* Responsive Input Controls */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 sm:gap-2">
              {/* Voice Input Button */}
              <button
                disabled={loading}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 flex items-center justify-center transition-all duration-300 text-blue-300 hover:text-blue-200 disabled:opacity-50"
                title="Голосовой ввод"
              >
                <FontAwesomeIcon icon={faMicrophone} className="text-xs sm:text-sm" />
              </button>

              {/* Attachment Button - Hidden on mobile */}
              <button
                disabled={loading}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 items-center justify-center transition-all duration-300 text-blue-300 hover:text-blue-200 disabled:opacity-50 hidden sm:flex"
                title="Прикрепить файл"
              >
                <FontAwesomeIcon icon={faPaperclip} className="text-xs sm:text-sm" />
              </button>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={loading || !userInput.trim()}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 font-medium shadow-lg border-2 ${
                  loading || !userInput.trim()
                    ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 border-blue-400 text-white hover:shadow-blue-500/20'
                }`}
              >
                {loading ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} className="text-xs sm:text-sm" />
                )}
              </button>
            </div>
          </div>

          {/* Responsive Health Context Indicators */}
          {userInput.trim() && (
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
              {userInput.toLowerCase().includes('температура') && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-300 rounded-md sm:rounded-lg text-xs border border-red-400/30">
                  <FontAwesomeIcon icon={faThermometerHalf} className="text-xs" />
                  <span className="hidden sm:inline">Температура</span>
                  <span className="sm:hidden">Темп.</span>
                </span>
              )}

              {(userInput.toLowerCase().includes('боль') || userInput.toLowerCase().includes('болит')) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600/20 text-orange-300 rounded-md sm:rounded-lg text-xs border border-orange-400/30">
                  <FontAwesomeIcon icon={faHeartbeat} className="text-xs" />
                  <span className="hidden sm:inline">Болевые ощущения</span>
                  <span className="sm:hidden">Боль</span>
                </span>
              )}

              {(userInput.toLowerCase().includes('кашель') || userInput.toLowerCase().includes('горло')) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded-md sm:rounded-lg text-xs border border-yellow-400/30">
                  <FontAwesomeIcon icon={faHeadSideCough} className="text-xs" />
                  <span className="hidden sm:inline">Респираторные симптомы</span>
                  <span className="sm:hidden">Респ.</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Responsive Help Text */}
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-white/40 text-xs">
            💙 Расскажите о ваших симптомах - мы поможем с общей информацией о здоровье
          </p>
          <p className="text-white/30 text-xs mt-1">
            ⚠️ Это не замена профессиональной медицинской консультации
          </p>
        </div>
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/5 pointer-events-none rounded-b-2xl"></div>
    </div>
  );
};

export default PatientChatInput;