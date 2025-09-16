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
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar min-h-0"
    >
      {messages.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
            <FontAwesomeIcon
              icon={faHandHoldingMedical}
              className="text-blue-300 text-2xl"
            />
          </div>
          <p className="text-white/70 text-sm mb-2">
            Помощник пациента готов к работе
          </p>
          <p className="text-white/50 text-xs">
            Задавайте вопросы о здоровье, симптомах или лечении
          </p>
        </div>
      )}

      {messages.map((msg, index) => (
        <div key={index} className="space-y-3">
          {/* Patient's Question */}
          <div className="flex justify-end">
            <div className="max-w-[80%] relative group min-w-0">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-lg shadow-lg border border-blue-400/30">
                <div className="flex items-start gap-3 min-w-0">
                  <FontAwesomeIcon icon={faUser} className="text-blue-200 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue-100 mb-1">Пациент</p>
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
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 rounded-2xl rounded-tl-lg shadow-lg border border-blue-400/20">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
                      <FontAwesomeIcon
                        icon={getResponseIcon(msg.response)}
                        className="text-blue-300 text-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium text-blue-300">Помощник пациента</p>
                        <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full text-xs border border-blue-400/30">
                          <FontAwesomeIcon icon={faHeart} className="mr-1" />
                          Здоровье
                        </span>
                      </div>
                      <div
                        className="text-white/90 leading-relaxed prose prose-sm prose-invert break-words overflow-wrap-anywhere"
                        dangerouslySetInnerHTML={{
                          __html: formatPatientResponse(msg.response)
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
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 rounded-2xl rounded-tl-lg shadow-lg border border-blue-400/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
                     style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
                  <FontAwesomeIcon icon={faHeartbeat} className="text-blue-300 text-sm animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300 mb-2">Помощник анализирует...</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-white/70 text-sm">
                      Готовлю информацию о здоровье...
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
            <FontAwesomeIcon icon={faQuestionCircle} className="text-2xl mb-2 text-red-400" />
            <p className="font-medium">Ошибка помощника</p>
            <p className="text-sm text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
          margin: 0.5rem 0;
          word-wrap: break-word;
          overflow-wrap: anywhere;
        }
        .prose strong {
          color: rgb(96 165 250);
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

export default PatientChatBox;