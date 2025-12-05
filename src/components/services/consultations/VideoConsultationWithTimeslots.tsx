import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoConsultationStep1 from './VideoConsultationStep1'; // Your existing step 1
import VideoConsultationStep2Enhanced from './VideoConsultationStep2Enhanced';
import TimeslotBooking from './TimeslotBooking';
import { useConsultationFlow } from '@/hooks/useConsultationFlow';

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  rating?: number;
  experience?: number;
  availability?: string;
  avatar?: string;
  specialties?: string[];
}

interface AIRecommendation {
  id: number;
  urgency: 'urgent' | 'non_urgent';
  recommended_specialty: string;
  reason: string;
  matched_doctor?: Doctor;
}

interface VideoConsultationWithTimeslotsProps {
  onComplete?: (consultationId: number) => void;
  onCancel?: () => void;
}

const VideoConsultationWithTimeslots: React.FC<VideoConsultationWithTimeslotsProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const consultationFlow = useConsultationFlow();

  // Load doctors on component mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/doctors/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDoctors(data.doctors || data);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  // Handle step 1 next button (symptoms input)
  const handleStep1Next = () => {
    // Here you would normally call your AI analysis API
    // For now, we'll simulate AI recommendation
    simulateAIAnalysis();
    setCurrentStep(2);
  };

  // Simulate AI analysis (replace with your actual AI API call)
  const simulateAIAnalysis = async () => {
    // This is where you'd call your existing AI analysis endpoint
    // For demonstration, creating a mock AI recommendation
    const mockAIRecommendation: AIRecommendation = {
      id: Date.now(), // This should come from your AI API
      urgency: symptoms.toLowerCase().includes('экстренно') || symptoms.toLowerCase().includes('срочно')
        ? 'urgent'
        : 'non_urgent',
      recommended_specialty: 'терапевт', // This should come from AI analysis
      reason: 'На основе описанных симптомов рекомендуется консультация терапевта',
    };

    setAiRecommendation(mockAIRecommendation);
  };

  // Handle symptoms input change
  const handleSymptomsChange = (value: string) => {
    setSymptoms(value);
  };

  // Handle doctor selection
  const handleDoctorSelect = async (doctorId: number) => {
    setSelectedDoctorId(doctorId);

    if (aiRecommendation) {
      try {
        await consultationFlow.processAIRecommendation(aiRecommendation.id, doctorId);

        // The hook will handle setting the appropriate step
        if (consultationFlow.state.urgency === 'urgent') {
          // Urgent consultation created, move to waiting
          setCurrentStep(4); // Waiting step
        } else {
          // Non-urgent, move to timeslot selection
          setCurrentStep(3); // Timeslot step
        }
      } catch (error) {
        console.error('Error processing doctor selection:', error);
        // Handle error appropriately
      }
    }
  };

  // Handle timeslot booking completion
  const handleTimeslotBookingComplete = (consultationId: number) => {
    setCurrentStep(4); // Move to waiting step
    onComplete?.(consultationId);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);

      // Reset consultation flow state when going back
      if (currentStep === 3) {
        // Going back from timeslot to doctor selection
        consultationFlow.setStep('doctor_selection');
      }
    } else {
      onCancel?.();
    }
  };

  // Handle next navigation (for non-AI flows)
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AnimatePresence mode="wait">
        {/* Step 1: Symptoms Input */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <VideoConsultationStep1
              symptoms={symptoms}
              onChange={handleSymptomsChange}
              onNext={handleStep1Next}
              loading={loading}
            />
          </motion.div>
        )}

        {/* Step 2: Doctor Selection with AI Integration */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <VideoConsultationStep2Enhanced
              doctors={doctors}
              selectedDoctorId={selectedDoctorId}
              onSelect={handleDoctorSelect}
              loading={loading || consultationFlow.state.loading}
              onBack={handleBack}
              onNext={handleNext}
              symptoms={symptoms}
              recommendedDoctor={aiRecommendation ? {
                id: aiRecommendation.matched_doctor?.id || 0,
                name: aiRecommendation.matched_doctor?.name || '',
                doctor_type: aiRecommendation.recommended_specialty,
                reason: aiRecommendation.reason,
                urgency: aiRecommendation.urgency,
              } : undefined}
              aiRecommendationId={aiRecommendation?.id}
            />
          </motion.div>
        )}

        {/* Step 3: Timeslot Selection (for non-urgent consultations) */}
        {currentStep === 3 && selectedDoctorId && aiRecommendation && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <TimeslotBooking
              doctorId={selectedDoctorId}
              aiRecommendationId={aiRecommendation.id}
              urgency={aiRecommendation.urgency}
              onBookingComplete={handleTimeslotBookingComplete}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {/* Step 4: Waiting for Consultation */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  ⏰
                </motion.div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {aiRecommendation?.urgency === 'urgent'
                  ? 'Экстренная консультация создана'
                  : 'Консультация запланирована'
                }
              </h2>

              <p className="text-gray-600 mb-6">
                {aiRecommendation?.urgency === 'urgent'
                  ? 'Врач свяжется с вами в течение 5-10 минут'
                  : 'Мы отправили вам уведомление с деталями консультации'
                }
              </p>

              {consultationFlow.state.consultationId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>ID консультации:</strong> {consultationFlow.state.consultationId}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => onComplete?.(consultationFlow.state.consultationId || 0)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Перейти к консультации
                </button>

                <button
                  onClick={onCancel}
                  className="w-full text-gray-600 py-2 px-4 hover:text-gray-800 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {consultationFlow.state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <p className="font-medium">Ошибка</p>
          <p className="text-sm">{consultationFlow.state.error}</p>
          <button
            onClick={() => consultationFlow.setError('')}
            className="mt-2 text-xs underline"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoConsultationWithTimeslots;