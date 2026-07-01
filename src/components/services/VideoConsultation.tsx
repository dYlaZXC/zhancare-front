import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { websocketService, type DoctorAvailabilityChangeData } from "@/services/websocketService";
import { useLanguage } from "@/context/LanguageContext";

import Step1 from "./consultations/VideoConsultationStep1";
import Step2 from "./consultations/VideoConsultationStep2";
import Step3 from "./consultations/VideoConsultationStep3";
import { useConsultationPayment } from "@/components/payment/useConsultationPayment";
import TipsPanel from "./consultations/TipsPanel";
import OfflineBookingFlow from "./consultations/OfflineBookingFlow";
import DiagnosticsFlow from "./consultations/DiagnosticsFlow";
import HomeAppointments from "./HomeAppointments";
import PatientConsultationsTable from "./consultations/PatientConsultationsTable";
import type { Doctor } from "./consultations/types/doctor";
// import WebSocketTester from "../debug/WebSocketTester";

interface RecommendedDoctor {
  id: number;
  name: string;
  doctor_type: string;
  reason: string;
  urgency: "urgent" | "non_urgent";
}

interface AIErrorData {
  specialty: string;
  reason: string;
  raw: string;
}

interface VideoConsultationProps {
  skipAI?: boolean;
}

const HEADER_TEXT = {
  ru: { back: "Назад", offlineTitle: "Оффлайн приём", diagnosticsTitle: "Диагностика", homeTitle: "Вызов на дом", servicesTitle: "Мои услуги", onlineTitle: "Онлайн консультация", confirmTitle: "Подтверждение", step: "Шаг",
    symptomsExample: "Головная боль, температура 38.5, слабость, першение в горле" },
  kz: { back: "Артқа", offlineTitle: "Офлайн қабылдау", diagnosticsTitle: "Диагностика", homeTitle: "Үйге шақыру", servicesTitle: "Менің қызметтерім", onlineTitle: "Онлайн кеңес", confirmTitle: "Растау", step: "Қадам",
    symptomsExample: "Бас ауруы, температура 38.5, әлсіздік, тамақ ашуы" },
  en: { back: "Back", offlineTitle: "In-person visit", diagnosticsTitle: "Diagnostics", homeTitle: "Home visit", servicesTitle: "My Services", onlineTitle: "Online consultation", confirmTitle: "Confirmation", step: "Step",
    symptomsExample: "Headache, temperature 38.5, weakness, sore throat" },
  uz: { back: "Orqaga", offlineTitle: "Shifokor qabuli", diagnosticsTitle: "Diagnostika", homeTitle: "Uyga chaqirish", servicesTitle: "Mening xizmatlarim", onlineTitle: "Onlayn konsultatsiya", confirmTitle: "Tasdiqlash", step: "Qadam",
    symptomsExample: "Bosh og'rig'i, harorat 38.5, holsizlik, tomoq achishishi" },
};

const VideoConsultation: React.FC<VideoConsultationProps> = ({ skipAI = false }) => {
  // Generate unique ID for this component instance to track duplicates
  const componentInstanceId = useRef(Math.random().toString(36).substring(7));
  console.log(`🆔 VideoConsultation instance rendering: ${componentInstanceId.current}`);
  const { token } = useAuth();
  const { language } = useLanguage();
  const { pay: payForConsultation, loading: paymentLoading } = useConsultationPayment();
  const ht = HEADER_TEXT[language as keyof typeof HEADER_TEXT] ?? HEADER_TEXT.ru;
  const router = useRouter();
  const searchParams = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ doctorId: number; status: string; timestamp: number } | null>(null);

  const initialFlow = (() => {
    const f = searchParams?.get('flow');
    if (f === 'offline' || f === 'diagnostics') return f;
    return 'online';
  })();

  const [activeFlow, setActiveFlow] = useState<'online' | 'offline' | 'diagnostics' | 'home'>(initialFlow);
  const [step, setStep] = useState<1 | 2 | 3>(skipAI ? 2 : 1);
  const [diagStep, setDiagStep] = useState<number>(1);
  const [symptoms, setSymptoms] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [recommendedDoctor, setRecommendedDoctor] = useState<RecommendedDoctor | undefined>(undefined);
  const [aiErrorData, setAiErrorData] = useState<AIErrorData | undefined>();
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [aiRecommendationId, setAiRecommendationId] = useState<number | undefined>(undefined);
  const [scheduledConsultation, setScheduledConsultation] = useState<{
    id: number;
    scheduled_time: string;
    doctor_name: string;
    doctor_type: string;
    booking_type: 'urgent' | 'scheduled';
  } | null>(null);
  const [pendingConsultationData, setPendingConsultationData] = useState<{
    scheduled_time: string;
    doctor_id: number;
    ai_recommendation_id: number;
  } | null>(null);

  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingCall, setLoadingCall] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [websocketConnected, setWebsocketConnected] = useState(false);

  const fetchDoctors = useCallback(async (showToast = true) => {
    setFetchingDoctors(true);
    setDoctorsError(null);
    try {
      const res = await api.get("/public/doctors/available/", {
        headers: { Authorization: `Token ${token}` },
        params: { lang: 'ru' } // Request Russian by default, can be made dynamic later
      });

      // console.log("Enhanced doctor data:", res.data); // Debug log to see the new structure

      const filtered = res.data?.doctors?.filter(
        (doc: Doctor) =>
          doc.doctor_type !== "Сестринское дело" && // Exclude nurses
          doc.is_active !== false &&                 // Exclude inactive doctors
          doc.is_deleted !== true                    // Exclude deleted doctors
      );
      setDoctors(filtered || []);

      if ((filtered || []).length === 0) {
        setDoctorsError("В данный момент нет доступных врачей. Попробуйте позже или врачи появятся автоматически при изменении их статуса.");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.status === 404
        ? "В данный момент нет доступных врачей. Попробуйте позже или врачи появятся автоматически при изменении их статуса."
        : "Ошибка загрузки врачей. Проверьте подключение к интернету.";

      setDoctorsError(errorMessage);
      setDoctors([]);

      if (showToast) {
        toast.error(`⚠️ ${errorMessage}`);
      }
    } finally {
      setFetchingDoctors(false);
    }
  }, [token]);

  const cancelConsultation = useCallback(() => {
    setWaiting(false);
    setConnecting(false);
    setMeetingId(null);
    toast.info("🚫 Консультация отменена.");
  }, []);


  // Initialize WebSocket connection
  useEffect(() => {
    if (!token) {
      toast.error("❌ Вы не авторизованы. Пожалуйста, войдите.");
      return;
    }

    // Connect to WebSocket (optional - if backend WebSocket is available)
    // Silently fail if WebSocket is not available (development mode)
    const enableWebSocket = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'false';

    if (enableWebSocket) {
      websocketService.connect(token).catch(err => {
        // Silently fail - WebSocket is optional
        console.debug('WebSocket connection failed (optional feature):', err);
      });
    }

    // Setup WebSocket event handlers
    const handleWebSocketConnect = () => {
      console.log('✅✅✅ WebSocket CONNECTED in VideoConsultation ✅✅✅');
      console.log('WebSocket service state:', {
        connected: websocketService.connected,
        authenticated: websocketService.authenticated,
        status: websocketService.connectionStatus
      });
      setWebsocketConnected(true);
    };

    const handleWebSocketDisconnect = () => {
      console.log('❌❌❌ WebSocket DISCONNECTED in VideoConsultation ❌❌❌');
      setWebsocketConnected(false);
    };

    const handleDoctorAvailabilityChange = (eventData: { data: DoctorAvailabilityChangeData } | DoctorAvailabilityChangeData) => {
      console.log(`🔥🔥🔥 HANDLER CALLED from instance ${componentInstanceId.current}`);
      console.log('🔥 Call stack:', new Error().stack);
      // Extract the actual data from the event wrapper
      const wsData = 'data' in eventData ? eventData.data : eventData;
      console.log('👩‍⚕️ Doctor availability changed - RAW EVENT:', eventData);
      console.log('👩‍⚕️ Doctor availability changed - EXTRACTED DATA:', wsData);

      const { doctor_id, availability_status, old_status, data: fullDoctorData } = wsData;
      console.log(`👩‍⚕️ Doctor ID: ${doctor_id}, Status: ${old_status} → ${availability_status}`);
      console.log('📦 Full doctor data from WebSocket:', fullDoctorData);

      // Helper function to show toast only once per doctor status change
      const showToastOnce = (toastFn: () => void) => {
        const now = Date.now();
        const lastToast = lastToastRef.current;

        // Only show toast if we haven't shown one for this doctor+status in the last 1 second
        if (!lastToast ||
            lastToast.doctorId !== doctor_id ||
            lastToast.status !== availability_status ||
            now - lastToast.timestamp > 1000) {

          lastToastRef.current = { doctorId: doctor_id, status: availability_status, timestamp: now };
          setTimeout(toastFn, 0);
        } else {
          console.log(`⏭️ Skipping duplicate toast for doctor ${doctor_id} status ${availability_status}`);
        }
      };

      setDoctors(prevDoctors => {
        const existingDoctorIndex = prevDoctors.findIndex(doctor => doctor.id === doctor_id);

        // Doctor is already in the list - update with full WebSocket data
        if (existingDoctorIndex !== -1) {
          // Check if status actually changed
          if (prevDoctors[existingDoctorIndex].availability_status === availability_status) {
            console.log(`⏭️ Doctor ${doctor_id} status unchanged, skipping update`);
            return prevDoctors;
          }

          // Handle offline status - remove doctor from list
          if (availability_status === 'offline') {
            console.log(`🔴 Doctor ${doctor_id} went offline, removing from list`);
            const updatedDoctors = prevDoctors.filter(doctor => doctor.id !== doctor_id);

            // Reset selection if offline doctor was selected
            if (selectedDoctorId === doctor_id) {
              setSelectedDoctorId(null);
            }

            // Show notification AFTER render (with duplicate prevention)
            const doctorName = fullDoctorData?.name || wsData.doctor_info?.name || 'Врач';
            showToastOnce(() => {
              toast.info(`⚠️ ${doctorName} завершил работу.`, {
                autoClose: 5000,
                position: 'top-right'
              });
            });

            return updatedDoctors;
          }

          // Update doctor with FULL data from WebSocket (available, busy, break)
          console.log(`🔄 Updating doctor ${doctor_id} with full WebSocket data`);
          const updatedDoctors = [...prevDoctors];

          // Use full doctor data if available, otherwise merge with existing data
          if (fullDoctorData) {
            updatedDoctors[existingDoctorIndex] = fullDoctorData as any;
          } else {
            updatedDoctors[existingDoctorIndex] = {
              ...updatedDoctors[existingDoctorIndex],
              availability_status: availability_status as any
            };
          }

          // Show notification AFTER render (with duplicate prevention)
          const doctorName = fullDoctorData?.name || wsData.doctor_info?.name || 'Врач';
          const statusText = availability_status === 'available' ? 'теперь доступен' :
                            availability_status === 'busy' ? 'занят' :
                            availability_status === 'break' ? 'на перерыве' : 'изменил статус';

          showToastOnce(() => {
            toast.success(`✅ ${doctorName} ${statusText}!`, {
              autoClose: 3000,
              position: 'top-right'
            });
          });

          return updatedDoctors;
        }

        // Doctor not in list - add them if they're becoming available
        else {
          if (availability_status === 'available' && fullDoctorData) {
            console.log(`➕ Adding new available doctor ${doctor_id} from WebSocket`);

            // Show notification AFTER render (with duplicate prevention)
            showToastOnce(() => {
              toast.success(`✅ ${fullDoctorData.name} теперь доступен для консультации!`, {
                autoClose: 5000,
                position: 'top-right'
              });
            });

            return [...prevDoctors, fullDoctorData as any];
          }

          // Don't add doctors with other statuses
          console.log(`⏭️ Doctor ${doctor_id} not in list and status is ${availability_status}, ignoring`);
          return prevDoctors;
        }
      });
    };

    const handleConsultationStatusChange = (data: any) => {
      console.log('🏥 Consultation status changed:', data);

      const consultation = data.consultation || data.data?.consultation || data;

      if (!consultation) {
        console.log('⚠️ No consultation data in status change event');
        return;
      }

      console.log(`📋 Consultation ${consultation.id} status: ${consultation.old_status} → ${consultation.new_status}`);
      console.log(`🔍 Current meetingId: ${meetingId}, Event meetingId: ${consultation.meeting_id}`);

      // Handle status changes for the current consultation (exact meeting ID match)
      if (meetingId && consultation.meeting_id === meetingId) {
        console.log(`✅ Exact meeting ID match - handling status change`);

        if (consultation.new_status === 'ongoing') {
          setConnecting(true);
          toast.success("✅ Доктор подключился. Подождите, подключаемся к консультации...");
          // Clear any existing polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setWaiting(false);

          // Add a small delay to show the connecting state
          setTimeout(() => {
            router.push(`/video-call/patient?meetingId=${meetingId}`);
          }, 1500);
        } else if (consultation.new_status === 'cancelled') {
          toast.error("❌ Доктор отклонил консультацию. Попробуйте выбрать другого врача.");
          cancelConsultation();
        } else if (consultation.new_status === 'missed') {
          toast.error("⏰ Доктор не ответил в течение времени ожидания. Попробуйте выбрать другого врача.");
          cancelConsultation();
        }
      }
      // Fallback: if patient is waiting and any consultation is cancelled or missed, check if it's relevant
      else if (waiting && (consultation.new_status === 'cancelled' || consultation.new_status === 'missed')) {
        // console.log(`🔄 Patient waiting, checking cancellation/missed relevance`);

        // Handle auto-decline/timeout scenarios where:
        // 1. Patient is waiting but hasn't gotten a meeting ID yet (meetingId is null)
        // 2. The consultation is urgent (auto-decline from doctor popup timer)
        // 3. Or any cancellation/missed when we don't have a meeting ID yet
        if (!meetingId || consultation.is_urgent) {
          // console.log(`⚠️ Applying fallback cancellation logic - no meetingId or urgent consultation`);
          if (consultation.new_status === 'missed') {
            toast.error("⏰ Доктор не ответил в течение времени ожидания. Попробуйте выбрать другого врача.");
          } else {
            toast.error("❌ Доктор отклонил консультацию. Попробуйте выбрать другого врача.");
          }
          cancelConsultation();
        }
      }
    };

    // Subscribe to WebSocket events
    console.log(`📝 [Instance ${componentInstanceId.current}] Registering WebSocket event handlers`);
    websocketService.on('connect', handleWebSocketConnect);
    websocketService.on('disconnect', handleWebSocketDisconnect);
    websocketService.onDoctorAvailabilityChanged(handleDoctorAvailabilityChange);
    console.log(`📝 [Instance ${componentInstanceId.current}] Doctor availability handler registered`);
    websocketService.on('consultation_status_changed', handleConsultationStatusChange);

    // Initial doctor fetch
    fetchDoctors();

    // Cleanup WebSocket on unmount
    return () => {
      console.log(`🧹 [Instance ${componentInstanceId.current}] Cleaning up WebSocket event handlers`);
      websocketService.off('connect', handleWebSocketConnect);
      websocketService.off('disconnect', handleWebSocketDisconnect);
      websocketService.offDoctorAvailabilityChanged(handleDoctorAvailabilityChange);
      console.log(`🧹 [Instance ${componentInstanceId.current}] Doctor availability handler unregistered`);
      websocketService.off('consultation_status_changed', handleConsultationStatusChange);
      websocketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // fetchDoctors removed to prevent duplicate WebSocket handler registration

  useEffect(() => {
    if (waiting && meetingId) {
      console.log(`🔌 Starting to listen for consultation status changes for meeting: ${meetingId}`);
      console.log(`🔌 WebSocket connected: ${websocketConnected}`);
      console.log(`🔌 WebSocket service connected: ${websocketService.connected}`);

      // Set up polling as a fallback mechanism to check consultation status
      const pollConsultationStatus = async () => {
        try {
          const response = await api.get(`/consultations/${meetingId}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          const consultation = response.data;
          console.log(`🔄 Polling consultation status: ${consultation.status}`);

          if (consultation.status === 'ongoing') {
            console.log('✅ Doctor accepted via polling - redirecting');
            setConnecting(true);
            toast.success("✅ Доктор подключился. Подождите, подключаемся к консультации...");
            setWaiting(false);

            // Add a small delay to show the connecting state
            setTimeout(() => {
              router.push(`/video-call/patient?meetingId=${meetingId}`);
            }, 1500);
          } else if (consultation.status === 'cancelled') {
            toast.error("❌ Доктор отклонил консультацию. Попробуйте выбрать другого врача.");
            cancelConsultation();
          } else if (consultation.status === 'missed') {
            toast.error("⏰ Доктор не ответил в течение времени ожидания. Попробуйте выбрать другого врача.");
            cancelConsultation();
          }
        } catch (error) {
          console.error('❌ Error polling consultation status:', error);
        }
      };

      // Poll every 3 seconds as fallback
      const pollingInterval = setInterval(pollConsultationStatus, 3000);

      // Set up timeout for consultation waiting period
      const timeoutDuration = 2 * 60 * 1000; // 2 minutes
      const timeoutRef = setTimeout(() => {
        if (waiting) {
          toast.error("⏳ Время ожидания истекло.");
          cancelConsultation();
        }
      }, timeoutDuration);

      return () => {
        clearTimeout(timeoutRef);
        clearInterval(pollingInterval);
      };
    }
    // Dependencies are intentionally limited to prevent re-triggering the polling loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, meetingId]);

  const requestAIRecommendation = async (symptomsText: string) => {
    if (loadingAI || !token || !symptomsText.trim()) return;

    setLoadingAI(true);
    setRecommendedDoctor(undefined);
    setAiErrorData(undefined);
    setFallbackUsed(false);
    setSymptoms(symptomsText); // Update symptoms state

    try {
      const res = await api.post(
        "/consultations/ai-recommend/",
        { symptoms: symptomsText, language: "ru" },
        { headers: { Authorization: `Token ${token}` } }
      );

      // console.log("AI response:", res.data);

      if (res.data.success && res.data.recommended_doctor) {
        const doctor = res.data.recommended_doctor;
        const urgency = doctor.urgency === "urgent" ? "urgent" : "non_urgent";
        // console.log("Urgency extracted from recommended_doctor:", urgency);

        setRecommendedDoctor({
          ...doctor,
          urgency,
        });

        // Store the AI recommendation ID for timeslot booking
        if (res.data.ai_recommendation_id) {
          setAiRecommendationId(res.data.ai_recommendation_id);
          // console.log("AI recommendation ID stored:", res.data.ai_recommendation_id);
        }

        setSelectedDoctorId(doctor.id);
        toast.success(`🤖 AI рекомендовал врача: ${doctor.name}`);
      } else if (!res.data.success && res.data.ai_data) {
        const fallback = doctors.find((d) =>
          d.doctor_type.toLowerCase().includes("терапевт")
        );

        if (fallback) {
          const urgency =
            res.data.ai_data?.urgency === "non_urgent" ? "non_urgent" : "urgent";

          // console.log("Fallback urgency (from ai_data or default):", urgency);

          setRecommendedDoctor({
            id: fallback.id,
            name: fallback.name,
            doctor_type: fallback.doctor_type,
            reason: "Врач общей практики поможет оценить состояние.",
            urgency,
          });

          setSelectedDoctorId(fallback.id);
          setAiErrorData(res.data.ai_data);
          setFallbackUsed(true);

          // Store AI recommendation ID for fallback case too
          if (res.data.ai_recommendation_id) {
            setAiRecommendationId(res.data.ai_recommendation_id);
            // console.log("AI recommendation ID stored (fallback):", res.data.ai_recommendation_id);
          }

          toast.info("❌ Специалист не найден. Назначен терапевт.");
        } else {
          setAiErrorData(res.data.ai_data);
          toast.warn("❌ AI дал рекомендацию, но подходящих врачей не найдено.");
        }
      }
    } catch (error) {
      toast.error("⚠️ Ошибка AI.");
      console.error("AI Recommendation Error:", error);
    } finally {
      setLoadingAI(false);
      setStep(2);
    }
  };

  // Wrapper for Step 1 - just navigates to Step 2 (no AI logic)
  const handleAIRecommend = () => {
    // Always clear all AI-related state when coming from Step 1
    setSymptoms('');
    setRecommendedDoctor(undefined);
    setAiErrorData(undefined);
    setFallbackUsed(false);
    setAiRecommendationId(undefined);
    setSelectedDoctorId(null);

    // Just move to Step 2 - AI recommendation happens there if user wants it
    setStep(2);
  };

  // Clear symptoms and allow user to enter new ones
  const handleClearSymptoms = () => {
    setSymptoms('');
    setRecommendedDoctor(undefined);
    setAiErrorData(undefined);
    setFallbackUsed(false);
    setAiRecommendationId(undefined);
    setSelectedDoctorId(null);
  };

  const handleScheduleConsultation = async () => {
    if (!pendingConsultationData) {
      toast.error("⚠️ Данные для планирования консультации отсутствуют.");
      return;
    }

    const doctor = doctors.find(d => d.id === pendingConsultationData.doctor_id);
    const priceRaw = doctor?.online_consultation_price;
    const amount = priceRaw ? Math.round(Number(priceRaw)) : 5000;
    const doctorName = doctor ? doctor.name.split(" ")[0] : "врачом";
    const description = `Онлайн консультация с ${doctorName}`;

    setLoadingCall(true);
    try {
      await payForConsultation({
        paymentType: "online",
        amount,
        description,
        bookingData: {
          doctor_id: pendingConsultationData.doctor_id,
          scheduled_time: pendingConsultationData.scheduled_time,
          consultation_type: "online",
          ai_recommendation_id: pendingConsultationData.ai_recommendation_id ?? null,
        },
      });

      toast.success("✅ Оплата прошла! Консультация запланирована. Можете подключиться в назначенное время.");
      setScheduledConsultation(null);
      setPendingConsultationData(null);
      setSelectedDoctorId(null);
      setRecommendedDoctor(undefined);
      setSymptoms("");
      setAiRecommendationId(undefined);
      setStep(1);
    } catch (err: any) {
      if (err?.message !== "Payment cancelled") {
        toast.error(err?.message ?? "⚠️ Не удалось завершить оплату. Попробуйте снова.");
      }
    } finally {
      setLoadingCall(false);
    }
  };

  // Derived price for the pending consultation — shown in Step 3 before the payment widget opens
  const pendingConsultationPrice = useMemo(() => {
    if (!pendingConsultationData) return null;
    const doctor = doctors.find(d => d.id === pendingConsultationData.doctor_id);
    const raw = doctor?.online_consultation_price;
    return raw ? Math.round(Number(raw)) : 5000;
  }, [pendingConsultationData, doctors]);

  // COMMENTED OUT: Urgent consultations removed - all consultations now require time slot selection
  // const handleStartCall = async () => {
  //   if (!selectedDoctorId || !token) {
  //     toast.error("⚠️ Пожалуйста, выберите врача.");
  //     containerRef.current?.scrollIntoView({ behavior: "smooth" });
  //     return;
  //   }

  //   setLoadingCall(true);
  //   setWaiting(true);

  //   try {
  //     const res = await api.post(
  //       "/consultations/start/",
  //       {
  //         doctor_id: selectedDoctorId,
  //         symptoms,
  //         is_urgent: false  // Always false now - no urgent consultations
  //       },
  //       { headers: { Authorization: `Token ${token}` } }
  //     );

  //     if (res.data?.meeting_id) {
  //       setMeetingId(res.data.meeting_id);
  //       toast.success("⏳ Ожидаем ответа врача...");
  //     } else {
  //       throw new Error("Invalid meeting ID response");
  //     }
  //   } catch (error) {
  //     console.error("❌ Error starting consultation:", error);
  //     toast.error("⚠️ Не удалось начать консультацию.");
  //     setWaiting(false);
  //   } finally {
  //     setLoadingCall(false);
  //   }
  // };

  const handleStartCall = handleScheduleConsultation;

  return (
    <div className="min-h-screen">
      {/* Mobile-first layout with minimal padding */}
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-screen">
          {/* Main content area - full width on mobile */}
          <div ref={containerRef} className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
            {/* Compact header section */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-3">
                {/* Back button for all non-root flows */}
                {(activeFlow !== 'online' || step > 1) && (
                  <button
                    onClick={() => {
                      if (activeFlow !== 'online') {
                        setActiveFlow('online'); setStep(1); setDiagStep(1);
                      } else {
                        setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {ht.back}
                  </button>
                )}
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#001E80]">
                  {activeFlow === 'offline' ? ht.offlineTitle
                    : activeFlow === 'diagnostics' ? ht.diagnosticsTitle
                    : activeFlow === 'home' ? ht.homeTitle
                    : step === 1 ? ht.servicesTitle
                    : step === 2 ? ht.onlineTitle
                    : ht.confirmTitle}
                </h2>
                {activeFlow === 'diagnostics' && (
                  <span className="text-xs font-semibold text-gray-400 ml-auto flex-shrink-0">{ht.step} {diagStep} / 3</span>
                )}
              </div>

              {/* Progress bar — all flows */}
              {activeFlow !== 'home' && (
                <div className="relative w-full">
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className="h-full transition-all duration-700 ease-in-out rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #12263a 0%, #29358f 50%, #3772ff 100%)',
                        width: activeFlow === 'offline' ? '50%'
                          : activeFlow === 'diagnostics' ? '33%'
                          : step === 1 ? '33%' : step === 2 ? '66%' : '100%',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 px-0">
                    {(activeFlow === 'online'
                      ? [1, 2, 3]
                      : activeFlow === 'offline' ? [1, 2]
                      : [1, 2, 3]
                    ).map((s) => (
                      <div
                        key={s}
                        className="w-2 h-2 rounded-full transition-all duration-500"
                        style={{ background: s === 1 ? 'linear-gradient(135deg, #29358f, #3772ff)' : '#d1d5db' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Debug component - remove in production */}
            {/* <WebSocketTester /> */}

            {/* Step content - no extra spacing */}
            <div className="w-full">
              {/* Offline flow */}
              {activeFlow === 'offline' && (
                <OfflineBookingFlow
                  doctors={doctors}
                  onBack={() => { setActiveFlow('online'); setStep(1); }}
                  onComplete={() => { setActiveFlow('online'); setStep(1); }}
                  onRequestAIRecommendation={requestAIRecommendation}
                  loadingAI={loadingAI}
                  recommendedDoctor={recommendedDoctor}
                  aiRecommendationId={aiRecommendationId}
                />
              )}

              {/* Diagnostics flow */}
              {activeFlow === 'diagnostics' && (
                <DiagnosticsFlow
                  onBack={() => { setActiveFlow('online'); setStep(1); setDiagStep(1); }}
                  onComplete={() => { setActiveFlow('online'); setStep(1); setDiagStep(1); }}
                  onStepChange={setDiagStep}
                />
              )}

              {/* Home visit flow */}
              {activeFlow === 'home' && (
                <HomeAppointments
                  onBack={() => { setActiveFlow('online'); setStep(1); }}
                />
              )}

              {/* Online flow */}
              {activeFlow === 'online' && step === 1 && (
                <div className="space-y-4">
                  {/* Service buttons at the top */}
                  <Step1
                    symptoms={symptoms}
                    onChange={setSymptoms}
                    onNext={handleAIRecommend}
                    onOffline={() => setActiveFlow('offline')}
                    onDiagnostics={() => setActiveFlow('diagnostics')}
                    onHome={() => setActiveFlow('home')}
                    loading={loadingAI}
                  />
                  {/* Consultation list below */}
                  <PatientConsultationsTable />
                </div>
              )}
              {activeFlow === 'online' && step === 2 && (
                <Step2
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  onSelect={setSelectedDoctorId}
                  loading={fetchingDoctors}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  symptoms={symptoms}
                  recommendedDoctor={recommendedDoctor}
                  aiErrorData={aiErrorData}
                  fallbackUsed={fallbackUsed}
                  aiRecommendationId={aiRecommendationId}
                  doctorsError={doctorsError}
                  websocketConnected={websocketConnected}
                  onRequestAIRecommendation={requestAIRecommendation}
                  loadingAI={loadingAI}
                  onClearSymptoms={handleClearSymptoms}
                  onConsultationBooked={(consultationId, consultationData) => {
                    // console.log("🎉 Consultation booked:", consultationId, consultationData);

                    // Find the selected doctor for the consultation details
                    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

                    if (consultationId === 0 && consultationData) {
                      // Step 2: Timeslot confirmed, not yet created
                      // IMPORTANT: prefer scheduled_time (UTC ISO, e.g. "...Z") over scheduled_at
                      // (naive local wall-clock string) — the backend expects an unambiguous,
                      // timezone-aware timestamp for book-dynamic-slot.
                      setPendingConsultationData({
                        scheduled_time: consultationData.scheduled_time || consultationData.scheduled_at,
                        doctor_id: consultationData.doctor_id,
                        ai_recommendation_id: consultationData.ai_recommendation_id
                      });

                      if (selectedDoctor) {
                        setScheduledConsultation({
                          id: 0, // Not created yet
                          scheduled_time: consultationData.scheduled_at || consultationData.scheduled_time,
                          doctor_name: selectedDoctor.name,
                          doctor_type: selectedDoctor.doctor_type || selectedDoctor.specialization?.name_ru || 'Врач',
                          booking_type: recommendedDoctor?.urgency === 'urgent' ? 'urgent' : 'scheduled'
                        });
                      }

                      toast.success("✅ Время для консультации выбрано!");
                    } else if (consultationId > 0) {
                      // Step 3: Actual consultation created
                      if (consultationData && selectedDoctor) {
                        setScheduledConsultation({
                          id: consultationId,
                          scheduled_time: consultationData.scheduled_at || consultationData.scheduled_time,
                          doctor_name: selectedDoctor.name,
                          doctor_type: selectedDoctor.doctor_type || selectedDoctor.specialization?.name_ru || 'Врач',
                          booking_type: recommendedDoctor?.urgency === 'urgent' ? 'urgent' : 'scheduled'
                        });
                      }
                      toast.success("✅ Консультация успешно создана!");
                    }

                    setStep(3);
                  }}
                />
              )}
              {activeFlow === 'online' && step === 3 && (
                <Step3
                  {...{
                    symptoms,
                    doctors,
                    selectedDoctorId,
                    onBack: () => setStep(2),
                    onCall: handleStartCall,
                    onScheduleConsultation: handleScheduleConsultation,
                    onCancel: cancelConsultation,
                    loading: loadingCall,
                    waiting,
                    connecting,
                    recommendedDoctor,
                    scheduledConsultation,
                    pendingConsultationData,
                    consultationPrice: pendingConsultationPrice,
                  } as any}
                />
              )}
            </div>
          </div>

          {/* Tips panel - hidden on mobile, sidebar on desktop */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0 p-6 bg-gray-50 border-l border-gray-200">
            <div className="sticky top-6">
              <TipsPanel
                step={step}
                onInsertExample={() => setSymptoms(ht.symptomsExample)}
                recommendedDoctor={recommendedDoctor}
                aiErrorData={aiErrorData}
                fallbackUsed={fallbackUsed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;