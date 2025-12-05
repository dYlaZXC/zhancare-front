import { useState, useCallback } from 'react';

interface ConsultationFlowState {
  aiRecommendationId?: number;
  urgency?: 'urgent' | 'non_urgent';
  selectedDoctorId?: number;
  consultationId?: number;
  step: 'symptoms' | 'doctor_selection' | 'timeslot_booking' | 'waiting' | 'in_call';
  error?: string;
  loading: boolean;
}

interface UseConsultationFlowReturn {
  state: ConsultationFlowState;
  processAIRecommendation: (aiRecommendationId: number, doctorId?: number) => Promise<void>;
  bookScheduledConsultation: (timeslotId: number) => Promise<void>;
  createUrgentConsultation: (doctorId: number) => Promise<void>;
  resetFlow: () => void;
  setStep: (step: ConsultationFlowState['step']) => void;
  setError: (error: string) => void;
}

export const useConsultationFlow = (): UseConsultationFlowReturn => {
  const [state, setState] = useState<ConsultationFlowState>({
    step: 'symptoms',
    loading: false,
  });

  const updateState = useCallback((updates: Partial<ConsultationFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Process AI recommendation and determine flow
  const processAIRecommendation = useCallback(async (
    aiRecommendationId: number,
    doctorId?: number
  ) => {
    updateState({ loading: true, error: undefined });

    try {
      const response = await fetch('/api/consultations/ai-process/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_recommendation_id: aiRecommendationId,
          preferred_doctor_id: doctorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обработки AI рекомендации');
      }

      const data = await response.json();

      updateState({
        aiRecommendationId,
        urgency: data.is_urgent ? 'urgent' : 'non_urgent',
        selectedDoctorId: data.recommended_doctor?.id,
        loading: false,
      });

      if (data.is_urgent) {
        // Urgent consultation created automatically
        updateState({
          consultationId: data.consultation?.id,
          step: 'waiting',
        });
      } else {
        // Non-urgent, proceed to timeslot selection
        updateState({
          step: 'timeslot_booking',
        });
      }

      return data;
    } catch (error: any) {
      console.error('Error processing AI recommendation:', error);
      updateState({
        error: error.message || 'Ошибка обработки AI рекомендации',
        loading: false,
      });
      throw error;
    }
  }, [updateState]);

  // Book a scheduled consultation with timeslot
  const bookScheduledConsultation = useCallback(async (timeslotId: number) => {
    updateState({ loading: true, error: undefined });

    try {
      const response = await fetch('/api/consultations/book-scheduled/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeslot_id: timeslotId,
          ai_recommendation_id: state.aiRecommendationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка бронирования консультации');
      }

      const data = await response.json();

      updateState({
        consultationId: data.consultation.id,
        step: 'waiting',
        loading: false,
      });

      return data.consultation;
    } catch (error: any) {
      console.error('Error booking consultation:', error);
      updateState({
        error: error.message || 'Ошибка бронирования консультации',
        loading: false,
      });
      throw error;
    }
  }, [state.aiRecommendationId, updateState]);

  // Create urgent consultation (legacy support)
  const createUrgentConsultation = useCallback(async (doctorId: number) => {
    updateState({ loading: true, error: undefined });

    try {
      // This would be your existing urgent consultation creation logic
      // For now, we'll use the AI process endpoint
      await processAIRecommendation(state.aiRecommendationId!, doctorId);
    } catch (error: any) {
      console.error('Error creating urgent consultation:', error);
      updateState({
        error: error.message || 'Ошибка создания экстренной консультации',
        loading: false,
      });
      throw error;
    }
  }, [state.aiRecommendationId, processAIRecommendation, updateState]);

  // Reset the entire flow
  const resetFlow = useCallback(() => {
    setState({
      step: 'symptoms',
      loading: false,
    });
  }, []);

  // Set specific step
  const setStep = useCallback((step: ConsultationFlowState['step']) => {
    updateState({ step });
  }, [updateState]);

  // Set error
  const setError = useCallback((error: string) => {
    updateState({ error, loading: false });
  }, [updateState]);

  return {
    state,
    processAIRecommendation,
    bookScheduledConsultation,
    createUrgentConsultation,
    resetFlow,
    setStep,
    setError,
  };
};