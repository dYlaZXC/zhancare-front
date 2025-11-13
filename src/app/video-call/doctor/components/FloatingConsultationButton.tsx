"use client";

import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileWaveform,
  faXmark,
  faSave,
  faDownload,
  faChevronLeft,
  faChevronRight,
  faNotesMedical,
  faPrescriptionBottle,
  faClipboardList,
  faRobot,
  faMicrophone,
  faCircle
} from "@fortawesome/free-solid-svg-icons";
import ConsultationForm, { ConsultationFormData } from "./ConsultationForm";
import { Consultation } from "@/types/consultation";

interface FloatingConsultationButtonProps {
  consultation: Consultation;
  onSave?: (data: ConsultationFormData & {
    sessionNotes: string;
    prescription: string;
    recommendations: string;
  }) => void;
  onGenerateReport?: (data: ConsultationFormData & {
    sessionNotes: string;
    prescription: string;
    recommendations: string;
  }) => void;
  transcript?: string;
  isTranscribing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

const FloatingConsultationButton: React.FC<FloatingConsultationButtonProps> = ({
  consultation,
  onSave,
  onGenerateReport,
  transcript = '',
  isTranscribing = false,
  onStartRecording,
  onStopRecording
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultation' | 'notes' | 'prescription' | 'recommendations' | 'ai-chat' | 'transcription'>('consultation');

  const [consultationFormData, setConsultationFormData] = useState<ConsultationFormData>({
    complaints: '',
    anamnesis: '',
    diagnostics: '',
    treatment: '',
    diagnosis: ''
  });

  // Additional notes sections
  const [sessionNotes, setSessionNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [recommendations, setRecommendations] = useState("");

  // AI Chat states
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatRef = useRef<HTMLDivElement>(null);

  // Mistral AI configuration
  const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
  const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

  // Send message to AI
  const handleSendAIMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");

    // Add user message to chat
    const newMessages = [...aiMessages, { role: 'user' as const, content: userMessage }];
    setAiMessages(newMessages);
    setAiLoading(true);

    try {
      // Build context from consultation data
      const contextMessage = `Вы медицинский ассистент врача. Вот текущая информация о консультации:
Пациент: ${consultation.patient_name}
${consultationFormData.complaints ? `Жалобы: ${consultationFormData.complaints}` : ''}
${consultationFormData.anamnesis ? `Анамнез: ${consultationFormData.anamnesis}` : ''}
${consultationFormData.diagnostics ? `Диагностика: ${consultationFormData.diagnostics}` : ''}
${consultationFormData.treatment ? `Лечение: ${consultationFormData.treatment}` : ''}
${consultationFormData.diagnosis ? `Диагноз: ${consultationFormData.diagnosis}` : ''}

Предоставляйте профессиональные медицинские советы и помогайте врачу в консультации.`;

      const payload = {
        model: "open-mistral-nemo",
        temperature: 0.3,
        top_p: 1,
        max_tokens: 500,
        messages: [
          { role: "system", content: contextMessage },
          ...newMessages.map(msg => ({ role: msg.role, content: msg.content }))
        ],
      };

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Ошибка запроса к AI");
      }

      const data = await res.json();
      const aiResponse = data.choices[0].message.content;

      // Add AI response to chat
      setAiMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setAiMessages([...newMessages, { role: 'assistant', content: "Извините, произошла ошибка при получении ответа. Попробуйте еще раз." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Enter key press
  const handleAIKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAIMessage();
    }
  };

  // Auto-resize textarea
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const handleAIInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setAiInput(textarea.value);

    // First, set height to 'auto' to shrink and get accurate scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, 44), 200);

    // Set the new height
    textarea.style.height = `${newHeight}px`;
  };

  // Set initial height and reset when input is cleared
  useEffect(() => {
    if (aiInputRef.current) {
      if (aiInput === '') {
        aiInputRef.current.style.height = '44px';
      }
    }
  }, [aiInput]);

  // Set initial height on mount
  useEffect(() => {
    if (aiInputRef.current) {
      aiInputRef.current.style.height = '44px';
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (aiChatRef.current) {
      aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
    }
  }, [aiMessages, aiLoading]);

  const handleFormUpdate = (field: keyof ConsultationFormData, value: string) => {
    setConsultationFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const allData = {
      ...consultationFormData,
      sessionNotes,
      prescription,
      recommendations
    };
    if (onSave) {
      onSave(allData);
    }
    console.log("Saving consultation data:", allData);
  };

  const handleGenerateReport = () => {
    const allData = {
      ...consultationFormData,
      sessionNotes,
      prescription,
      recommendations
    };
    if (onGenerateReport) {
      onGenerateReport(allData);
    }
    console.log("Generating report with data:", allData);
  };

  // Check if any field has content
  const hasContent = Object.values(consultationFormData).some(value => value.trim() !== '') ||
                     sessionNotes.trim() !== '' ||
                     prescription.trim() !== '' ||
                     recommendations.trim() !== '';

  // Check content for each tab
  const hasConsultationContent = Object.values(consultationFormData).some(value => value.trim() !== '');
  const hasNotesContent = sessionNotes.trim() !== '';
  const hasPrescriptionContent = prescription.trim() !== '';
  const hasRecommendationsContent = recommendations.trim() !== '';

  const tabs = [
    {
      id: 'consultation' as const,
      label: 'Консультационный лист',
      icon: faFileWaveform,
      hasFilled: hasConsultationContent
    },
    {
      id: 'notes' as const,
      label: 'Заметки',
      icon: faNotesMedical,
      hasFilled: hasNotesContent
    },
    {
      id: 'prescription' as const,
      label: 'Рецепт',
      icon: faPrescriptionBottle,
      hasFilled: hasPrescriptionContent
    },
    {
      id: 'recommendations' as const,
      label: 'Рекомендации',
      icon: faClipboardList,
      hasFilled: hasRecommendationsContent
    }
  ];

  return (
    <>
      {/* Floating Button - только когда форма закрыта */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-24 z-50 group"
          title="Открыть консультационный лист"
        >
          <div className="relative">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" style={{ backgroundColor: '#3772ff' }}></div>

            {/* Button */}
            <div className="relative flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#3772ff' }}>
              <FontAwesomeIcon icon={faFileWaveform} className="text-xl" style={{ color: '#ebf1ff' }} />
              <span className="font-bold text-sm" style={{ color: '#ebf1ff' }}>Консультационный лист</span>
            </div>

            {/* Badge if has content */}
            {hasContent && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-lg" style={{ backgroundColor: '#2956bf', borderColor: '#1e263e' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#ebf1ff' }}>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </button>
      )}

      {/* Sidebar Panel */}
      {isOpen && (
        <>
          {/* Sidebar - No backdrop so doctor can see patient video */}
          <div className={`fixed right-0 top-0 h-full backdrop-blur-xl border-l shadow-2xl z-50 transition-all duration-300 ${
            isMinimized ? 'w-16' : 'w-full sm:w-[500px]'
          }`} style={{ backgroundColor: '#1e263e', borderColor: '#283353' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ backgroundColor: '#283353', borderColor: '#2956bf' }}>
              {!isMinimized && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                    <FontAwesomeIcon icon={faFileWaveform} className="text-lg" style={{ color: '#ebf1ff' }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg" style={{ color: '#ebf1ff' }}>Консультационный лист</h2>
                    <p className="text-xs" style={{ color: '#bcc0ca' }}>{consultation.patient_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isMinimized ? (
                  /* Only Uncollapse button when minimized */
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="w-9 h-9 rounded-lg transition-all flex items-center justify-center"
                    style={{ backgroundColor: '#202942', color: '#ebf1ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242e4b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202942'}
                    title="Развернуть"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                  </button>
                ) : (
                  <>
                    {/* Minimize button */}
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="w-9 h-9 rounded-lg transition-all flex items-center justify-center"
                      style={{ backgroundColor: '#202942', color: '#ebf1ff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242e4b'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202942'}
                      title="Свернуть"
                    >
                      <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                    </button>

                    {/* Close button */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-9 h-9 rounded-lg transition-all flex items-center justify-center"
                      style={{ backgroundColor: '#2c5bcc', color: '#ebf1ff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3267e6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c5bcc'}
                      title="Закрыть"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="flex flex-col h-[calc(100%-160px)] overflow-hidden">
                {/* Tabs Navigation Grid 2x2 + AI Chat Button */}
                <div className="px-4 pt-4 pb-3 border-b space-y-2" style={{ borderColor: '#283353' }}>
                  {/* 4 Main Tabs in 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-200"
                        style={
                          activeTab === tab.id
                            ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                            : { backgroundColor: '#202942', color: '#bcc0ca' }
                        }
                        onMouseEnter={(e) => {
                          if (activeTab !== tab.id) {
                            e.currentTarget.style.backgroundColor = '#242e4b';
                            e.currentTarget.style.color = '#ebf1ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== tab.id) {
                            e.currentTarget.style.backgroundColor = '#202942';
                            e.currentTarget.style.color = '#bcc0ca';
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={tab.icon} className="text-base" />
                        <span className="text-center leading-tight text-[11px]">{tab.label}</span>
                        {tab.hasFilled && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2" style={{ backgroundColor: '#3772ff', borderColor: '#1e263e' }}></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* AI Chat Button - Full Width */}
                  <button
                    onClick={() => setActiveTab('ai-chat')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200"
                    style={
                      activeTab === 'ai-chat'
                        ? { backgroundColor: '#2956bf', color: '#ebf1ff' }
                        : { backgroundColor: '#202942', color: '#bcc0ca' }
                    }
                    onMouseEnter={(e) => {
                      if (activeTab !== 'ai-chat') {
                        e.currentTarget.style.backgroundColor = '#242e4b';
                        e.currentTarget.style.color = '#ebf1ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'ai-chat') {
                        e.currentTarget.style.backgroundColor = '#202942';
                        e.currentTarget.style.color = '#bcc0ca';
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faRobot} className="text-base" />
                    <span>Чат с ИИ</span>
                  </button>

                  {/* Transcription Button - Full Width */}
                  <button
                    onClick={() => setActiveTab('transcription')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 relative"
                    style={
                      activeTab === 'transcription'
                        ? { backgroundColor: '#16a34a', color: '#ebf1ff' }
                        : { backgroundColor: '#202942', color: '#bcc0ca' }
                    }
                    onMouseEnter={(e) => {
                      if (activeTab !== 'transcription') {
                        e.currentTarget.style.backgroundColor = '#242e4b';
                        e.currentTarget.style.color = '#ebf1ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'transcription') {
                        e.currentTarget.style.backgroundColor = '#202942';
                        e.currentTarget.style.color = '#bcc0ca';
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faMicrophone} className="text-base" />
                    <span>Транскрипция</span>
                    {isTranscribing && (
                      <FontAwesomeIcon icon={faCircle} className="text-[6px] text-red-500 animate-pulse absolute top-2 right-2" />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {/* Consultation Form Tab */}
                  {activeTab === 'consultation' && (
                    <div className="h-full">
                      <ConsultationForm
                        formData={consultationFormData}
                        onUpdate={handleFormUpdate}
                      />
                    </div>
                  )}

                  {/* Session Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className="backdrop-blur-sm rounded-xl p-4 border h-full flex flex-col" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                          <FontAwesomeIcon icon={faNotesMedical} className="text-sm" style={{ color: '#ebf1ff' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>Заметки консультации</h3>
                          <p className="text-xs" style={{ color: '#bcc0ca' }}>Дополнительные записи о ходе консультации</p>
                        </div>
                      </div>
                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Записывайте важные моменты консультации, симптомы пациента..."
                        className="flex-1 w-full border rounded-lg px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: '#1e263e',
                          borderColor: '#283353',
                          color: '#ebf1ff',
                          caretColor: '#3772ff'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3772ff';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#283353';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Prescription Tab */}
                  {activeTab === 'prescription' && (
                    <div className="backdrop-blur-sm rounded-xl p-4 border h-full flex flex-col" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                          <FontAwesomeIcon icon={faPrescriptionBottle} className="text-sm" style={{ color: '#ebf1ff' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>Рецепт</h3>
                          <p className="text-xs" style={{ color: '#bcc0ca' }}>Назначенные препараты и дозировки</p>
                        </div>
                      </div>
                      <textarea
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Например: Парацетамол 500мг - по 1 таблетке 3 раза в день..."
                        className="flex-1 w-full border rounded-lg px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: '#1e263e',
                          borderColor: '#283353',
                          color: '#ebf1ff',
                          caretColor: '#3772ff'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3772ff';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#283353';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Recommendations Tab */}
                  {activeTab === 'recommendations' && (
                    <div className="backdrop-blur-sm rounded-xl p-4 border h-full flex flex-col" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                          <FontAwesomeIcon icon={faClipboardList} className="text-sm" style={{ color: '#ebf1ff' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>Рекомендации</h3>
                          <p className="text-xs" style={{ color: '#bcc0ca' }}>Общие рекомендации и назначения</p>
                        </div>
                      </div>
                      <textarea
                        value={recommendations}
                        onChange={(e) => setRecommendations(e.target.value)}
                        placeholder="Рекомендации по режиму, диете, дополнительным обследованиям..."
                        className="flex-1 w-full border rounded-lg px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: '#1e263e',
                          borderColor: '#283353',
                          color: '#ebf1ff',
                          caretColor: '#3772ff'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3772ff';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#283353';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* AI Chat Tab */}
                  {activeTab === 'ai-chat' && (
                    <div className="backdrop-blur-sm rounded-xl p-4 border h-full flex flex-col" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                          <FontAwesomeIcon icon={faRobot} className="text-sm" style={{ color: '#ebf1ff' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>ИИ Ассистент</h3>
                          <p className="text-xs" style={{ color: '#bcc0ca' }}>Медицинский помощник на базе ИИ</p>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div ref={aiChatRef} className="flex-1 overflow-y-auto space-y-3 mb-3 custom-scrollbar">
                        {aiMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-sm">
                            <div className="text-center space-y-2">
                              <FontAwesomeIcon icon={faRobot} className="text-4xl mb-4" style={{ color: '#2956bf' }} />
                              <p style={{ color: '#bcc0ca' }}>Задайте вопрос ИИ ассистенту</p>
                              <p className="text-xs" style={{ color: '#bcc0ca' }}>Он знает всю информацию о текущей консультации</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {aiMessages.map((msg, index) => (
                              <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
                                  style={
                                    msg.role === 'user'
                                      ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                                      : { backgroundColor: '#1e263e', color: '#ebf1ff' }
                                  }
                                >
                                  <div className="whitespace-pre-wrap break-words">
                                    {msg.content.split('\n').map((line, i) => {
                                      // Check if line is a bullet point or numbered list
                                      const isBullet = line.trim().match(/^[-•*]\s/);
                                      const isNumbered = line.trim().match(/^\d+\.\s/);
                                      const isHeader = line.trim().match(/^#{1,3}\s/) || line.trim().match(/^[А-ЯA-Z][^.!?]*:$/);

                                      if (isHeader) {
                                        return (
                                          <div key={i} className="font-semibold mt-2 mb-1" style={{ color: '#ebf1ff' }}>
                                            {line.replace(/^#+\s/, '')}
                                          </div>
                                        );
                                      } else if (isBullet || isNumbered) {
                                        return (
                                          <div key={i} className="ml-2 my-0.5">
                                            {line}
                                          </div>
                                        );
                                      } else if (line.trim() === '') {
                                        return <div key={i} className="h-2"></div>;
                                      } else {
                                        return (
                                          <div key={i}>
                                            {line}
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {aiLoading && (
                              <div className="flex justify-start">
                                <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#1e263e', color: '#ebf1ff' }}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#3772ff' }}></div>
                                    <div className="w-2 h-2 rounded-full animate-bounce delay-75" style={{ backgroundColor: '#3772ff' }}></div>
                                    <div className="w-2 h-2 rounded-full animate-bounce delay-150" style={{ backgroundColor: '#3772ff' }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="flex gap-2 items-end">
                        <textarea
                          ref={aiInputRef}
                          value={aiInput}
                          onChange={handleAIInputChange}
                          onKeyPress={handleAIKeyPress}
                          placeholder="Спросите ИИ ассистента..."
                          className="flex-1 border rounded-lg px-3 py-2 text-sm transition-all resize-none focus:outline-none focus:ring-2 overflow-hidden"
                          style={{
                            backgroundColor: '#1e263e',
                            borderColor: '#283353',
                            color: '#ebf1ff',
                            caretColor: '#3772ff',
                            minHeight: '44px',
                            maxHeight: '200px'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3772ff';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#283353';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          disabled={aiLoading}
                        />
                        <button
                          onClick={handleSendAIMessage}
                          disabled={!aiInput.trim() || aiLoading}
                          className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: !aiInput.trim() || aiLoading ? '#283353' : '#3772ff',
                            color: '#ebf1ff'
                          }}
                          onMouseEnter={(e) => {
                            if (aiInput.trim() && !aiLoading) {
                              e.currentTarget.style.backgroundColor = '#3267e6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (aiInput.trim() && !aiLoading) {
                              e.currentTarget.style.backgroundColor = '#3772ff';
                            }
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Transcription Tab */}
                  {activeTab === 'transcription' && (
                    <div className="backdrop-blur-sm rounded-xl p-4 border h-full flex flex-col" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
                            <FontAwesomeIcon icon={faMicrophone} className="text-sm" style={{ color: '#ebf1ff' }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>Транскрипция консультации</h3>
                            <p className="text-xs" style={{ color: '#bcc0ca' }}>
                              {isTranscribing ? 'Запись активна...' : 'Начните запись для транскрипции'}
                            </p>
                          </div>
                        </div>
                        {isTranscribing && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: '#1e263e' }}>
                            <FontAwesomeIcon icon={faCircle} className="text-[6px] text-red-500 animate-pulse" />
                            <span className="text-xs font-medium" style={{ color: '#ef4444' }}>REC</span>
                          </div>
                        )}
                      </div>

                      {/* Recording Control Button */}
                      <div className="mb-3">
                        <button
                          onClick={isTranscribing ? onStopRecording : onStartRecording}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                            isTranscribing
                              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          style={{ color: '#ebf1ff' }}
                        >
                          <FontAwesomeIcon icon={isTranscribing ? faCircle : faMicrophone} className="text-base" />
                          <span>{isTranscribing ? 'Остановить запись' : 'Начать запись'}</span>
                        </button>
                      </div>

                      {/* Transcription Content */}
                      <div className="flex-1 overflow-y-auto rounded-lg border p-4 custom-scrollbar" style={{ backgroundColor: '#1e263e', borderColor: '#283353' }}>
                        {transcript ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#ebf1ff' }}>
                            {transcript}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-center">
                            <div className="space-y-3">
                              <FontAwesomeIcon icon={faMicrophone} className="text-4xl mb-4" style={{ color: isTranscribing ? '#16a34a' : '#2956bf' }} />
                              <p className="text-sm" style={{ color: '#bcc0ca' }}>
                                {isTranscribing
                                  ? 'Слушаем... Говорите в микрофон'
                                  : 'Транскрипция появится здесь после начала записи'}
                              </p>
                              {isTranscribing && (
                                <p className="text-xs" style={{ color: '#bcc0ca' }}>
                                  Речь распознается автоматически
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Footer */}
                      <div className="mt-3 p-2 rounded-lg flex items-start gap-2 text-xs" style={{ backgroundColor: '#1e263e', color: '#bcc0ca' }}>
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Транскрипция работает на базе Deepgram AI. Определяет голоса врача и пациента.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Actions - Fixed at Bottom */}
            {!isMinimized && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t" style={{ backgroundColor: '#181732', borderColor: '#283353' }}>
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105"
                    style={{ backgroundColor: '#3772ff', color: '#ebf1ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3267e6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3772ff'}
                  >
                    <FontAwesomeIcon icon={faSave} className="text-sm" />
                    <span>Сохранить</span>
                  </button>

                  <button
                    onClick={handleGenerateReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105"
                    style={{ backgroundColor: '#2956bf', color: '#ebf1ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#214499'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2956bf'}
                  >
                    <FontAwesomeIcon icon={faDownload} className="text-sm" />
                    <span>Отчет</span>
                  </button>
                </div>
              </div>
            )}

            {/* Minimized state - show vertical text */}
            {isMinimized && (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="transform -rotate-90 whitespace-nowrap">
                  <span className="font-semibold text-sm" style={{ color: '#ebf1ff' }}>Консультационный лист</span>
                </div>
                {hasContent && (
                  <div className="mt-8 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#3772ff' }}></div>
                )}
              </div>
            )}

            {/* Custom Scrollbar */}
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #1e263e;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #3772ff;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #3267e6;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingConsultationButton;
