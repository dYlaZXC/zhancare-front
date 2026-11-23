"use client";

import { Video, Home } from "lucide-react";

interface EventTypeSelectorProps {
  eventType: 'consultation' | 'appointment';
  onChange: (type: 'consultation' | 'appointment') => void;
}

export default function EventTypeSelector({ eventType, onChange }: EventTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
        Тип записи
      </label>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange('consultation')}
          className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
            eventType === 'consultation'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Video className="w-6 h-6 mx-auto mb-2" style={{ color: '#3772ff' }} />
          <div className="font-semibold">Видеоконсультация</div>
        </button>
        <button
          type="button"
          onClick={() => onChange('appointment')}
          className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
            eventType === 'appointment'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Home className="w-6 h-6 mx-auto mb-2" style={{ color: '#059669' }} />
          <div className="font-semibold">Приём в клинике</div>
        </button>
      </div>
    </div>
  );
}
