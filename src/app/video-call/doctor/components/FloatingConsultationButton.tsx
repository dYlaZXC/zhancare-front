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
  faCircle,
  faPen,
  faEraser,
  faCheck,
  faCommentMedical,
  faHistory,
  faFlask,
  faPrescription,
  faDiagnoses
} from "@fortawesome/free-solid-svg-icons";
import ConsultationForm, { ConsultationFormData } from "./ConsultationForm";
import PatientComplaintsForm from "./forms/PatientComplaintsForm";
import AnamnesisForm from "./forms/AnamnesisForm";
import DiagnosticsForm from "./forms/DiagnosticsForm";
import TreatmentRecommendationsForm from "./forms/TreatmentRecommendationsForm";
import DiagnosisForm from "./forms/DiagnosisForm";
import { Consultation } from "@/types/consultation";
import { api } from "@/utils/api";
import { isInjectionAttempt, CHAT_ENDPOINT } from "@/lib/ai";

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
  onOpenSheet?: () => void;
  hasData?: boolean;
}

const FloatingConsultationButton = React.forwardRef<{ openSheet: () => void }, FloatingConsultationButtonProps>(({
  consultation,
  onSave,
  onGenerateReport,
  transcript = '',
  isTranscribing = false,
  onStartRecording,
  onStopRecording,
  onOpenSheet,
  hasData
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'complaints' | 'anamnesis' | 'diagnostics' | 'treatment' | 'diagnosis' | 'notes' | 'prescription' | 'recommendations' | 'ai-chat' | 'transcription' | null>(null);

  // Expose openSheet method via ref
  React.useImperativeHandle(ref, () => ({
    openSheet: () => {
      setIsOpen(true);
      setActiveTab('complaints'); // Open with complaints tab by default
    }
  }));

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

  // Loading state for data fetch
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load existing consultation data from API on mount
  useEffect(() => {
    const loadConsultationData = async () => {
      if (!consultation.meeting_id) return;

      setIsLoadingData(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/consultations/?meeting_id=${consultation.meeting_id}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // API returns array, get first result
          const consultationData = Array.isArray(data) ? data[0] : data.results?.[0] || data;

          if (consultationData) {
            // Populate form fields from API data
            setConsultationFormData({
              complaints: consultationData.complaints || '',
              anamnesis: consultationData.anamnesis || '',
              diagnostics: consultationData.diagnostics || '',
              treatment: consultationData.treatment || '',
              diagnosis: consultationData.diagnosis || ''
            });

            // Populate additional fields
            if (consultationData.session_notes) {
              setSessionNotes(consultationData.session_notes);
            }
            if (consultationData.prescription) {
              setPrescription(consultationData.prescription);
            }
            if (consultationData.recommendations) {
              setRecommendations(consultationData.recommendations);
            }
          }
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
        consultationFormData.complaints ? `Жалобы: ${consultationFormData.complaints}` : '',
        consultationFormData.anamnesis ? `Анамнез: ${consultationFormData.anamnesis}` : '',
        consultationFormData.diagnostics ? `Диагностика: ${consultationFormData.diagnostics}` : '',
        consultationFormData.treatment ? `Лечение: ${consultationFormData.treatment}` : '',
        consultationFormData.diagnosis ? `Диагноз: ${consultationFormData.diagnosis}` : '',
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
      recommendations,
      transcription: transcript || ""
    };
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

  // Generate PDF with a specific signature (used when signature is just created)
  const generatePdfWithSignature = async (signature: string) => {
    const allData = {
      ...consultationFormData,
      sessionNotes,
      prescription,
      recommendations
    };
    if (onGenerateReport) {
      onGenerateReport(allData);
    }

    // Dynamic import of html2pdf.js (client-side only)
    const html2pdf = (await import('html2pdf.js')).default;

    // Generate PDF report
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = currentDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Doctor name
    const doctorName = consultation.doctor_first_name
      ? `${consultation.doctor_first_name} ${consultation.doctor_last_name || ''}`.trim()
      : 'Врач';

    // Create HTML content for PDF with Times New Roman font
    const pdfContent = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 30px 40px; max-width: 800px; margin: 0 auto; color: #000; font-size: 14px; line-height: 1.5;">
        <!-- Header with logo -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1e3a5f;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/logosaas_new2.png" alt="ZhanCare Logo" style="height: 45px; width: auto;" />
          </div>
          <div style="text-align: right; font-size: 12px; color: #333;">
            <p style="margin: 0;">Дата: <strong>${formattedDate}</strong></p>
            <p style="margin: 3px 0 0;">Время: <strong>${formattedTime}</strong></p>
          </div>
        </div>

        <!-- Title -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin: 0; font-size: 18px; color: #000; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Консультационный лист</h2>
          <p style="margin: 5px 0 0; font-size: 12px; color: #555;">Медицинское заключение</p>
        </div>

        <!-- Patient & Doctor Info -->
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 10px; border: 1px solid #ccc; background: #f8f9fa;">
              <strong style="font-size: 12px; color: #1e3a5f;">ПАЦИЕНТ:</strong><br/>
              <span style="font-size: 14px;">${consultation.patient_name}</span>
            </td>
            <td style="width: 50%; padding: 10px; border: 1px solid #ccc; background: #f8f9fa;">
              <strong style="font-size: 12px; color: #1e3a5f;">ЛЕЧАЩИЙ ВРАЧ:</strong><br/>
              <span style="font-size: 14px;">${doctorName}</span>
            </td>
          </tr>
        </table>

        <!-- Consultation sections -->
        ${consultationFormData.complaints ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Жалобы пациента</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.complaints}</p>
        </div>
        ` : ''}

        ${consultationFormData.anamnesis ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Анамнез заболевания</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.anamnesis}</p>
        </div>
        ` : ''}

        ${consultationFormData.diagnostics ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Обследование и диагностика</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.diagnostics}</p>
        </div>
        ` : ''}

        ${consultationFormData.diagnosis ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid; background: #f0f7ff; padding: 12px; border-left: 3px solid #1e3a5f;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase;">Диагноз</h3>
          <p style="margin: 0; font-size: 14px; color: #000; font-weight: bold; white-space: pre-wrap;">${consultationFormData.diagnosis}</p>
        </div>
        ` : ''}

        ${consultationFormData.treatment ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Назначенное лечение</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.treatment}</p>
        </div>
        ` : ''}

        ${prescription ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid; background: #fff8e6; padding: 12px; border: 1px dashed #d4a000;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #8b6914; font-weight: bold; text-transform: uppercase;">Рецепт</h3>
          <p style="margin: 0; font-size: 14px; color: #000; white-space: pre-wrap;">${prescription}</p>
        </div>
        ` : ''}

        ${recommendations ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Рекомендации</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${recommendations}</p>
        </div>
        ` : ''}

        ${sessionNotes ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #666; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Примечания</h3>
          <p style="margin: 0; font-size: 13px; color: #555; font-style: italic; text-align: justify; white-space: pre-wrap;">${sessionNotes}</p>
        </div>
        ` : ''}

        <!-- Footer with signature -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; vertical-align: bottom; padding: 10px 0;">
                <p style="margin: 0; font-size: 11px; color: #777;">Документ сформирован: ${formattedDate} ${formattedTime}</p>
                <p style="margin: 3px 0 0; font-size: 11px; color: #777;">© ZhanCare ${currentDate.getFullYear()}</p>
              </td>
              <td style="width: 50%; text-align: right; vertical-align: bottom; padding: 10px 0;">
                <div style="display: inline-block; text-align: left;">
                  <p style="margin: 0 0 5px; font-size: 12px; color: #333;">Лечащий врач: <strong>${doctorName}</strong></p>
                  <img src="${signature}" style="height: 50px; width: auto; margin: 5px 0;" alt="Подпись врача" />
                  <p style="margin: 5px 0 0; font-size: 11px; color: #555;">Подпись / М.П.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = pdfContent;
    document.body.appendChild(container);

    // Generate PDF
    const opt = {
      margin: 10,
      filename: `consultation_${(consultation.patient_name ?? 'patient').replace(/\s+/g, '_')}_${formattedDate.replace(/\./g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    const pdfFilename = opt.filename;
    try {
      const pdfBlob: Blob = await html2pdf().set(opt).from(container).output('blob');
      // Save locally
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = globalThis.document.createElement('a');
      a.href = blobUrl; a.download = pdfFilename; a.click();
      URL.revokeObjectURL(blobUrl);
      // Upload to patient's documents
      await uploadPdfToPatient(pdfBlob, pdfFilename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(container);
    }
  };

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadStatus, setPdfUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const uploadPdfToPatient = async (blob: Blob, filename: string) => {
    setUploadingPdf(true);
    setPdfUploadStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('file', new File([blob], filename, { type: 'application/pdf' }));
      formData.append('consultation_id', String(consultation.id));
      formData.append('description', `Консультационный лист — ${consultation.patient_name}`);

      await api.post('/medical-documents/doctor-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPdfUploadStatus('done');
    } catch (err) {
      console.error('Upload error:', err);
      setPdfUploadStatus('error');
    } finally {
      setUploadingPdf(false);
      setTimeout(() => setPdfUploadStatus('idle'), 4000);
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
    const allData = {
      ...consultationFormData,
      sessionNotes,
      prescription,
      recommendations
    };
    if (onGenerateReport) {
      onGenerateReport(allData);
    }

    // Dynamic import of html2pdf.js (client-side only)
    const html2pdf = (await import('html2pdf.js')).default;

    // Generate PDF report
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = currentDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Doctor name
    const doctorName = consultation.doctor_first_name
      ? `${consultation.doctor_first_name} ${consultation.doctor_last_name || ''}`.trim()
      : 'Врач';

    // Create HTML content for PDF with Times New Roman font
    const pdfContent = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 30px 40px; max-width: 800px; margin: 0 auto; color: #000; font-size: 14px; line-height: 1.5;">
        <!-- Header with logo -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1e3a5f;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/logosaas_new2.png" alt="ZhanCare Logo" style="height: 45px; width: auto;" />
          </div>
          <div style="text-align: right; font-size: 12px; color: #333;">
            <p style="margin: 0;">Дата: <strong>${formattedDate}</strong></p>
            <p style="margin: 3px 0 0;">Время: <strong>${formattedTime}</strong></p>
          </div>
        </div>

        <!-- Title -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin: 0; font-size: 18px; color: #000; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Консультационный лист</h2>
          <p style="margin: 5px 0 0; font-size: 12px; color: #555;">Медицинское заключение</p>
        </div>

        <!-- Patient & Doctor Info -->
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 10px; border: 1px solid #ccc; background: #f8f9fa;">
              <strong style="font-size: 12px; color: #1e3a5f;">ПАЦИЕНТ:</strong><br/>
              <span style="font-size: 14px;">${consultation.patient_name}</span>
            </td>
            <td style="width: 50%; padding: 10px; border: 1px solid #ccc; background: #f8f9fa;">
              <strong style="font-size: 12px; color: #1e3a5f;">ЛЕЧАЩИЙ ВРАЧ:</strong><br/>
              <span style="font-size: 14px;">${doctorName}</span>
            </td>
          </tr>
        </table>

        <!-- Consultation sections -->
        ${consultationFormData.complaints ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Жалобы пациента</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.complaints}</p>
        </div>
        ` : ''}

        ${consultationFormData.anamnesis ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Анамнез заболевания</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.anamnesis}</p>
        </div>
        ` : ''}

        ${consultationFormData.diagnostics ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Обследование и диагностика</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.diagnostics}</p>
        </div>
        ` : ''}

        ${consultationFormData.diagnosis ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid; background: #f0f7ff; padding: 12px; border-left: 3px solid #1e3a5f;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase;">Диагноз</h3>
          <p style="margin: 0; font-size: 14px; color: #000; font-weight: bold; white-space: pre-wrap;">${consultationFormData.diagnosis}</p>
        </div>
        ` : ''}

        ${consultationFormData.treatment ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Назначенное лечение</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${consultationFormData.treatment}</p>
        </div>
        ` : ''}

        ${prescription ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid; background: #fff8e6; padding: 12px; border: 1px dashed #d4a000;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #8b6914; font-weight: bold; text-transform: uppercase;">Рецепт</h3>
          <p style="margin: 0; font-size: 14px; color: #000; white-space: pre-wrap;">${prescription}</p>
        </div>
        ` : ''}

        ${recommendations ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">Рекомендации</h3>
          <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${recommendations}</p>
        </div>
        ` : ''}

        ${sessionNotes ? `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 8px; font-size: 13px; color: #666; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Примечания</h3>
          <p style="margin: 0; font-size: 13px; color: #555; font-style: italic; text-align: justify; white-space: pre-wrap;">${sessionNotes}</p>
        </div>
        ` : ''}

        <!-- Footer with signature -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; vertical-align: bottom; padding: 10px 0;">
                <p style="margin: 0; font-size: 11px; color: #777;">Документ сформирован: ${formattedDate} ${formattedTime}</p>
                <p style="margin: 3px 0 0; font-size: 11px; color: #777;">© ZhanCare ${currentDate.getFullYear()}</p>
              </td>
              <td style="width: 50%; text-align: right; vertical-align: bottom; padding: 10px 0;">
                <div style="display: inline-block; text-align: left;">
                  <p style="margin: 0 0 5px; font-size: 12px; color: #333;">Лечащий врач: <strong>${doctorName}</strong></p>
                  ${signatureData
                    ? `<img src="${signatureData}" style="height: 50px; width: auto; margin: 5px 0;" alt="Подпись врача" />`
                    : `<div style="border-bottom: 1px solid #000; width: 150px; height: 30px; margin: 5px 0;"></div>`
                  }
                  <p style="margin: 5px 0 0; font-size: 11px; color: #555;">Подпись / М.П.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = pdfContent;
    document.body.appendChild(container);

    // Generate PDF
    const opt = {
      margin: 10,
      filename: `consultation_${(consultation.patient_name ?? 'patient').replace(/\s+/g, '_')}_${formattedDate.replace(/\./g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    const pdfFilename2 = opt.filename;
    try {
      const pdfBlob2: Blob = await html2pdf().set(opt).from(container).output('blob');
      const blobUrl2 = URL.createObjectURL(pdfBlob2);
      const a2 = globalThis.document.createElement('a');
      a2.href = blobUrl2; a2.download = pdfFilename2; a2.click();
      URL.revokeObjectURL(blobUrl2);
      await uploadPdfToPatient(pdfBlob2, pdfFilename2);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(container);
    }
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
      id: 'complaints' as const,
      label: 'Жалобы пациента',
      icon: faCommentMedical,
      hasFilled: !!consultationFormData.complaints
    },
    {
      id: 'anamnesis' as const,
      label: 'Анамнез',
      icon: faHistory,
      hasFilled: !!consultationFormData.anamnesis
    },
    {
      id: 'diagnostics' as const,
      label: 'Диагностика',
      icon: faFlask,
      hasFilled: !!consultationFormData.diagnostics
    },
    {
      id: 'treatment' as const,
      label: 'Лечение и рекомендации',
      icon: faPrescription,
      hasFilled: !!consultationFormData.treatment
    },
    {
      id: 'diagnosis' as const,
      label: 'Диагноз',
      icon: faDiagnoses,
      hasFilled: !!consultationFormData.diagnosis
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
              {/* 4 Main Form Buttons */}
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
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = '#202942';
                      e.currentTarget.style.color = '#bcc0ca';
                    }
                  }}
                  title={tab.label}
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
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'ai-chat') {
                    e.currentTarget.style.backgroundColor = '#202942';
                    e.currentTarget.style.color = '#bcc0ca';
                  }
                }}
                title="ИИ Ассистент"
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
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'transcription') {
                    e.currentTarget.style.backgroundColor = '#202942';
                    e.currentTarget.style.color = '#bcc0ca';
                  }
                }}
                title="Транскрипция"
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
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                title="Закрыть"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>
          </div>

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
                      icon={
                        activeTab === 'complaints' ? faCommentMedical :
                        activeTab === 'anamnesis' ? faHistory :
                        activeTab === 'diagnostics' ? faFlask :
                        activeTab === 'treatment' ? faPrescription :
                        activeTab === 'diagnosis' ? faDiagnoses :
                        activeTab === 'notes' ? faNotesMedical :
                        activeTab === 'prescription' ? faPrescriptionBottle :
                        activeTab === 'recommendations' ? faClipboardList :
                        activeTab === 'ai-chat' ? faRobot :
                        faMicrophone
                      }
                      className="text-lg"
                      style={{ color: '#ebf1ff' }}
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg" style={{ color: '#ebf1ff' }}>
                      {
                        activeTab === 'complaints' ? 'Жалобы пациента' :
                        activeTab === 'anamnesis' ? 'Анамнез' :
                        activeTab === 'diagnostics' ? 'Диагностика' :
                        activeTab === 'treatment' ? 'Лечение и рекомендации' :
                        activeTab === 'diagnosis' ? 'Диагноз' :
                        activeTab === 'notes' ? 'Заметки' :
                        activeTab === 'prescription' ? 'Рецепт' :
                        activeTab === 'recommendations' ? 'Рекомендации' :
                        activeTab === 'ai-chat' ? 'ИИ Ассистент' :
                        'Транскрипция'
                      }
                    </h2>
                    <p className="text-xs" style={{ color: '#bcc0ca' }}>{consultation.patient_name}</p>
                  </div>
                </div>
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

              {/* Form Panel Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* 5 Consultation Form Sections */}
                {activeTab === 'complaints' && (
                  <PatientComplaintsForm
                    value={consultationFormData.complaints}
                    onChange={(value) => handleFormUpdate('complaints', value)}
                  />
                )}

                {activeTab === 'anamnesis' && (
                  <AnamnesisForm
                    value={consultationFormData.anamnesis}
                    onChange={(value) => handleFormUpdate('anamnesis', value)}
                  />
                )}

                {activeTab === 'diagnostics' && (
                  <DiagnosticsForm
                    value={consultationFormData.diagnostics}
                    onChange={(value) => handleFormUpdate('diagnostics', value)}
                  />
                )}

                {activeTab === 'treatment' && (
                  <TreatmentRecommendationsForm
                    value={consultationFormData.treatment}
                    onChange={(value) => handleFormUpdate('treatment', value)}
                  />
                )}

                {activeTab === 'diagnosis' && (
                  <DiagnosisForm
                    value={consultationFormData.diagnosis}
                    onChange={(value) => handleFormUpdate('diagnosis', value)}
                  />
                )}

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
