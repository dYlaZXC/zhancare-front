"use client";

export default function DoctorPatientsPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-[#001E80]">
        История пациентов
      </h1>
      <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            История пациентов
          </h3>
          <p className="text-gray-600">
            Здесь будет отображаться история ваших консультаций и пациенты
          </p>
        </div>
      </div>
    </div>
  );
}
