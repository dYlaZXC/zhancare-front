"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faMapMarkerAlt, faClock, faUser, faPhone } from "@fortawesome/free-solid-svg-icons";

export default function NurseHomeVisits() {
  // Placeholder data - will be replaced with real API data later
  const [homeVisits] = useState([
    {
      id: 1,
      patientName: "Иванов Иван Иванович",
      address: "ул. Абая 123, кв. 45",
      time: "10:00",
      date: "2025-11-15",
      phone: "+7 777 123 4567",
      status: "scheduled"
    },
    {
      id: 2,
      patientName: "Петрова Мария Сергеевна",
      address: "ул. Сатпаева 67, кв. 12",
      time: "14:00",
      date: "2025-11-15",
      phone: "+7 777 234 5678",
      status: "scheduled"
    },
    {
      id: 3,
      patientName: "Смирнов Петр Александрович",
      address: "пр. Назарбаева 89, кв. 34",
      time: "16:30",
      date: "2025-11-15",
      phone: "+7 777 345 6789",
      status: "scheduled"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Запланирован";
      case "completed":
        return "Завершен";
      case "cancelled":
        return "Отменен";
      default:
        return "Неизвестно";
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
               style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
            <FontAwesomeIcon icon={faHome} className="text-lg" />
          </div>
          Мои вызовы на дом
        </h1>
        <p className="text-gray-600">Список запланированных вызовов на дом</p>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {homeVisits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <FontAwesomeIcon icon={faHome} className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Нет запланированных вызовов</p>
          </div>
        ) : (
          homeVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left side - Visit Info */}
                <div className="flex-1 space-y-3">
                  {/* Patient Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
                         style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                      <FontAwesomeIcon icon={faUser} className="text-sm" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{visit.patientName}</h3>
                      <p className="text-sm text-gray-500">Пациент</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 pl-13">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-gray-700 font-medium">{visit.address}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-3 pl-13">
                    <FontAwesomeIcon icon={faClock} className="text-blue-600" />
                    <p className="text-gray-700">
                      <span className="font-semibold">{visit.time}</span> • {visit.date}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 pl-13">
                    <FontAwesomeIcon icon={faPhone} className="text-blue-600" />
                    <a href={`tel:${visit.phone}`} className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      {visit.phone}
                    </a>
                  </div>
                </div>

                {/* Right side - Status & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3">
                  {/* Status Badge */}
                  <div className={`px-4 py-2 rounded-xl border font-semibold text-sm ${getStatusColor(visit.status)}`}>
                    {getStatusText(visit.status)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}
                    >
                      Детали
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State Message */}
      {homeVisits.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Всего вызовов: <span className="font-semibold">{homeVisits.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}
