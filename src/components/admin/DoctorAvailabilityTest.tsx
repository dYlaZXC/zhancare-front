"use client";

import React, { useState, useEffect } from "react";
import { websocketService, type DoctorAvailabilityChangeData } from "@/services/websocketService";
import DoctorAvailabilityToggle from "../doctor/DoctorAvailabilityToggle";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  availability_status: "available" | "busy" | "offline" | "break";
  availability_note?: string;
  last_seen?: string;
}

const DoctorAvailabilityTest: React.FC = () => {
  const { token, user, isDoctor } = useAuth();
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket
    websocketService.connect(token);

    // Setup WebSocket event handlers
    const handleWebSocketConnect = () => {
      // console.log('🔌 WebSocket connected in DoctorAvailabilityTest');
      setWebsocketConnected(true);
      addEvent('✅ WebSocket connected');
    };

    const handleWebSocketDisconnect = () => {
      // console.log('🔌 WebSocket disconnected in DoctorAvailabilityTest');
      setWebsocketConnected(false);
      // addEvent('❌ WebSocket disconnected');
    };

    const handleDoctorAvailabilityChange = (data: DoctorAvailabilityChangeData) => {
      // console.log('👩‍⚕️ Doctor availability changed:', data);
      const { doctor_id, availability_status, doctor_info, old_status } = data;

      const doctorName = doctor_info?.name || `Doctor #${doctor_id}`;
      addEvent(`👩‍⚕️ Dr. ${doctorName} status: ${old_status} → ${availability_status}`);

      // Update the doctors list if this is a test doctor
      fetchDoctors(false);
    };

    // Subscribe to WebSocket events
    websocketService.on('connect', handleWebSocketConnect);
    websocketService.on('disconnect', handleWebSocketDisconnect);
    websocketService.onDoctorAvailabilityChanged(handleDoctorAvailabilityChange);

    // Initial doctors fetch
    fetchDoctors();

    // Cleanup WebSocket on unmount
    return () => {
      websocketService.off('connect', handleWebSocketConnect);
      websocketService.off('disconnect', handleWebSocketDisconnect);
      websocketService.offDoctorAvailabilityChanged(handleDoctorAvailabilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]); // Keep last 20 events
  };

  const fetchDoctors = async (showToast = true) => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.get("/auth/doctor/available/", {
        headers: { Authorization: `Token ${token}` },
        params: { lang: 'ru' }
      });

      // console.log("Doctors data:", res.data);
      setAvailableDoctors(res.data?.doctors || []);

      if (showToast) {
        addEvent(`📋 Loaded ${res.data?.doctors?.length || 0} available doctors`);
      }
    } catch (error: any) {
      console.error('Failed to fetch doctors:', error);
      if (showToast) {
        addEvent('❌ Failed to load doctors');
      }
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUserDoctor = isDoctor;
  const currentUserAsDoctor = isCurrentUserDoctor ? {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    doctor_type: user.doctor_type || 'Doctor',
    availability_status: (user.availability_status && ['available', 'busy', 'offline', 'break'].includes(user.availability_status)
      ? user.availability_status
      : 'offline') as "available" | "busy" | "offline" | "break",
    availability_note: user.availability_note || '',
    last_seen: user.last_seen
  } : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Doctor Availability Real-time Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WebSocket Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${websocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                WebSocket: {websocketConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Current User Controls (if doctor) */}
            {isCurrentUserDoctor && currentUserAsDoctor && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Your Availability Status</h3>
                <DoctorAvailabilityToggle
                  currentStatus={currentUserAsDoctor.availability_status as any}
                  availabilityNote={currentUserAsDoctor.availability_note}
                  lastSeen={currentUserAsDoctor.last_seen}
                  onStatusChange={(newStatus) => {
                    addEvent(`🔄 You changed status to: ${newStatus}`);
                    // Update local state
                    if (currentUserAsDoctor) {
                      currentUserAsDoctor.availability_status = newStatus as "available" | "busy" | "offline" | "break";
                    }
                  }}
                />
              </div>
            )}

            {!isCurrentUserDoctor && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ℹ️ You are not logged in as a doctor. You can only observe availability changes.
                </p>
              </div>
            )}
          </div>

          {/* Real-time Events Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Real-time Events</h3>
              <button
                onClick={() => setEvents([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg h-64 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-gray-500">No events yet...</div>
              ) : (
                events.map((event, index) => (
                  <div key={index} className="mb-1">
                    {event}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Doctors List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Available Doctors</h2>
          <button
            onClick={() => fetchDoctors()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-2">Loading doctors...</p>
          </div>
        ) : availableDoctors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No available doctors at the moment</p>
            <p className="text-sm text-gray-500 mt-1">
              {websocketConnected ? '✅ Waiting for real-time updates...' : '❌ WebSocket not connected'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDoctors.map((doctor) => (
              <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {doctor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{doctor.name}</div>
                    <div className="text-sm text-gray-600">{doctor.doctor_type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    doctor.availability_status === 'available' ? 'bg-green-500' :
                    doctor.availability_status === 'busy' ? 'bg-yellow-500' :
                    doctor.availability_status === 'break' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">
                    {doctor.availability_status}
                  </span>
                </div>

                {doctor.availability_note && (
                  <div className="text-xs text-gray-500 mt-1">
                    {doctor.availability_note}
                  </div>
                )}

                {doctor.last_seen && (
                  <div className="text-xs text-gray-400 mt-1">
                    Last seen: {new Date(doctor.last_seen).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">Testing Instructions</h3>
        <div className="text-yellow-800 space-y-1 text-sm">
          <p>1. If you&apos;re logged in as a doctor, use the availability toggle above to change your status</p>
          <p>2. Open this page in another browser/tab while logged in as a different doctor</p>
          <p>3. Change availability status in one tab and watch real-time updates in the other</p>
          <p>4. Check the events log to see WebSocket messages</p>
          <p>5. The available doctors list should update automatically without page refresh</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailabilityTest;