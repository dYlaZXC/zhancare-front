"use client";

import { Consultation } from "./types";

interface ConsultationsTabProps {
  consultations: Consultation[];
}

export const ConsultationsTab = ({ consultations }: ConsultationsTabProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Последние консультации</h4>
      {consultations.length > 0 ? (
        <div className="space-y-3">
          {consultations.map((consultation) => (
            <div
              key={consultation.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {consultation.doctor_first_name} {consultation.doctor_last_name}
                </p>
                <p className="text-sm text-gray-600">{consultation.doctor_specialty}</p>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(consultation.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Нет записей о консультациях</p>
      )}
    </div>
  );
};
