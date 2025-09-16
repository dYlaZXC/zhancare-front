"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStethoscope,
  faPrescriptionBottle,
  faHeartbeat,
  faUserMd,
  faNotesMedical,
  faFlask,
  faPills,
  faThermometerHalf
} from "@fortawesome/free-solid-svg-icons";

interface DoctorChatBoxProps {
  messages: { user: string; response: string }[];
  loading: boolean;
  error: string;
  chatBoxRef: React.RefObject<HTMLDivElement>;
  t: any;
  prescriptionMode: boolean;
}

const DoctorChatBox: React.FC<DoctorChatBoxProps> = ({
  messages,
  loading,
  error,
  chatBoxRef,
  t,
  prescriptionMode
}) => {
  const formatMedicalResponse = (text: string): string => {
    return text.replace(/\n/g, "<br/>");
  };

  const getMedicalIcon = (text: string) => {
    if (text.toLowerCase().includes('препарат') || text.toLowerCase().includes('лекарство')) {
      return faPrescriptionBottle;
    } else if (text.toLowerCase().includes('диагноз') || text.toLowerCase().includes('болезнь')) {
      return faStethoscope;
    } else if (text.toLowerCase().includes('симптом') || text.toLowerCase().includes('жалоба')) {
      return faHeartbeat;
    } else if (text.toLowerCase().includes('анализ') || text.toLowerCase().includes('тест')) {
      return faFlask;
    } else if (text.toLowerCase().includes('температура')) {
      return faThermometerHalf;
    }
    return faNotesMedical;
  };

  return (
    <div
      ref={chatBoxRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar min-h-0"
    >
      {messages.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
            <FontAwesomeIcon
              icon={prescriptionMode ? faPrescriptionBottle : faStethoscope}
              className="text-emerald-300 text-2xl"
            />
          </div>
          <p className="text-white/70 text-sm mb-2">
            {prescriptionMode ? 'Режим назначений активен' : 'Медицинский ИИ-ассистент готов к работе'}
          </p>
          <p className="text-white/50 text-xs">
            {prescriptionMode
              ? 'Задавайте вопросы о препаратах и дозировках'
              : 'Задавайте вопросы о симптомах, диагностике и лечении'
            }
          </p>
        </div>
      )}

      {messages.map((msg, index) => (
        <div key={index} className="space-y-3">
          {/* Doctor's Question */}
          <div className="flex justify-end">
            <div className="max-w-[80%] relative group min-w-0">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl rounded-tr-lg shadow-lg border border-emerald-400/30">
                <div className="flex items-start gap-3 min-w-0">
                  <FontAwesomeIcon icon={faUserMd} className="text-emerald-200 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-emerald-100 mb-1">Врач</p>
                    <p className="text-white leading-relaxed break-words overflow-wrap-anywhere">{msg.user}</p>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-white/40 mt-1 text-right">
                {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Glass effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl rounded-tr-lg pointer-events-none"></div>
            </div>
          </div>

          {/* AI Response */}
          {msg.response && (
            <div className="flex justify-start">
              <div className="max-w-[80%] relative group min-w-0">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 rounded-2xl rounded-tl-lg shadow-lg border border-emerald-400/20">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                      <FontAwesomeIcon
                        icon={getMedicalIcon(msg.response)}
                        className="text-emerald-300 text-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium text-emerald-300">ИИ-Ассистент</p>
                        {prescriptionMode && (
                          <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full text-xs border border-blue-400/30">
                            <FontAwesomeIcon icon={faPills} className="mr-1" />
                            Препараты
                          </span>
                        )}
                      </div>
                      <div
                        className="text-white/90 leading-relaxed prose prose-sm prose-invert break-words overflow-wrap-anywhere"
                        dangerouslySetInnerHTML={{
                          __html: formatMedicalResponse(msg.response)
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-white/40 mt-1">
                  {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Glass effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-l from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl rounded-tl-lg pointer-events-none"></div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-start">
          <div className="max-w-[80%]">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 rounded-2xl rounded-tl-lg shadow-lg border border-emerald-400/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
                     style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                  <FontAwesomeIcon icon={faHeartbeat} className="text-emerald-300 text-sm animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-300 mb-2">ИИ-Ассистент анализирует...</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-white/70 text-sm">
                      {prescriptionMode ? 'Подбираю препараты...' : 'Формирую медицинскую рекомендацию...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex justify-center">
          <div className="bg-red-600/20 border border-red-400/30 text-red-300 p-4 rounded-xl text-center max-w-md">
            <FontAwesomeIcon icon={faHeartbeat} className="text-2xl mb-2 text-red-400" />
            <p className="font-medium">Ошибка медицинского ассистента</p>
            <p className="text-sm text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
        .prose p {
          margin: 0.5rem 0;
          word-wrap: break-word;
          overflow-wrap: anywhere;
        }
        .prose strong {
          color: rgb(52 211 153);
          font-weight: 600;
        }
        .prose {
          max-width: none;
        }
        .prose div {
          margin: 0.5rem 0;
        }
        .prose span {
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default DoctorChatBox;