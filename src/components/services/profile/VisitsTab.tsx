"use client";

import { Appointment } from "./types";

interface VisitsTabProps {
  appointments: Appointment[];
}

export const VisitsTab = ({ appointments }: VisitsTabProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Домашние визиты</h4>
      {appointments.length > 0 ? (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{appointment.doctor_name}</p>
                <p className="text-sm text-gray-600">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : appointment.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {appointment.status === 'completed' ? 'Завершен' : 
                     appointment.status === 'scheduled' ? 'Запланирован' : 'Отменен'}
                  </span>
                </p>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(appointment.appointment_time).toLocaleDateString('ru-RU')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Нет записей о визитах</p>
      )}
    </div>
  );
};