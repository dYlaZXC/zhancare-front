"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faRobot,
  faHeart,
  faHandHoldingMedical,
  faQuestionCircle,
  faInfoCircle,
  faLightbulb,
  faHeartbeat,
  faFirstAid
} from "@fortawesome/free-solid-svg-icons";

interface PatientChatBoxProps {
  messages: { user: string; response: string }[];
  loading: boolean;
  error: string;
  chatBoxRef: React.RefObject<HTMLDivElement>;
  t: any;
}

const PatientChatBox: React.FC<PatientChatBoxProps> = ({
  messages,
  loading,
  error,
  chatBoxRef,
  t
}) => {
  const formatPatientResponse = (text: string): string => {
    return text.replace(/\n/g, "<br/>");
  };

  const getResponseIcon = (text: string) => {
    if (text.toLowerCase().includes('симптом') || text.toLowerCase().includes('боль')) {
      return faHeartbeat;
    } else if (text.toLowerCase().includes('лечение') || text.toLowerCase().includes('помощь')) {
      return faFirstAid;
    } else if (text.toLowerCase().includes('важно') || text.toLowerCase().includes('внимание')) {
      return faInfoCircle;
    } else if (text.toLowerCase().includes('совет') || text.toLowerCase().includes('рекомендация')) {
      return faLightbulb;
    }
    return faHandHoldingMedical;
  };

  return (
    <div
      ref={chatBoxRef}
      className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-2 sm:py-3 md:py-4 space-y-2 sm:space-y-3 md:space-y-4 custom-scrollbar min-h-0 w-full max-w-full"
    >
      {messages.length === 0 && !loading && (
        <div className="text-center py-6 sm:py-8 md:py-10 lg:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4"
               style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
            <FontAwesomeIcon
              icon={faHandHoldingMedical}
              className="text-blue-300 text-base sm:text-lg md:text-xl lg:text-2xl"
            />
          </div>
          <p className="text-white/70 text-xs sm:text-sm md:text-base mb-1 sm:mb-2">
            Помощник пациента готов к работе
          </p>
          <p className="text-white/50 text-xs sm:text-sm">
            Задавайте вопросы о здоровье, симптомах или лечении
          </p>
        </div>
      )}

      {messages.map((msg, index) => (
        <div key={index} className="space-y-2 sm:space-y-3 w-full">
          {/* Patient's Question */}
          <div className="flex justify-end w-full">
            <div className="max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] relative group min-w-0 w-full">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl rounded-tr-sm sm:rounded-tr-md md:rounded-tr-lg shadow-lg border border-blue-400/30">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <FontAwesomeIcon icon={faUser} className="text-blue-200 mt-0.5 sm:mt-1 flex-shrink-0 text-xs sm:text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-100 mb-0.5 sm:mb-1">Пациент</p>
                    <p className="text-xs sm:text-sm md:text-base text-white leading-relaxed break-words overflow-wrap-anywhere hyphens-auto">{msg.user}</p>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-white/40 mt-1 text-right px-1">
                {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Glass effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-xl md:rounded-2xl rounded-tr-sm sm:rounded-tr-md md:rounded-tr-lg pointer-events-none"></div>
            </div>
          </div>

          {/* AI Response */}
          {msg.response && (
            <div className="flex justify-start w-full">
              <div className="max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] relative group min-w-0 w-full">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl rounded-tl-sm sm:rounded-tl-md md:rounded-tl-lg shadow-lg border border-blue-400/20">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
                      <FontAwesomeIcon
                        icon={getResponseIcon(msg.response)}
                        className="text-blue-300 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <p className="text-xs sm:text-sm font-medium text-blue-300">Помощник пациента</p>
                        <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full text-xs border border-blue-400/30 w-fit">
                          <FontAwesomeIcon icon={faHeart} className="mr-1" />
                          Здоровье
                        </span>
                      </div>
                      <div
                        className="text-white/90 leading-relaxed prose prose-sm prose-invert break-words overflow-wrap-anywhere hyphens-auto text-xs sm:text-sm md:text-base"
                        dangerouslySetInnerHTML={{
                          __html: formatPatientResponse(msg.response)
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-white/40 mt-1 px-1">
                  {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Glass effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-l from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-xl md:rounded-2xl rounded-tl-sm sm:rounded-tl-md md:rounded-tl-lg pointer-events-none"></div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Responsive Loading State */}
      {loading && (
        <div className="flex justify-start w-full">
          <div className="max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl rounded-tl-sm sm:rounded-tl-md md:rounded-tl-lg shadow-lg border border-blue-400/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg flex items-center justify-center animate-pulse"
                     style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
                  <FontAwesomeIcon icon={faHeartbeat} className="text-blue-300 text-xs sm:text-sm animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-300 mb-1 sm:mb-2">Помощник анализирует...</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-white/70 text-xs sm:text-sm">
                      Готовлю информацию о здоровье...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Error State */}
      {error && (
        <div className="flex justify-center w-full px-4">
          <div className="bg-red-600/20 border border-red-400/30 text-red-300 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center max-w-xs sm:max-w-sm md:max-w-md w-full">
            <FontAwesomeIcon icon={faQuestionCircle} className="text-lg sm:text-xl md:text-2xl mb-2 text-red-400" />
            <p className="font-medium text-sm sm:text-base">Ошибка помощника</p>
            <p className="text-xs sm:text-sm text-red-200 mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 114, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(55, 114, 255, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(55, 114, 255, 0.7);
        }
        .prose p {
          margin: 0.25rem 0;
          word-wrap: break-word;
          overflow-wrap: anywhere;
          hyphens: auto;
        }
        @media (min-width: 640px) {
          .prose p {
            margin: 0.5rem 0;
          }
        }
        .prose strong {
          color: rgb(96 165 250);
          font-weight: 600;
        }
        .prose {
          max-width: none;
        }
        .prose div {
          margin: 0.25rem 0;
        }
        @media (min-width: 640px) {
          .prose div {
            margin: 0.5rem 0;
          }
        }
        .prose span {
          display: inline-block;
        }
        
        /* Better text wrapping for very small screens */
        @media (max-width: 480px) {
          .prose p,
          .prose div {
            word-break: break-word;
            overflow-wrap: anywhere;
            hyphens: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientChatBox;