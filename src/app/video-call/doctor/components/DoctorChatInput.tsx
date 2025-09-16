"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faPrescriptionBottle,
  faStethoscope,
  faMicrophone,
  faPaperclip,
  faKeyboard,
  faPills,
  faFlask,
  faTemperatureHigh,
  faHeartbeat,
  faNotesMedical
} from "@fortawesome/free-solid-svg-icons";

interface DoctorChatInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  sendMessage: () => void;
  loading: boolean;
  t: any;
  prescriptionMode: boolean;
  setPrescriptionMode: (mode: boolean) => void;
}

const DoctorChatInput: React.FC<DoctorChatInputProps> = ({
  userInput,
  setUserInput,
  sendMessage,
  loading,
  t,
  prescriptionMode,
  setPrescriptionMode
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickMedicalQuestions = [
    {
      icon: faStethoscope,
      text: "Какие симптомы указывают на...",
      category: "Диагностика"
    },
    {
      icon: faPrescriptionBottle,
      text: "Рекомендуемая дозировка препарата...",
      category: "Лечение"
    },
    {
      icon: faFlask,
      text: "Какие анализы необходимо назначить при...",
      category: "Анализы"
    },
    {
      icon: faHeartbeat,
      text: "Дифференциальная диагностика при...",
      category: "Диагностика"
    },
    {
      icon: faPills,
      text: "Побочные эффекты препарата...",
      category: "Препараты"
    },
    {
      icon: faTemperatureHigh,
      text: "Протокол лечения при высокой температуре",
      category: "Неотложка"
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
      {/* Mode Toggle */}
      <div className="px-6 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrescriptionMode(!prescriptionMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                prescriptionMode
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-emerald-600 text-white border-2 border-emerald-400'
              }`}
            >
              <FontAwesomeIcon
                icon={prescriptionMode ? faPrescriptionBottle : faStethoscope}
                className="text-lg"
              />
              {prescriptionMode ? 'Режим препаратов' : 'Режим диагностики'}
            </button>

            <div className="h-6 w-px bg-white/20"></div>

            <span className="text-white/70 text-sm">
              {prescriptionMode ? 'Вопросы о лекарствах и дозировках' : 'Медицинские консультации'}
            </span>
          </div>

          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-2 px-3 py-2 text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <FontAwesomeIcon icon={faKeyboard} />
            <span className="text-sm">Быстрые вопросы</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-900/20 to-teal-900/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickMedicalQuestions.map((item, index) => (
              <button
                key={index}
                onClick={() => insertQuickQuestion(item.text)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-left border border-white/10 hover:border-emerald-400/30 group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-600/20 group-hover:bg-emerald-600/30 transition-colors">
                  <FontAwesomeIcon icon={item.icon} className="text-emerald-300" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium mb-1">{item.text}</p>
                  <p className="text-emerald-300 text-xs">{item.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-6">
        <div className="relative">
          {/* Textarea */}
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                prescriptionMode
                  ? "Спросите о препаратах, дозировках или взаимодействиях..."
                  : "Задайте медицинский вопрос или опишите симптомы пациента..."
              }
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 pr-32 text-white placeholder-white/50 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all duration-300 resize-none backdrop-blur-sm"
              rows={3}
              disabled={loading}
            />

            {/* Character Counter */}
            <div className="absolute bottom-2 left-4 text-xs text-white/40">
              {userInput.length}/500
            </div>

            {/* Input Controls */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {/* Voice Input Button */}
              <button
                disabled={loading}
                className="w-8 h-8 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 flex items-center justify-center transition-all duration-300 text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                title="Голосовой ввод"
              >
                <FontAwesomeIcon icon={faMicrophone} className="text-sm" />
              </button>

              {/* Attachment Button */}
              <button
                disabled={loading}
                className="w-8 h-8 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 flex items-center justify-center transition-all duration-300 text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                title="Прикрепить файл"
              >
                <FontAwesomeIcon icon={faPaperclip} className="text-sm" />
              </button>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={loading || !userInput.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 font-medium shadow-lg border-2 ${
                  loading || !userInput.trim()
                    ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                    : prescriptionMode
                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-400 text-white hover:shadow-blue-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400 text-white hover:shadow-emerald-500/20'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                )}
              </button>
            </div>
          </div>

          {/* Medical Context Indicators */}
          {userInput.trim() && (
            <div className="mt-3 flex flex-wrap gap-2">
              {prescriptionMode && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-xs border border-blue-400/30">
                  <FontAwesomeIcon icon={faPills} />
                  Режим препаратов
                </span>
              )}

              {userInput.toLowerCase().includes('температура') && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-300 rounded-lg text-xs border border-red-400/30">
                  <FontAwesomeIcon icon={faTemperatureHigh} />
                  Температура
                </span>
              )}

              {(userInput.toLowerCase().includes('боль') || userInput.toLowerCase().includes('болит')) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600/20 text-orange-300 rounded-lg text-xs border border-orange-400/30">
                  <FontAwesomeIcon icon={faHeartbeat} />
                  Болевой синдром
                </span>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">
            {prescriptionMode
              ? '🧬 ИИ поможет с информацией о препаратах и их взаимодействии'
              : '🩺 Медицинский ИИ готов помочь с диагностикой и рекомендациями'
            }
          </p>
        </div>
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/5 pointer-events-none rounded-b-2xl"></div>
    </div>
  );
};

export default DoctorChatInput;