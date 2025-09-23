import React from 'react';
import { toast } from 'react-toastify';
import { websocketService } from '@/services/websocketService';
import { useAuth } from '@/context/AuthContext';

const WebSocketTester: React.FC = () => {
  const { token } = useAuth();

  const testDoctorAvailabilityToast = () => {
    // Manually trigger the doctor availability event for testing
    const testData = {
      doctor_id: 1,
      availability_status: 'available',
      doctor_info: {
        id: 1,
        name: 'Test Doctor',
        email: 'test@example.com',
        specialization: 'Test Specialty'
      },
      old_status: 'offline',
      availability_note: '',
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Testing doctor availability change toast with data:', testData);

    // Test the toast directly
    toast.success(`✅ Dr. ${testData.doctor_info.name} теперь доступен для консультации!`, {
      autoClose: 5000,
      position: 'top-right'
    });
  };

  const testWebSocketConnection = () => {
    console.log('🧪 Testing WebSocket connection');
    console.log('WebSocket connected:', websocketService.connected);
    console.log('WebSocket authenticated:', websocketService.authenticated);
    console.log('WebSocket status:', websocketService.connectionStatus);

    if (token) {
      websocketService.connect(token);
    } else {
      toast.error('No authentication token available');
    }
  };

  const simulateDoctorAvailabilityChange = () => {
    console.log('🧪 Simulating doctor availability change event');

    const testEventData = {
      data: {
        doctor_id: 1,
        availability_status: 'available',
        doctor_info: {
          id: 1,
          name: 'Simulated Doctor',
          email: 'sim@example.com',
          specialization: 'Cardiology'
        },
        old_status: 'offline',
        availability_note: '',
        timestamp: new Date().toISOString()
      }
    };

    // Trigger the event callback manually
    const callbacks = (websocketService as any).eventCallbacks.get('doctor_availability_changed');
    if (callbacks && callbacks.length > 0) {
      console.log('🧪 Found', callbacks.length, 'callbacks for doctor_availability_changed');
      callbacks.forEach((callback: any) => {
        callback(testEventData);
      });
    } else {
      console.log('🧪 No callbacks found for doctor_availability_changed');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">WebSocket Tester</h3>
      <div className="space-y-2">
        <button
          onClick={testDoctorAvailabilityToast}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Toast Notification
        </button>
        <button
          onClick={testWebSocketConnection}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Test WebSocket Connection
        </button>
        <button
          onClick={simulateDoctorAvailabilityChange}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Simulate Doctor Availability Event
        </button>
      </div>
      <div className="mt-4 p-2 bg-white rounded">
        <h4 className="font-semibold">Connection Status:</h4>
        <p>Connected: {websocketService.connected ? '✅' : '❌'}</p>
        <p>Authenticated: {websocketService.authenticated ? '✅' : '❌'}</p>
        <p>Status: {websocketService.connectionStatus}</p>
      </div>
    </div>
  );
};

export default WebSocketTester;