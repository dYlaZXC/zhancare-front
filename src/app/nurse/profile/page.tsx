"use client";

export default function NurseProfilePage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-[#001E80]">
        Профиль медсестры
      </h1>
      <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Профиль медсестры
          </h3>
          <p className="text-gray-600">
            Здесь будет отображаться информация о вашем профиле
          </p>
        </div>
      </div>
    </div>
  );
}
