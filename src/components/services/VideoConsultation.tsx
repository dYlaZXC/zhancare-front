import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { websocketService, type DoctorAvailabilityChangeData } from "@/services/websocketService";

import Step1 from "./consultations/VideoConsultationStep1";
import Step2 from "./consultations/VideoConsultationStep2";
import Step3 from "./consultations/VideoConsultationStep3";
import TipsPanel from "./consultations/TipsPanel";
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

const VideoConsultation: React.FC<VideoConsultationProps> = ({ skipAI = false }) => {
  const { token } = useAuth();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(skipAI ? 2 : 1);
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
      const res = await api.get("/auth/doctor/available/", {
        headers: { Authorization: `Token ${token}` },
        params: { lang: 'ru' } // Request Russian by default, can be made dynamic later
      });

      // console.log("Enhanced doctor data:", res.data); // Debug log to see the new structure

      const filtered = res.data?.doctors?.filter(
        (doc: Doctor) => doc.doctor_type !== "Сестринское дело"
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
      console.log('🔌 WebSocket connected in VideoConsultation');
      setWebsocketConnected(true);
    };

    const handleWebSocketDisconnect = () => {
      console.log('🔌 WebSocket disconnected in VideoConsultation');
      setWebsocketConnected(false);
    };

    const handleDoctorAvailabilityChange = (eventData: { data: DoctorAvailabilityChangeData } | DoctorAvailabilityChangeData) => {
      // Extract the actual data from the event wrapper
      const data = 'data' in eventData ? eventData.data : eventData;
      console.log('👩‍⚕️ Doctor availability changed:', data);

      const { doctor_id, availability_status, doctor_info } = data;

      if (availability_status === 'available') {
        // Doctor became available - update existing doctor or add new one
        console.log(`✅ Dr. ${doctor_info.name} is now available`);

        setDoctors(prevDoctors => {
          // Check if doctor is already in the list
          const existingDoctorIndex = prevDoctors.findIndex(doctor => doctor.id === doctor_id);

          if (existingDoctorIndex !== -1) {
            // Update existing doctor's status
            const updatedDoctors = [...prevDoctors];
            updatedDoctors[existingDoctorIndex] = {
              ...updatedDoctors[existingDoctorIndex],
              availability_status: 'available' as const
            };
            return updatedDoctors;
          } else {
            // Doctor not in list - refresh the doctor list to get new doctors
            fetchDoctors(false);
            return prevDoctors;
          }
        });

        toast.success(`✅ Dr. ${doctor_info.name} теперь доступен для консультации!`, {
          autoClose: 5000,
          position: 'top-right'
        });
      } else {
        // Doctor status changed to unavailable - update status in place or remove if offline
        console.log(`⚠️ Dr. ${doctor_info.name} status changed to ${availability_status}`);

        setDoctors(prevDoctors => {
          const existingDoctorIndex = prevDoctors.findIndex(doctor => doctor.id === doctor_id);

          if (existingDoctorIndex !== -1) {
            if (availability_status === 'offline') {
              // Remove offline doctors completely
              const updatedDoctors = prevDoctors.filter(doctor => doctor.id !== doctor_id);

              // If the currently selected doctor became offline, reset selection
              if (selectedDoctorId === doctor_id) {
                setSelectedDoctorId(null);
                toast.info(`⚠️ Выбранный врач ${doctor_info.name} завершил работу. Пожалуйста, выберите другого врача.`);
              }

              // If no doctors left, show error message
              if (updatedDoctors.length === 0) {
                setDoctorsError("В данный момент нет доступных врачей. Попробуйте позже или врачи появятся автоматически при изменении их статуса.");
              }

              return updatedDoctors;
            } else {
              // Update doctor's status (busy, break, etc.) but keep them visible
              const updatedDoctors = [...prevDoctors];
              updatedDoctors[existingDoctorIndex] = {
                ...updatedDoctors[existingDoctorIndex],
                availability_status: availability_status as 'available' | 'busy' | 'offline' | 'break'
              };
              return updatedDoctors;
            }
          }

          return prevDoctors;
        });

        const statusText = availability_status === 'offline' ? 'завершил работу' :
                          availability_status === 'busy' ? 'занят' :
                          availability_status === 'break' ? 'на перерыве' : 'недоступен';

        toast.info(`ℹ️ Dr. ${doctor_info.name} ${statusText}`, {
          autoClose: 3000,
          position: 'top-right'
        });
      }
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
    websocketService.on('connect', handleWebSocketConnect);
    websocketService.on('disconnect', handleWebSocketDisconnect);
    websocketService.onDoctorAvailabilityChanged(handleDoctorAvailabilityChange);
    websocketService.on('consultation_status_changed', handleConsultationStatusChange);

    // Initial doctor fetch
    fetchDoctors();

    // Cleanup WebSocket on unmount
    return () => {
      websocketService.off('connect', handleWebSocketConnect);
      websocketService.off('disconnect', handleWebSocketDisconnect);
      websocketService.offDoctorAvailabilityChanged(handleDoctorAvailabilityChange);
      websocketService.off('consultation_status_changed', handleConsultationStatusChange);
      websocketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fetchDoctors, selectedDoctorId]);

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

  const handleAIRecommend = async () => {
    if (loadingAI || !token) return;
    if (!symptoms.trim()) {
      toast.warn("⚠️ Пожалуйста, опишите симптомы.");
      return;
    }

    setLoadingAI(true);
    setRecommendedDoctor(undefined);
    setAiErrorData(undefined);
    setFallbackUsed(false);

    try {
      const res = await api.post(
        "/consultations/ai-recommend/",
        { symptoms, language: "ru" },
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

  const handleScheduleConsultation = async () => {
    if (!pendingConsultationData || !token) {
      toast.error("⚠️ Данные для планирования консультации отсутствуют.");
      return;
    }

    setLoadingCall(true);

    try {
      // console.log("🔄 Scheduling consultation...");
      const createRes = await api.post(
        "/consultations/book-dynamic-slot/",
        {
          doctor_id: pendingConsultationData.doctor_id,
          scheduled_time: pendingConsultationData.scheduled_time,
          ai_recommendation_id: pendingConsultationData.ai_recommendation_id
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (createRes.data?.consultation) {
        // console.log("✅ Consultation scheduled successfully:", createRes.data.consultation.id);

        // Show success message
        toast.success("✅ Консультация успешно запланирована! Вы можете подключиться к ней в назначенное время.");

        // Reset state
        setScheduledConsultation(null);
        setPendingConsultationData(null);
        setSelectedDoctorId(null);
        setRecommendedDoctor(undefined);
        setSymptoms("");
        setAiRecommendationId(undefined);

        // Return to Step 1
        setStep(1);
      }
    } catch (error) {
      console.error("❌ Error scheduling consultation:", error);
      toast.error("⚠️ Не удалось запланировать консультацию.");
    } finally {
      setLoadingCall(false);
    }
  };

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
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#001E80]">
                Видео консультация
              </h2>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    step === 1
                      ? "w-1/3 bg-blue-600"
                      : step === 2
                      ? "w-2/3 bg-blue-600"
                      : "w-full bg-blue-600"
                  }`}
                />
              </div>
            </div>

            {/* Debug component - remove in production */}
            {/* <WebSocketTester /> */}

            {/* Step content - no extra spacing */}
            <div className="w-full">
              {step === 1 && (
                <Step1
                  symptoms={symptoms}
                  onChange={setSymptoms}
                  onNext={handleAIRecommend}
                  loading={loadingAI}
                />
              )}
              {step === 2 && (
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
                  onConsultationBooked={(consultationId, consultationData) => {
                    // console.log("🎉 Consultation booked:", consultationId, consultationData);

                    // Find the selected doctor for the consultation details
                    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

                    if (consultationId === 0 && consultationData) {
                      // Step 2: Timeslot confirmed, not yet created
                      setPendingConsultationData({
                        scheduled_time: consultationData.scheduled_at || consultationData.scheduled_time,
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
              {step === 3 && (
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
                onInsertExample={() => setSymptoms("Головная боль, температура 38.5, слабость, першение в горле")}
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