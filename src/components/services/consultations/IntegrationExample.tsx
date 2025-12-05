/**
 * INTEGRATION EXAMPLE: How to add timeslot functionality to your existing VideoConsultationStep2
 *
 * This shows how to modify your current VideoConsultationStep2.tsx to include timeslot support
 */

import React, { useState, useEffect } from 'react';
import TimeslotBooking from './TimeslotBooking';

// Add these props to your existing Step2Props interface:
interface EnhancedStep2Props {
  // ... your existing props
  doctors: any[];
  selectedDoctorId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  symptoms: string;
  recommendedDoctor?: {
    id: number;
    name: string;
    doctor_type: string;
    reason: string;
    urgency: string; // Add this field
    confidence?: number;
  };

  // NEW PROPS FOR TIMESLOT INTEGRATION:
  aiRecommendationId?: number; // ID from your AI analysis
  onConsultationBooked?: (consultationId: number) => void; // Callback when consultation is booked
}

const VideoConsultationStep2WithTimeslots: React.FC<EnhancedStep2Props> = ({
  doctors,
  selectedDoctorId,
  onSelect,
  loading,
  onBack,
  onNext,
  symptoms,
  recommendedDoctor,
  aiRecommendationId,
  onConsultationBooked,
}) => {
  const [showTimeslotBooking, setShowTimeslotBooking] = useState(false);

  // Check if consultation is urgent
  const isUrgent = recommendedDoctor?.urgency === 'urgent';

  // Handle doctor selection
  const handleDoctorSelect = async (doctorId: number) => {
    onSelect(doctorId);

    // If we have AI recommendation data, process it
    if (aiRecommendationId && recommendedDoctor) {
      if (isUrgent) {
        // For urgent consultations, create consultation immediately
        await createUrgentConsultation(doctorId);
      } else {
        // For non-urgent consultations, show timeslot selection
        setShowTimeslotBooking(true);
      }
    } else {
      // Regular flow without AI processing
      onNext();
    }
  };

  // Create urgent consultation
  const createUrgentConsultation = async (doctorId: number) => {
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

      if (response.ok) {
        const data = await response.json();
        if (data.consultation) {
          onConsultationBooked?.(data.consultation.id);
        }
      }
    } catch (error) {
      console.error('Error creating urgent consultation:', error);
      // Fallback to regular flow
      onNext();
    }
  };

  // Handle timeslot booking completion
  const handleTimeslotBookingComplete = (consultationId: number) => {
    onConsultationBooked?.(consultationId);
  };

  // If showing timeslot booking, render that instead
  if (showTimeslotBooking && selectedDoctorId && aiRecommendationId) {
    return (
      <TimeslotBooking
        doctorId={selectedDoctorId}
        aiRecommendationId={aiRecommendationId}
        urgency={recommendedDoctor?.urgency as "urgent" | "non_urgent" || "non_urgent"}
        onBookingComplete={handleTimeslotBookingComplete}
        onBack={() => setShowTimeslotBooking(false)}
      />
    );
  }

  // YOUR EXISTING DOCTOR SELECTION UI GOES HERE
  // Just replace onSelect with handleDoctorSelect

  return (
    <div className="your-existing-step2-ui">
      {/* Add urgency warning if needed */}
      {isUrgent && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <span>🚨</span>
            <strong>Экстренная консультация</strong>
          </div>
          <p className="text-red-700 text-sm mt-1">
            AI определил, что ваши симптомы требуют немедленного внимания.
            При выборе врача консультация начнется автоматически.
          </p>
        </div>
      )}

      {/* Your existing doctor cards/list */}
      {doctors.map((doctor) => (
        <div
          key={doctor.id}
          onClick={() => handleDoctorSelect(doctor.id)} // Changed from onSelect to handleDoctorSelect
          className="doctor-card-your-existing-styles"
        >
          {/* Your existing doctor card content */}
        </div>
      ))}

      {/* Your existing buttons */}
      <div className="flex gap-3">
        <button onClick={onBack}>Назад</button>

        {/* Only show "Continue" for non-AI flows */}
        {!aiRecommendationId && (
          <button
            onClick={onNext}
            disabled={!selectedDoctorId}
          >
            Продолжить
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoConsultationStep2WithTimeslots;

/*
 * USAGE IN YOUR MAIN CONSULTATION COMPONENT:
 *
 * 1. Replace VideoConsultationStep2 with VideoConsultationStep2WithTimeslots
 * 2. Add aiRecommendationId prop (get this from your AI analysis)
 * 3. Add onConsultationBooked callback
 *
 * Example:
 *
 * <VideoConsultationStep2WithTimeslots
 *   doctors={doctors}
 *   selectedDoctorId={selectedDoctorId}
 *   onSelect={setSelectedDoctorId}
 *   loading={loading}
 *   onBack={handleBack}
 *   onNext={handleNext}
 *   symptoms={symptoms}
 *   recommendedDoctor={aiRecommendation}
 *   aiRecommendationId={aiRecommendation?.id} // Add this
 *   onConsultationBooked={(id) => {
 *     // Handle successful booking
 *     router.push(`/video-call?meetingId=${id}`);
 *   }}
 * />
 */