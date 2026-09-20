"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileWaveform,
  faXmark,
  faSave,
  faDownload,
  faChevronRight,
  faNotesMedical,
  faPrescriptionBottle,
  faClipboardList,
  faRobot,
  faMicrophone,
  faCircle,
  faPen,
  faEraser,
  faCheck,
  faCommentMedical,
  faHistory,
  faFlask,
  faPrescription,
  faDiagnoses,
  faFileLines
} from "@fortawesome/free-solid-svg-icons";
import DiagnosticsForm, { DiagnosticReferral } from "./forms/DiagnosticsForm";
import GenericSectionForm from "./forms/GenericSectionForm";
import AudioWaveform from "./AudioWaveform";
import { Sparkles } from "lucide-react";
import AIConsultationReview from "./AIConsultationReview";
import { Consultation, ConsultationFormSection, DiagnosticsReferralValue } from "@/types/consultation";
import { api } from "@/utils/api";
import { isInjectionAttempt, CHAT_ENDPOINT } from "@/lib/ai";

type SectionValues = Record<string, string>;

// Icon per well-known legacy section key — anything else (a clinic's custom
// section) falls back to a generic document icon (getSectionIcon below).
const SECTION_ICONS: Record<string, any> = {
  complaints: faCommentMedical,
  anamnesis: faHistory,
  diagnostics: faFlask,
  treatment: faPrescription,
  diagnosis: faDiagnoses,
  session_notes: faNotesMedical,
  prescription: faPrescriptionBottle,
  recommendations: faClipboardList,
};
const getSectionIcon = (section: ConsultationFormSection) =>
  section.type === 'diagnostics_referral' ? faFlask : (SECTION_ICONS[section.key] || faFileLines);

const formatRecordingDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface FloatingConsultationButtonProps {
  consultation: Consultation;
  onSave?: (data: Record<string, string | DiagnosticsReferralValue> & { transcription: string }) => void | Promise<void>;
  onGenerateReport?: (data: Record<string, string | DiagnosticsReferralValue>) => void;
  transcript?: string;
  isTranscribing?: boolean;
  micStream?: MediaStream | null;
  recordingDuration?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onOpenSheet?: () => void;
  hasData?: boolean;
  doctorId?: number;
  doctorClinicId?: number;
  patientId?: number;
}

const FloatingConsultationButton = React.forwardRef<{ openSheet: () => void }, FloatingConsultationButtonProps>(({
  consultation,
  onSave,
  onGenerateReport,
  transcript = '',
  isTranscribing = false,
  micStream = null,
  recordingDuration = 0,
  onStartRecording,
  onStopRecording,
  onOpenSheet,
  hasData,
  doctorId,
  doctorClinicId,
  patientId
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // The clinic's active template, fixed on this consultation at first fetch —
  // this is the entire source of truth for which tabs/sections render. No
  // fixed 8-field list any more: whatever the clinic configured is what the
  // doctor sees, in that order.
  const [templateSections, setTemplateSections] = useState<ConsultationFormSection[]>([]);
  // Text-section values only — the diagnostics_referral section's free-text
  // "comment" also lives here (keyed by its own section key), its referral
  // list lives separately in diagnosticsReferrals below.
  const [sectionValues, setSectionValues] = useState<SectionValues>({});

  const updateSection = (key: string, value: string) => {
    setSectionValues(prev => ({ ...prev, [key]: value }));
  };

  // At most one section is type="diagnostics_referral" in v1 (whatever the
  // clinic named it, or the legacy "diagnostics" fallback key).
  const diagnosticsSection = templateSections.find(s => (s.type || 'text') === 'diagnostics_referral');

  // Lifted (not local to DiagnosticsForm) so the referral chips survive
  // switching away from and back to the Диагностика tab — DiagnosticsForm
  // unmounts when activeTab changes.
  const [diagnosticsReferrals, setDiagnosticsReferrals] = useState<DiagnosticReferral[]>([]);

  // Sidebar tab tooltip — portaled to <body> so it isn't clipped by the
  // scrollable button list (overflow-y-auto forces overflow-x to clip too)
  const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; top: number; left: number } | null>(null);
  const showSidebarTooltip = (e: React.MouseEvent<HTMLButtonElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSidebarTooltip({ label, top: rect.top + rect.height / 2, left: rect.left });
  };
  const hideSidebarTooltip = () => setSidebarTooltip(null);

  // Expose openSheet method via ref
  React.useImperativeHandle(ref, () => ({
    openSheet: () => {
      setIsOpen(true);
      setActiveTab(templateSections[0]?.key ?? null);
    }
  }));

  const [showAIReview, setShowAIReview] = useState(false);

  // AI result keys are already restricted server-side to this consultation's
  // template_snapshot sections (see analyze_consultation) — merge any
  // non-empty value in, leave doctor-filled fields alone when AI returns "".
  const handleAIApply = (aiFields: Record<string, string>) => {
    setSectionValues(prev => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(aiFields)) {
        if (value && value.trim()) next[key] = value;
      }
      return next;
    });
  };

  // Loading state for data fetch
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load existing consultation data from API on mount
  useEffect(() => {
    const loadConsultationData = async () => {
      if (!consultation.meeting_id) return;

      setIsLoadingData(true);
      try {
        const { data } = await api.get(`/consultations/?meeting_id=${consultation.meeting_id}`);
        // API returns array, get first result
        const consultationData = Array.isArray(data) ? data[0] : data.results?.[0] || data;

        if (consultationData) {
          const sections: ConsultationFormSection[] = consultationData.template_snapshot?.sections || [];
          setTemplateSections(sections);

          const formData: Record<string, any> = consultationData.form_data || {};
          const diagSection = sections.find(s => (s.type || 'text') === 'diagnostics_referral');
          const textValues: SectionValues = {};
          for (const [key, value] of Object.entries(formData)) {
            if (diagSection && key === diagSection.key) continue;
            textValues[key] = typeof value === 'string' ? value : '';
          }
          if (diagSection) {
            const diagValue = formData[diagSection.key];
            if (diagValue && typeof diagValue === 'object' && Array.isArray(diagValue.referrals)) {
              textValues[diagSection.key] = diagValue.comment || '';
              setDiagnosticsReferrals(diagValue.referrals.map((r: any) => ({
                serviceId: r.service_id,
                name: r.name,
                categoryLabel: r.category_label,
                price: r.price ?? null,
                bookedAt: r.booked_at,
                appointmentId: r.appointment_id,
                originalText: r.original_text ?? null,
                source: r.source,
              })));
            } else {
              textValues[diagSection.key] = '';
              setDiagnosticsReferrals([]);
            }
          }
          setSectionValues(textValues);
        }
      } catch (error) {
        console.error('Error loading consultation data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadConsultationData();
  }, [consultation.meeting_id]);

  // AI Chat states
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatRef = useRef<HTMLDivElement>(null);

  // Send message to AI
  const handleSendAIMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");

    if (isInjectionAttempt(userMessage)) {
      setAiMessages(prev => [...prev,
        { role: 'user' as const, content: userMessage },
        { role: 'assistant' as const, content: "Я медицинский ассистент. Пожалуйста, задайте медицинский вопрос." }
      ]);
      return;
    }

    const newMessages = [...aiMessages, { role: 'user' as const, content: userMessage }];
    setAiMessages(newMessages);
    setAiLoading(true);

    try {
      const consultationContext = [
        `Пациент: ${consultation.patient_name}`,
        ...templateSections.map(s => sectionValues[s.key] ? `${s.label}: ${sectionValues[s.key]}` : ''),
      ].filter(Boolean).join('\n');

      const history = newMessages.slice(0, -1).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          language: "ru",
          context: "doctor_assistant",
          consultation_context: consultationContext,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error("Ошибка запроса к AI");
      }

      const data = await res.json();
      const aiResponse = data.text;

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

  const isSectionTab = (tab: string | null): tab is string =>
    !!tab && templateSections.some(s => s.key === tab);

  const handleClearActiveTab = () => {
    if (!isSectionTab(activeTab)) return;
    updateSection(activeTab, '');
    if (diagnosticsSection && activeTab === diagnosticsSection.key) setDiagnosticsReferrals([]);
  };

  // Converts local UI state into the wire shape: plain strings for text
  // sections, {referrals, comment} (snake_case, matching the backend) for
  // the diagnostics_referral section.
  const buildStructuredData = (): Record<string, string | DiagnosticsReferralValue> => {
    const out: Record<string, string | DiagnosticsReferralValue> = { ...sectionValues };
    if (diagnosticsSection) {
      out[diagnosticsSection.key] = {
        comment: sectionValues[diagnosticsSection.key] || '',
        referrals: diagnosticsReferrals.map(r => ({
          service_id: r.serviceId,
          name: r.name,
          category_label: r.categoryLabel,
          price: r.price ?? null,
          booked_at: r.bookedAt,
          appointment_id: r.appointmentId,
          original_text: r.originalText ?? undefined,
          source: r.source,
        })),
      };
    }
    return out;
  };

  const handleSave = () => {
    const allData = { ...buildStructuredData(), transcription: transcript || "" };
    if (onSave) {
      onSave(allData);
    }
    console.log("Saving consultation data:", allData);
  };

  // Signature state and refs
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [pendingPdfGeneration, setPendingPdfGeneration] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
    setShowSignatureModal(false);

    // If we were waiting to generate PDF, do it now
    if (pendingPdfGeneration) {
      setPendingPdfGeneration(false);
      // Small delay to ensure state is updated
      setTimeout(async () => {
        await generatePdfWithSignature(dataUrl);
      }, 100);
    }
  };

  const [pdfUploadStatus, setPdfUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  // Server renders the PDF from the record's own saved structured_data, so
  // the form must be saved (via the same onSave path the Save button uses)
  // before generate-pdf is called — otherwise the doctor would download a
  // document missing whatever they just typed. The backend also archives the
  // PDF to the patient's documents in this same request, so there's no
  // separate upload step anymore.
  const runPdfGeneration = async (signature: string) => {
    if (onGenerateReport) {
      onGenerateReport(buildStructuredData());
    }
    setPdfUploadStatus('uploading');
    try {
      if (onSave) {
        await onSave({ ...buildStructuredData(), transcription: transcript || "" });
      }

      const response = await api.post(
        `/consultations/${consultation.meeting_id}/generate-pdf/`,
        { signature },
        { responseType: 'blob' }
      );
      const blob = response.data as Blob;
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'consultation.pdf';

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename; a.click();
      URL.revokeObjectURL(blobUrl);
      setPdfUploadStatus('done');
    } catch (err) {
      setPdfUploadStatus('error');
      throw err;
    } finally {
      setTimeout(() => setPdfUploadStatus('idle'), 4000);
    }
  };

  // Generate PDF with a specific signature (used when signature is just created)
  const generatePdfWithSignature = async (signature: string) => {
    try {
      await runPdfGeneration(signature);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleGenerateReport = async () => {
    // If no signature yet, show signature modal first
    if (!signatureData) {
      setPendingPdfGeneration(true);
      setShowSignatureModal(true);
      return;
    }

    await generatePdf();
  };

  const generatePdf = async () => {
    // Only called via handleGenerateReport, which returns early until
    // signatureData is set — always non-null here.
    try {
      await runPdfGeneration(signatureData!);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const tabs = templateSections.map(section => ({
    id: section.key,
    label: section.label,
    icon: getSectionIcon(section),
    hasFilled: section.key === diagnosticsSection?.key
      ? diagnosticsReferrals.length > 0 || !!(sectionValues[section.key] && sectionValues[section.key].trim())
      : !!(sectionValues[section.key] && sectionValues[section.key].trim()),
  }));

  const activeSection = isSectionTab(activeTab) ? templateSections.find(s => s.key === activeTab) : undefined;
  const formPanelIcon = activeTab === 'ai-chat' ? faRobot : activeTab === 'transcription' ? faMicrophone : activeSection ? getSectionIcon(activeSection) : faFileWaveform;
  const formPanelTitle = activeTab === 'ai-chat' ? 'ИИ Ассистент' : activeTab === 'transcription' ? 'Транскрипция' : activeSection?.label ?? '';

  return (
    <>
      {/* Two-Panel Layout: Button Sidebar + Form Panel */}
      {isOpen && (
        <>
          {/* Button Sidebar - Always visible, narrow */}
          <div className="fixed right-0 top-0 h-full backdrop-blur-xl border-l shadow-2xl z-50 w-20 flex flex-col" style={{ backgroundColor: '#1e263e', borderColor: '#283353' }}>

            {/* Header Icon */}
            <div className="flex items-center justify-center border-b py-4" style={{ borderColor: '#283353' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3772ff' }}>
                <FontAwesomeIcon icon={faFileWaveform} className="text-xl" style={{ color: '#ebf1ff' }} />
              </div>
            </div>

            {/* Vertical Button List */}
            <div className="flex-1 flex flex-col gap-3 py-4 px-2 overflow-y-auto custom-scrollbar">
              {/* One button per section of the clinic's active template */}
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                  className="relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-all duration-200"
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
                    showSidebarTooltip(e, tab.label);
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = '#202942';
                      e.currentTarget.style.color = '#bcc0ca';
                    }
                    hideSidebarTooltip();
                  }}
                  aria-label={tab.label}
                >
                  <FontAwesomeIcon icon={tab.icon} className="text-xl" />
                  {tab.hasFilled && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  )}
                </button>
              ))}

              {/* AI Chat Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'ai-chat' ? null : 'ai-chat')}
                className="relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-all duration-200"
                style={
                  activeTab === 'ai-chat'
                    ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                    : { backgroundColor: '#202942', color: '#bcc0ca' }
                }
                onMouseEnter={(e) => {
                  if (activeTab !== 'ai-chat') {
                    e.currentTarget.style.backgroundColor = '#242e4b';
                    e.currentTarget.style.color = '#ebf1ff';
                  }
                  showSidebarTooltip(e, 'ИИ Ассистент');
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'ai-chat') {
                    e.currentTarget.style.backgroundColor = '#202942';
                    e.currentTarget.style.color = '#bcc0ca';
                  }
                  hideSidebarTooltip();
                }}
                aria-label="ИИ Ассистент"
              >
                <FontAwesomeIcon icon={faRobot} className="text-xl" />
              </button>

              {/* Transcription Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'transcription' ? null : 'transcription')}
                className="relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-all duration-200"
                style={
                  activeTab === 'transcription'
                    ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                    : { backgroundColor: '#202942', color: '#bcc0ca' }
                }
                onMouseEnter={(e) => {
                  if (activeTab !== 'transcription') {
                    e.currentTarget.style.backgroundColor = '#242e4b';
                    e.currentTarget.style.color = '#ebf1ff';
                  }
                  showSidebarTooltip(e, 'Транскрипция');
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'transcription') {
                    e.currentTarget.style.backgroundColor = '#202942';
                    e.currentTarget.style.color = '#bcc0ca';
                  }
                  hideSidebarTooltip();
                }}
                aria-label="Транскрипция"
              >
                <FontAwesomeIcon icon={faMicrophone} className="text-xl" />
                {isTranscribing && (
                  <FontAwesomeIcon icon={faCircle} className="text-[6px] text-red-500 animate-pulse absolute top-1 right-1" />
                )}
              </button>
            </div>

            {/* Close Button at Bottom */}
            <div className="border-t py-4 px-2" style={{ borderColor: '#283353' }}>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center py-3 rounded-lg transition-all duration-200"
                style={{ backgroundColor: '#dc2626', color: '#ebf1ff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  showSidebarTooltip(e, 'Закрыть');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  hideSidebarTooltip();
                }}
                aria-label="Закрыть"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>
          </div>

          {/* Sidebar tab tooltip — portaled to <body> so scroll-container overflow can't clip it */}
          {sidebarTooltip && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999] whitespace-nowrap text-sm"
              style={{
                top: sidebarTooltip.top,
                left: sidebarTooltip.left - 8,
                transform: 'translate(-100%, -50%)',
                backgroundColor: '#0f1424',
                color: '#ebf1ff'
              }}
            >
              {sidebarTooltip.label}
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                style={{ borderLeftColor: '#0f1424' }}
              ></div>
            </div>,
            document.body
          )}

          {/* Form Panel - Opens next to sidebar when button is clicked */}
          {activeTab && (
            <div
              className="fixed right-20 top-0 h-full backdrop-blur-xl border-l shadow-2xl z-40 w-full sm:w-[800px] lg:w-[1000px] flex flex-col transition-all duration-300"
              style={{ backgroundColor: '#1e263e', borderColor: '#283353' }}
            >
              {/* Form Panel Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#283353', borderColor: '#2956bf' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                    <FontAwesomeIcon
                      icon={formPanelIcon}
                      className="text-lg"
                      style={{ color: '#ebf1ff' }}
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg" style={{ color: '#ebf1ff' }}>
                      {formPanelTitle}
                    </h2>
                    <p className="text-xs" style={{ color: '#bcc0ca' }}>{consultation.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSectionTab(activeTab) && (
                    <button
                      onClick={handleClearActiveTab}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ backgroundColor: '#202942', color: '#bcc0ca' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; e.currentTarget.style.color = '#ebf1ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#202942'; e.currentTarget.style.color = '#bcc0ca'; }}
                      title="Очистить эту секцию"
                    >
                      <FontAwesomeIcon icon={faEraser} className="text-xs" />
                      Очистить
                    </button>
                  )}
                  <button
                    onClick={() => setShowAIReview(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "linear-gradient(135deg, #2956bf, #3772ff)", color: "#ebf1ff" }}
                    title="ИИ заполнит все поля автоматически"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ИИ Анализ
                  </button>
                  <button
                    onClick={() => setActiveTab(null)}
                    className="w-9 h-9 rounded-lg transition-all flex items-center justify-center"
                    style={{ backgroundColor: '#202942', color: '#ebf1ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242e4b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202942'}
                    title="Закрыть форму"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Form Panel Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeSection && activeSection.key === diagnosticsSection?.key && (
                  <DiagnosticsForm
                    comment={sectionValues[activeSection.key] || ''}
                    onCommentChange={(value) => updateSection(activeSection.key, value)}
                    clinicId={doctorClinicId}
                    patientId={patientId}
                    doctorId={doctorId}
                    consultationId={consultation.id}
                    referrals={diagnosticsReferrals}
                    onReferralsChange={setDiagnosticsReferrals}
                  />
                )}

                {activeSection && activeSection.key !== diagnosticsSection?.key && (
                  <GenericSectionForm
                    sectionKey={activeSection.key}
                    value={sectionValues[activeSection.key] || ''}
                    onChange={(value) => updateSection(activeSection.key, value)}
                    placeholder={activeSection.placeholder}
                  />
                )}

                {/* AI Chat Tab */}
                {activeTab === 'ai-chat' && (
                  <div className="backdrop-blur-sm rounded-xl p-4 border h-full flex flex-col" style={{ backgroundColor: '#202942', borderColor: '#283353' }}>
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
                      <div className="flex gap-2 items-end flex-shrink-0">
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
                      {isTranscribing && (
                        <div className="flex justify-end mb-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: '#1e263e' }}>
                            <FontAwesomeIcon icon={faCircle} className="text-[6px] text-red-500 animate-pulse" />
                            <span className="text-xs font-medium tabular-nums" style={{ color: '#ef4444' }}>
                              {formatRecordingDuration(recordingDuration)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recording Control Button */}
                      <div className="mb-3 flex-shrink-0">
                        <button
                          onClick={isTranscribing ? onStopRecording : onStartRecording}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                            isTranscribing
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          style={{ color: '#ebf1ff' }}
                        >
                          <FontAwesomeIcon icon={isTranscribing ? faCircle : faMicrophone} className="text-base" />
                          <span>{isTranscribing ? 'Остановить запись' : 'Начать запись'}</span>
                        </button>
                      </div>

                      {/* Live mic level — animates with the actual audio input while recording */}
                      {isTranscribing && (
                        <div className="mb-3 rounded-lg border overflow-hidden px-2 flex-shrink-0" style={{ backgroundColor: '#1e263e', borderColor: '#283353' }}>
                          <AudioWaveform stream={micStream} active={isTranscribing} barColor="#10b981" />
                        </div>
                      )}

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
                      <div className="mt-3 p-2 rounded-lg flex items-start gap-2 text-xs flex-shrink-0" style={{ backgroundColor: '#1e263e', color: '#bcc0ca' }}>
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Транскрипция работает на базе Deepgram AI. Определяет голоса врача и пациента.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                {/* Signature indicator */}
                {signatureData && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <FontAwesomeIcon icon={faCheck} className="text-xs text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-medium">Подпись добавлена</span>
                    <button onClick={() => setSignatureData(null)} className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors">Удалить</button>
                  </div>
                )}
                {/* PDF upload status */}
                {pdfUploadStatus !== 'idle' && (
                  <div
                    className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-xs font-medium"
                    style={
                      pdfUploadStatus === 'uploading' ? { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' } :
                      pdfUploadStatus === 'done'      ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' } :
                                                        { background: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.25)',  color: '#fca5a5' }
                    }
                  >
                    {pdfUploadStatus === 'uploading' && <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />Отправка документа пациенту...</>}
                    {pdfUploadStatus === 'done'      && <><FontAwesomeIcon icon={faCheck} className="flex-shrink-0" />Документ отправлен в карту пациента</>}
                    {pdfUploadStatus === 'error'     && <>Ошибка отправки — документ сохранён локально</>}
                  </div>
                )}
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="w-12 flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105"
                    style={{ backgroundColor: signatureData ? '#16a34a' : '#374151', color: '#ebf1ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = signatureData ? '#15803d' : '#4b5563'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = signatureData ? '#16a34a' : '#374151'}
                    title="Подпись врача"
                  >
                    <FontAwesomeIcon icon={faPen} className="text-sm" />
                  </button>

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
            </div>
          )}
        </>
      )}

      {/* AI Consultation Review Modal */}
      {showAIReview && (
        <AIConsultationReview
          sourceType="consultation"
          sourceId={consultation.id}
          templateSections={templateSections}
          patientName={consultation.patient_name}
          initialDescription={transcript ?? ""}
          onApply={handleAIApply}
          onClose={() => setShowAIReview(false)}
        />
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" style={{ backgroundColor: '#1e263e' }}>
            {/* Modal Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ backgroundColor: '#283353', borderColor: '#2956bf' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2956bf' }}>
                  <FontAwesomeIcon icon={faPen} className="text-lg" style={{ color: '#ebf1ff' }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#ebf1ff' }}>Подпись врача</h3>
                  <p className="text-xs" style={{ color: '#bcc0ca' }}>Нарисуйте вашу подпись</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="w-9 h-9 rounded-lg transition-all flex items-center justify-center"
                style={{ backgroundColor: '#202942', color: '#ebf1ff' }}
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="p-5">
              <div className="rounded-xl overflow-hidden border-2 border-dashed" style={{ borderColor: '#3772ff', backgroundColor: '#fff' }}>
                <canvas
                  ref={signatureCanvasRef}
                  width={350}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-center text-xs mt-2" style={{ color: '#bcc0ca' }}>
                Используйте мышь или палец для рисования подписи
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: '#283353' }}>
              <button
                onClick={clearSignature}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#374151', color: '#ebf1ff' }}
              >
                <FontAwesomeIcon icon={faEraser} className="text-sm" />
                <span>Очистить</span>
              </button>
              <button
                onClick={saveSignature}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#16a34a', color: '#ebf1ff' }}
              >
                <FontAwesomeIcon icon={faCheck} className="text-sm" />
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
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
      `}</style>
    </>
  );
});

FloatingConsultationButton.displayName = 'FloatingConsultationButton';

export default FloatingConsultationButton;
