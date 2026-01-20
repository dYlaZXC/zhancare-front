"use client";

export default function DoctorAppointmentsPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-[#001E80]">
        Ваши запланированные консультации
      </h1>
      <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Вызовы на дом
          </h3>
          <p className="text-gray-600">
            Здесь будут отображаться ваши запланированные визиты к пациентам
          </p>
        </div>
      </div>
    </div>
  );
}
